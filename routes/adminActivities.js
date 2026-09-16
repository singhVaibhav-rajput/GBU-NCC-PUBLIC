const express = require("express");
const multer = require("multer");
const adminAuth = require("../middleware/adminAuth");
const supabase = require("../config/supabase");
const router = express.Router();
// Multer memory storage
const upload = multer({
    storage: multer.memoryStorage()
});

// ACTIVITIES LIST
router.get("/", adminAuth, async (req, res) => {
    try {
        const { data: activities, error } = await supabase
            .from("activities")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            console.log("❌ Admin activities error:", error);
            return res.status(500).send(
                "Unable to load activities"
            );
        }
        const activityCards = [];
        for (const activity of activities) {
            const { data: files } = await supabase.storage
                .from("activities")
                .list(activity.folder);
            const validFiles = files
                ? files.filter(file => file.name)
                : [];
            let coverImage = null;
            if (validFiles.length > 0) {
                const { data: publicUrlData } =
                    supabase.storage
                        .from("activities")
                        .getPublicUrl(
                            `${activity.folder}/${validFiles[0].name}`
                        );
                coverImage = publicUrlData.publicUrl;
            }
            activityCards.push({
                ...activity,
                coverImage,
                photoCount: validFiles.length
            });
        }

        res.render("admin/activities", {
            activities: activityCards
        });

    } catch (err) {
        console.log("❌ Admin activities error:", err);
        res.status(500).send(
            "Something went wrong"
        );
    }
});

// ADD ACTIVITY PAGE
router.get("/new", adminAuth, (req, res) => {
    res.render("admin/activity-form", {
        activity: null
    });
});

// CREATE ACTIVITY
router.post("/new",adminAuth,
    upload.array("photos", 20),
    async (req, res) => {
        try {
            const { title, description } = req.body;

            // Validate title
            if (!title || !title.trim()) {
                return res.status(400).send(
                    "Activity title is required"
                );
            }

            // Validate photos
            if (!req.files || req.files.length === 0) {
                return res.status(400).send(
                    "Please upload at least one photo"
                );
            }

            // CREATE SLUG
            const slug = title
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

            const folder = slug;

            // CHECK DUPLICATE
            const {
                data: existingActivity,
                error: existingError
            } = await supabase
                .from("activities")
                .select("id")
                .eq("slug", slug)
                .maybeSingle();

            if (existingError) {
                console.log(
                    "❌ Activity check error:",
                    existingError
                );
                return res.status(500).send(
                    "Database error"
                );
            }

            if (existingActivity) {
                return res.status(400).send(
                    "An activity with this title already exists"
                );
            }

            // UPLOAD PHOTOS
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const extension =
                    file.originalname
                        .split(".")
                        .pop()
                        .toLowerCase();

                const fileName =
                    `${Date.now()}-${i}.${extension}`;

                const filePath =
                    `${folder}/${fileName}`;

                const {
                    error: uploadError
                } = await supabase.storage
                    .from("activities")
                    .upload(
                        filePath,
                        file.buffer,
                        {
                            contentType: file.mimetype,
                            upsert: false
                        }
                    );

                if (uploadError) {
                    console.log(
                        "❌ Photo upload error:",
                        uploadError
                    );
                    return res.status(500).send(
                        "Unable to upload activity photos"
                    );
                }
            }

            // INSERT DATABASE RECORD

            const {
                error: insertError
            } = await supabase
                .from("activities")
                .insert({
                    slug: slug,
                    title: title.trim(),
                    description: description
                        ? description.trim()
                        : "",
                    folder: folder
                });

            if (insertError) {
                console.log(
                    "❌ Activity database error:",
                    insertError
                );
                return res.status(500).send(
                    "Unable to create activity"
                );
            }
            res.redirect("/admin/activities");
        } catch (err) {
            console.log(
                "❌ Add activity error:",
                err
            );
            res.status(500).send(
                "Something went wrong"
            );
        }
    }
);

// EDIT ACTIVITY PAGE
router.get("/:id/edit", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: activity, error } = await supabase
            .from("activities")
            .select("*")
            .eq("id", id)
            .single();
        if (error || !activity) {
            return res.status(404).send("Activity not found");
        }

        const { data: files, error: storageError } =
            await supabase.storage
                .from("activities")
                .list(activity.folder);

        if (storageError) {
            console.log(
                "❌ Storage error:",
                storageError
            );
            return res.status(500).send(
                "Unable to load activity photos"
            );
        }

        const photos = files
            .filter(file => file.name)
            .map(file => {
                const { data: publicUrlData } =
                    supabase.storage
                        .from("activities")
                        .getPublicUrl(
                            `${activity.folder}/${file.name}`
                        );
                return {
                    name: file.name,
                    url: publicUrlData.publicUrl
                };
            });
        res.render("admin/activity-edit", {
            activity,
            photos
        });
    } catch (err) {
        console.log(
            "❌ Edit activity page error:",
            err
        );
        res.status(500).send(
            "Something went wrong"
        );
    }
});

