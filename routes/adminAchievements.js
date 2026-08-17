const express = require("express");
const multer = require("multer");

const supabase = require("../config/supabase");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ==========================================
// MULTER
// ==========================================

const upload = multer({
    storage: multer.memoryStorage()
});


// ==========================================
// ACHIEVEMENTS ADMIN PAGE
// ==========================================

router.get("/", adminAuth, async (req, res) => {

    try {

        const { data: achievements, error } = await supabase
            .from("achievements")
            .select("*")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.log(
                "❌ Achievement database error:",
                error
            );

            return res.status(500).send(
                "Unable to load achievements"
            );

        }


        const achievementCards = [];


        // ==========================================
        // GET PHOTOS
        // ==========================================

        for (const achievement of achievements) {

            const {
                data: files,
                error: storageError
            } = await supabase.storage
                .from("achievements")
                .list(achievement.folder, {
                    limit: 100
                });


            if (storageError) {

                console.log(
                    "❌ Storage error:",
                    storageError
                );

                achievementCards.push({
                    ...achievement,
                    photoCount: 0,
                    coverImage: null
                });

                continue;

            }


            const imageFiles = (files || [])
                .filter(file => file.name);


            let coverImage = null;


            if (imageFiles.length > 0) {

                const {
                    data: publicUrlData
                } = supabase.storage
                    .from("achievements")
                    .getPublicUrl(
                        `${achievement.folder}/${imageFiles[0].name}`
                    );


                coverImage =
                    publicUrlData.publicUrl;

            }


            achievementCards.push({

                ...achievement,

                photoCount: imageFiles.length,

                coverImage

            });

        }


        console.log(
            "🏆 Achievement cards:",
            achievementCards
        );


        res.render("admin/achievements", {
            achievements: achievementCards
        });


    } catch (err) {

        console.log(
            "❌ Admin achievements error:",
            err
        );

        res.status(500).send(
            "Something went wrong"
        );

    }

});


// ==========================================
// EDIT ACHIEVEMENT PAGE
// ==========================================

router.get("/:id/edit", adminAuth, async (req, res) => {

    try {

        const { id } = req.params;


        // Get achievement from database

        const {
            data: achievement,
            error
        } = await supabase
            .from("achievements")
            .select("*")
            .eq("id", id)
            .single();


        if (error || !achievement) {

            console.log(
                "❌ Achievement not found:",
                error
            );

            return res.status(404).send(
                "Achievement not found"
            );

        }


        // Get photos from Supabase Storage

        const {
            data: files,
            error: storageError
        } = await supabase.storage
            .from("achievements")
            .list(achievement.folder, {
                limit: 100
            });


        if (storageError) {

            console.log(
                "❌ Achievement photos error:",
                storageError
            );

            return res.status(500).send(
                "Unable to load achievement photos"
            );

        }


        // Create photo objects

        const photos = (files || [])
            .filter(file => file.name)
            .map(file => {

                const {
                    data: publicUrlData
                } = supabase.storage
                    .from("achievements")
                    .getPublicUrl(
                        `${achievement.folder}/${file.name}`
                    );


                return {

                    name: file.name,

                    url: publicUrlData.publicUrl

                };

            });


        console.log(
            "🏆 Editing achievement:",
            achievement
        );


        console.log(
            "📸 Achievement photos:",
            photos
        );


        res.render("admin/achievement-edit", {

            achievement,

            photos

        });


    } catch (err) {

        console.log(
            "❌ Edit achievement error:",
            err
        );

        res.status(500).send(
            "Something went wrong"
        );

    }

});


// ==========================================
// UPDATE ACHIEVEMENT
// ==========================================

router.post(
    "/:id/edit",
    adminAuth,
    upload.array("photos", 20),
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                title,
                description
            } = req.body;


            // Get achievement

            const {
                data: achievement,
                error: findError
            } = await supabase
                .from("achievements")
                .select("*")
                .eq("id", id)
                .single();


            if (findError || !achievement) {

                return res.status(404).send(
                    "Achievement not found"
                );

            }


            // ==========================================
            // UPDATE DATABASE
            // ==========================================

            const {
                error: updateError
            } = await supabase
                .from("achievements")
                .update({

                    title: title,

                    description: description

                })
                .eq("id", id);


            if (updateError) {

                console.log(
                    "❌ Achievement update error:",
                    updateError
                );

                return res.status(500).send(
                    "Unable to update achievement"
                );

            }


            // ==========================================
            // UPLOAD NEW PHOTOS
            // ==========================================

            const uploadedFiles = req.files || [];


            for (const file of uploadedFiles) {

                // Create unique filename

                const fileName =
                    `${Date.now()}-${file.originalname}`;


                const filePath =
                    `${achievement.folder}/${fileName}`;


                const {
                    error: uploadError
                } = await supabase.storage
                    .from("achievements")
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

                } else {

                    console.log(
                        "✅ Photo uploaded:",
                        filePath
                    );

                }

            }


            console.log(
                "✅ Achievement updated:",
                id
            );


            // Go back to achievements list

            res.redirect("/admin/achievements");


        } catch (err) {

            console.log(
                "❌ Update achievement error:",
                err
            );

            res.status(500).send(
                "Something went wrong"
            );

        }

    }
);


// ==========================================
// DELETE INDIVIDUAL PHOTO
// ==========================================

router.post(
    "/:id/photo/delete",
    adminAuth,
    async (req, res) => {

        try {

            const { id } = req.params;

            const { fileName } = req.body;


            if (!fileName) {

                return res.status(400).send(
                    "File name is required"
                );

            }


            // Get achievement

            const {
                data: achievement,
                error
            } = await supabase
                .from("achievements")
                .select("*")
                .eq("id", id)
                .single();


            if (error || !achievement) {

                return res.status(404).send(
                    "Achievement not found"
                );

            }


            // Complete storage path

            const filePath =
                `${achievement.folder}/${fileName}`;


            console.log(
                "🗑️ Deleting achievement photo:",
                filePath
            );


            // Delete from Supabase Storage

            const {
                data: deletedFiles,
                error: deleteError
            } = await supabase.storage
                .from("achievements")
                .remove([
                    filePath
                ]);


            if (deleteError) {

                console.log(
                    "❌ Photo delete error:",
                    deleteError
                );

                return res.status(500).send(
                    "Unable to delete photo"
                );

            }


            console.log(
                "✅ Photo deleted:",
                deletedFiles
            );


            // IMPORTANT:
            // Stay on the same edit page

            res.redirect(
                `/admin/achievements/${id}/edit`
            );


        } catch (err) {

            console.log(
                "❌ Delete achievement photo error:",
                err
            );

            res.status(500).send(
                "Something went wrong"
            );

        }

    }
);


module.exports = router;