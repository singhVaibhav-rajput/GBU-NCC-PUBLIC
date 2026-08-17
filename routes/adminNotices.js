const express = require("express");
const multer = require("multer");
const supabase = require("../config/supabase");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.use(adminAuth);

// Store uploaded file temporarily in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    },
    fileFilter: (req, file, cb) => {

        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }

    }
});


// Admin notices page
router.get("/notices", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("notices")
            .select("*")
            .order("date", { ascending: false });

        if (error) {
            console.log("❌ Database error:", error);
            return res.status(500).send("Unable to load notices");
        }

        res.render("admin/notices", {
            notices: data
        });

    } catch (err) {

        console.log("❌ Admin notices error:", err);
        res.status(500).send("Something went wrong");

    }

});


// Create notice
router.post(
    "/notices",
    upload.single("noticeFile"),
    async (req, res) => {

        try {

            const { title, date } = req.body;

            const file = req.file;

            if (!title || !date || !file) {
                return res.status(400).send(
                    "Title, date and PDF are required"
                );
            }


            // Create a unique filename
            const fileName =
                `${Date.now()}-${file.originalname}`;


            // Upload PDF to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("notices")
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });


            if (uploadError) {

                console.log(
                    "❌ Storage upload error:",
                    uploadError
                );

                return res.status(500).send(
                    "Failed to upload notice"
                );

            }


            // Save metadata in PostgreSQL
            const { error: databaseError } = await supabase
                .from("notices")
                .insert({
                    title: title,
                    date: date,
                    file_path: fileName
                });


            if (databaseError) {

                console.log(
                    "❌ Database insert error:",
                    databaseError
                );

                // Remove uploaded file if database insert fails
                await supabase.storage
                    .from("notices")
                    .remove([fileName]);

                return res.status(500).send(
                    "Failed to create notice"
                );

            }


            console.log("✅ Notice created:", title);

            res.redirect("/admin/notices");

        } catch (err) {

            console.log("❌ Create notice error:", err);

            res.status(500).send(
                "Something went wrong"
            );

        }

    }
);


// Edit notice page
router.get("/notices/:id/edit", async (req, res) => {
    try {

        const { id } = req.params;

        const { data, error } = await supabase
            .from("notices")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.log("❌ Fetch notice error:", error);
            return res.status(404).send("Notice not found");
        }

        res.render("admin/editNotice", {
            notice: data
        });

    } catch (err) {

        console.log("❌ Edit page error:", err);
        res.status(500).send("Something went wrong");

    }
});

// Update notice
router.post(
    "/notices/:id/edit",
    upload.single("noticeFile"),
    async (req, res) => {

        try {

            const { id } = req.params;
            const { title, date } = req.body;

            if (!title || !date) {
                return res.status(400).send(
                    "Title and date are required"
                );
            }


            // Get existing notice
            const { data: existingNotice, error: fetchError } =
                await supabase
                    .from("notices")
                    .select("*")
                    .eq("id", id)
                    .single();

            if (fetchError || !existingNotice) {
                return res.status(404).send("Notice not found");
            }


            let filePath = existingNotice.file_path;


            // If a new PDF was uploaded
            if (req.file) {

                const newFileName =
                    `${Date.now()}-${req.file.originalname}`;


                // Upload new PDF
                const { error: uploadError } =
                    await supabase.storage
                        .from("notices")
                        .upload(
                            newFileName,
                            req.file.buffer,
                            {
                                contentType: req.file.mimetype,
                                upsert: false
                            }
                        );


                if (uploadError) {

                    console.log(
                        "❌ New file upload error:",
                        uploadError
                    );

                    return res.status(500).send(
                        "Failed to upload new PDF"
                    );

                }


                // Delete old PDF
                const { error: deleteError } =
                    await supabase.storage
                        .from("notices")
                        .remove([
                            existingNotice.file_path
                        ]);


                if (deleteError) {
                    console.log(
                        "⚠️ Old file deletion error:",
                        deleteError
                    );
                }


                filePath = newFileName;
            }


            // Update database
            const { error: updateError } =
                await supabase
                    .from("notices")
                    .update({
                        title: title,
                        date: date,
                        file_path: filePath
                    })
                    .eq("id", id);


            if (updateError) {

                console.log(
                    "❌ Database update error:",
                    updateError
                );

                return res.status(500).send(
                    "Failed to update notice"
                );

            }


            console.log("✅ Notice updated:", id);

            res.redirect("/admin/notices");

        } catch (err) {

            console.log("❌ Update notice error:", err);

            res.status(500).send(
                "Something went wrong"
            );

        }

    }
);

// Delete notice
router.post("/notices/:id/delete", async (req, res) => {

    try {

        const { id } = req.params;

        // Get notice first so we know the PDF path
        const { data: notice, error: fetchError } =
            await supabase
                .from("notices")
                .select("*")
                .eq("id", id)
                .single();

        if (fetchError || !notice) {
            return res.status(404).send("Notice not found");
        }


        // Delete PDF from Supabase Storage
        const { error: storageError } =
            await supabase.storage
                .from("notices")
                .remove([notice.file_path]);

        if (storageError) {

            console.log(
                "❌ Storage delete error:",
                storageError
            );

            return res.status(500).send(
                "Failed to delete notice file"
            );
        }


        // Delete database record
        const { error: databaseError } =
            await supabase
                .from("notices")
                .delete()
                .eq("id", id);

        if (databaseError) {

            console.log(
                "❌ Database delete error:",
                databaseError
            );

            return res.status(500).send(
                "Failed to delete notice"
            );
        }


        console.log("🗑️ Notice deleted:", notice.title);

        res.redirect("/admin/notices");

    } catch (err) {

        console.log(
            "❌ Delete notice error:",
            err
        );

        res.status(500).send(
            "Something went wrong"
        );

    }

});


module.exports = router;