// UPDATE ACTIVITY
router.post("/:id/edit",
    adminAuth,
    upload.array("photos", 20),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description } = req.body;
            if (!title || !title.trim()) {
                return res.status(400).send(
                    "Activity title is required"
                );
            }

            // Get existing activity
            const {
                data: activity,
                error: activityError
            } = await supabase
                .from("activities")
                .select("*")
                .eq("id", id)
                .single();

            if (activityError || !activity) {
                return res.status(404).send(
                    "Activity not found"
                );
            }

            // Update database information
            const {
                error: updateError
            } = await supabase
                .from("activities")
                .update({
                    title: title.trim(),
                    description: description
                        ? description.trim()
                        : ""
                })
                .eq("id", id);

            if (updateError) {
                console.log(
                    "❌ Activity update error:",
                    updateError
                );
                return res.status(500).send(
                    "Unable to update activity"
                );
            }

            // Upload newly added photos
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    const extension =
                        file.originalname
                            .split(".")
                            .pop()
                            .toLowerCase();

                    const fileName =
                        `${Date.now()}-${i}.${extension}`;

                    const filePath =
                        `${activity.folder}/${fileName}`;

                    const {
                        error: uploadError
                    } = await supabase.storage
                        .from("activities")
                        .upload(
                            filePath,
                            file.buffer,
                            {
                                contentType: file.mimetype,
                                upsert: false
                            }
                        );

                    if (uploadError) {
                        console.log(
                            "❌ Photo upload error:",
                            uploadError
                        );
                        return res.status(500).send(
                            "Unable to upload new photos"
                        );
                    }
                }
            }
            res.redirect("/admin/activities");
        } catch (err) {
            console.log(
                "❌ Update activity error:",
                err
            );
            res.status(500).send(
                "Something went wrong"
            );
        }
    }
);

// DELETE ACTIVITY
router.post("/:id/delete", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Get activity
        const {
            data: activity,
            error: activityError
        } = await supabase
            .from("activities")
            .select("*")
            .eq("id", id)
            .single();

        if (activityError || !activity) {
            return res.status(404).send(
                "Activity not found"
            );
        }

        // GET ALL PHOTOS
        const {
            data: files,
            error: listError
        } = await supabase.storage
            .from("activities")
            .list(activity.folder);

        if (listError) {
            console.log(
                "❌ Unable to list activity photos:",
                listError
            );
            return res.status(500).send(
                "Unable to delete activity photos"
            );
        }

        // DELETE PHOTOS
        if (files && files.length > 0) {
            const filePaths = files
                .filter(file => file.name)
                .map(file =>
                    `${activity.folder}/${file.name}`
                );

            const {
                error: deleteStorageError
            } = await supabase.storage
                .from("activities")
                .remove(filePaths);

            if (deleteStorageError) {
                console.log(
                    "❌ Storage deletion error:",
                    deleteStorageError
                );
                return res.status(500).send(
                    "Unable to delete activity photos"
                );
            }
        }

        // DELETE DATABASE RECORD
        const {
            error: deleteDbError
        } = await supabase
            .from("activities")
            .delete()
            .eq("id", id);
        if (deleteDbError) {
            console.log(
                "❌ Database deletion error:",
                deleteDbError
            );
            return res.status(500).send(
                "Unable to delete activity"
            );
        }
        res.redirect("/admin/activities");
    } catch (err) {
        console.log(
            "❌ Delete activity error:",
            err
        );
        res.status(500).send(
            "Something went wrong"
        );
    }
});

router.post("/:id/photo/delete", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { fileName } = req.body;
        if (!fileName) {
            return res.status(400).send("Photo name is required");
        }
        // Find activity
        const { data: activity, error: activityError } =
            await supabase
                .from("activities")
                .select("*")
                .eq("id", id)
                .single();
        if (activityError || !activity) {
            return res.status(404).send("Activity not found");
        }

        const filePath = `${activity.folder}/${fileName}`;

        // Delete from Supabase Storage
        const { error: deleteError } =
            await supabase.storage
                .from("activities")
                .remove([filePath]);
        if (deleteError) {
            console.log("❌ Photo deletion error:", deleteError);
            return res.status(500).send(
                "Unable to delete photo"
            );
        }
        console.log("✅ Photo deleted:", filePath);
        // IMPORTANT:
        // Stay on the same Edit Activity page
        return res.redirect(
            `/admin/activities/${id}/edit`
        );
    } catch (err) {
        console.log("❌ Delete photo error:", err);
        res.status(500).send(
            "Something went wrong"
        );
    }
});

module.exports = router;