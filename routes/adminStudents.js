const express = require("express");
const multer = require("multer");
const adminAuth = require("../middleware/adminAuth");
const studentSupabase = require("../config/studentSupabase");
const router = express.Router();

// MULTER CONFIGURATION
const storage = multer.memoryStorage();
const upload = multer({
    storage,

    limits: {
        fileSize: 200 * 1024 // 200 KB
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error("Only JPG, PNG and WebP images are allowed.")
            );
        }

        cb(null, true);
    }
});

// STUDENTS LIST
router.get("/", adminAuth, async (req, res) => {

    try {

        const search =
            req.query.search?.trim() || "";

        const batch =
            req.query.batch?.trim() || "";


        let query = studentSupabase
            .from("students")
            .select(`
                id,
                name,
                enrollment_no,
                email,
                ncc_batch,
                ncc_entry_type,
                ncc_status,
                b_certificate_status,
                c_certificate_status,
                is_active,
                created_at
            `)
            .order("created_at", {
                ascending: false
            });


        // ==================================================
        // SEARCH
        // ==================================================

        if (search) {

            query = query.or(
                `name.ilike.%${search}%,enrollment_no.ilike.%${search}%`
            );

        }


        // ==================================================
        // BATCH FILTER
        // ==================================================

        if (batch) {

            query = query.eq(
                "ncc_batch",
                batch
            );

        }


        const {
            data: students,
            error
        } = await query;


        if (error) {

            console.log(
                "❌ Student database error:",
                error
            );

            return res.status(500).send(
                "Unable to load students"
            );

        }


        console.log(
            "👨‍🎓 Students:",
            students
        );


        res.render("admin/students", {

            students: students || [],

            search,

            batch

        });


    } catch (err) {

        console.log(
            "❌ Admin students error:",
            err
        );

        res.status(500).send(
            "Something went wrong"
        );

    }

});


// ADD STUDENT PAGE
// IMPORTANT: MUST COME BEFORE /:id
router.get("/new", adminAuth, (req, res) => {

    res.render("admin/student-new");

});

// CREATE STUDENT
router.post("/new", adminAuth, async (req, res) => {
    try {
        const {
            name,
            enrollment_no,
            roll_no,
            email,
            phone,
            dob,
            ncc_batch,
            ncc_entry_type,
            ncc_status,
            b_certificate_status,
            b_certificate_number,
            b_certificate_year,
            b_certificate_grade,
            c_certificate_status,
            c_certificate_number,
            c_certificate_year,
            c_certificate_grade,
            father_name,
            father_phone,
            bank_account_no,
            ifsc_code,
            is_active
        } = req.body;

        // BASIC VALIDATION       
        if (
            !name?.trim() ||
            !enrollment_no?.trim() ||
            !email?.trim() ||
            !ncc_batch?.trim()
        ) {
            return res.status(400).send(
                "Name, enrollment number, email and NCC batch are required."
            );
        }

        // PREPARE DATA
        const studentData = {
            name: name.trim(),
            enrollment_no:
                enrollment_no.trim(),
            roll_no:
                roll_no?.trim() || null,
            email:
                email.trim().toLowerCase(),
            phone:
                phone?.trim() || null,
            dob:
                dob || null,

            // ncc
            ncc_batch:
                ncc_batch.trim(),
            ncc_entry_type:
                ncc_entry_type?.trim() || "fresh",
            ncc_status:
                ncc_status?.trim() || "ongoing",

            // B Certificate
            b_certificate_status:
                b_certificate_status?.trim() || "not_attempted",
            b_certificate_number:
                b_certificate_number?.trim() || null,
            b_certificate_year:
                b_certificate_year
                    ? Number(b_certificate_year)
                    : null,
            b_certificate_grade:
                b_certificate_grade?.trim() || null,

            // C Certificate
            c_certificate_status:
                c_certificate_status?.trim() || "not_eligible",
            c_certificate_number:
                c_certificate_number?.trim() || null,
            c_certificate_year:
                c_certificate_year
                    ? Number(c_certificate_year)
                    : null,
            c_certificate_grade:
                c_certificate_grade?.trim() || null,

            // Parent
            father_name:
                father_name?.trim() || null,
            father_phone:
                father_phone?.trim() || null,

            // Bank
            bank_account_no:
                bank_account_no?.trim() || null,
            ifsc_code:
                ifsc_code
                    ?.trim()
                    .toUpperCase() || null,

            // Status
            is_active: is_active === "true"
        };

        // CREATE STUDENT
        const {
            data: student,
            error: studentError
        } = await studentSupabase
            .from("students")
            .insert(studentData)
            .select()
            .single();

        if (studentError) {
            console.log(
                "❌ Student profile creation error:",
                studentError
            );

            // Duplicate email / enrollment
            if (
                studentError.code === "23505"
            ) {
                return res.status(400).send(
                    "A student with this email or enrollment number already exists."
                );
            }
            return res.status(400).send(
                `Unable to create student: ${studentError.message}`
            );
        }

        // SHOW SUCCESS PAGE
        res.render("admin/student-created", {
            student
        });

    } catch (err) {
        console.log(
            "❌ Create student error:",
            err
        );
        res.status(500).send(
            "Something went wrong while creating the student"
        );
    }
});

// VIEW STUDENT PROFILE
router.get("/:id", adminAuth, async (req, res) => {

    try {

        const { id } = req.params;


        const {
            data: student,
            error
        } = await studentSupabase
            .from("students")
            .select("*")
            .eq("id", id)
            .single();


        if (error || !student) {

            console.log(
                "❌ Student not found:",
                error
            );


            return res.status(404).send(
                "Student not found"
            );

        }


        res.render("admin/student-profile", {

            student

        });


    } catch (err) {

        console.log(
            "❌ View student error:",
            err
        );


        res.status(500).send(
            "Something went wrong"
        );

    }

});

// EDIT STUDENT PAGE
router.get("/:id/edit", adminAuth, async (req, res) => {

    try {

        const { id } = req.params;


        const {
            data: student,
            error
        } = await studentSupabase
            .from("students")
            .select("*")
            .eq("id", id)
            .single();


        if (error || !student) {

            console.log(
                "❌ Student not found:",
                error
            );


            return res.status(404).send(
                "Student not found"
            );

        }


        res.render("admin/student-edit", {

            student

        });


    } catch (err) {

        console.log(
            "❌ Edit student page error:",
            err
        );


        res.status(500).send(
            "Something went wrong"
        );

    }

});

// UPDATE STUDENT
router.put(
    "/:id",
    adminAuth,
    upload.single("profile_image"),

    async (req, res) => {

        try {

            const { id } = req.params;


            // ==================================================
            // GET FORM DATA
            // ==================================================

            const {

                name,
                enrollment_no,
                roll_no,
                email,
                phone,
                dob,

                ncc_batch,
                ncc_entry_type,
                ncc_status,

                b_certificate_status,
                b_certificate_number,
                b_certificate_year,
                b_certificate_grade,

                c_certificate_status,
                c_certificate_number,
                c_certificate_year,
                c_certificate_grade,

                father_name,
                father_phone,

                bank_account_no,
                ifsc_code,

                is_active

            } = req.body;


            // ==================================================
            // GET EXISTING STUDENT
            // ==================================================

            const {
                data: existingStudent,
                error: findError
            } = await studentSupabase
                .from("students")
                .select("*")
                .eq("id", id)
                .single();


            if (
                findError ||
                !existingStudent
            ) {

                console.log(
                    "❌ Student not found:",
                    findError
                );


                return res.status(404).send(
                    "Student not found"
                );

            }


            // ==================================================
            // PROFILE IMAGE
            // ==================================================

            let profileImageUrl =
                existingStudent.profile_image_url || null;


            if (req.file) {

                // Multer already checks 200 KB,
                // but keeping this server-side check too.

                const MAX_FILE_SIZE =
                    200 * 1024;


                if (
                    req.file.size >
                    MAX_FILE_SIZE
                ) {

                    return res.status(400).send(
                        "Profile picture must be 200 KB or less."
                    );

                }


                // ==================================================
                // FILE EXTENSION
                // ==================================================

                let fileExtension;


                if (
                    req.file.mimetype ===
                    "image/jpeg"
                ) {

                    fileExtension = "jpg";

                } else if (
                    req.file.mimetype ===
                    "image/png"
                ) {

                    fileExtension = "png";

                } else if (
                    req.file.mimetype ===
                    "image/webp"
                ) {

                    fileExtension = "webp";

                } else {

                    return res.status(400).send(
                        "Only JPG, PNG and WebP images are allowed."
                    );

                }


                // ==================================================
                // FILE PATH
                // ==================================================

                const filePath =
                    `${id}/profile.${fileExtension}`;


                // ==================================================
                // DELETE OLD IMAGE FILES
                // ==================================================

                const oldFiles = [
                    `${id}/profile.jpg`,
                    `${id}/profile.png`,
                    `${id}/profile.webp`
                ];


                const filesToDelete =
                    oldFiles.filter(
                        file =>
                            file !== filePath
                    );


                if (
                    filesToDelete.length
                ) {

                    const {
                        error: deleteOldError
                    } = await studentSupabase
                        .storage
                        .from("student-profiles")
                        .remove(
                            filesToDelete
                        );


                    if (deleteOldError) {

                        console.log(
                            "⚠️ Could not delete old profile image:",
                            deleteOldError
                        );

                    }

                }


                // ==================================================
                // UPLOAD NEW IMAGE
                // ==================================================

                const {
                    error: uploadError
                } = await studentSupabase
                    .storage
                    .from("student-profiles")
                    .upload(

                        filePath,

                        req.file.buffer,

                        {
                            contentType:
                                req.file.mimetype,

                            upsert: true
                        }

                    );


                if (uploadError) {

                    console.log(
                        "❌ Profile image upload error:",
                        uploadError
                    );


                    return res.status(400).send(
                        `Unable to upload profile picture: ${uploadError.message}`
                    );

                }


                // ==================================================
                // GET PUBLIC URL
                // ==================================================

                const {
                    data: publicUrlData
                } = studentSupabase
                    .storage
                    .from("student-profiles")
                    .getPublicUrl(
                        filePath
                    );


                profileImageUrl =
                    publicUrlData.publicUrl;


                console.log(
                    "✅ Admin uploaded profile image:",
                    profileImageUrl
                );

            }


            // ==================================================
            // PREPARE EMAIL
            // ==================================================

            const newEmail =
                email
                    ?.trim()
                    .toLowerCase();


            // ==================================================
            // UPDATE STUDENT
            // ==================================================

            const {
                data: updatedStudent,
                error: updateError
            } = await studentSupabase
                .from("students")
                .update({

                    // ------------------------------
                    // Basic information
                    // ------------------------------

                    name:
                        name?.trim(),

                    enrollment_no:
                        enrollment_no?.trim(),

                    roll_no:
                        roll_no?.trim() || null,

                    email:
                        newEmail,

                    phone:
                        phone?.trim() || null,

                    dob:
                        dob || null,


                    // ------------------------------
                    // NCC
                    // ------------------------------

                    ncc_batch:
                        ncc_batch?.trim(),

                    ncc_entry_type:
                        ncc_entry_type?.trim() || "fresh",

                    ncc_status:
                        ncc_status?.trim() || "ongoing",


                    // ------------------------------
                    // B Certificate
                    // ------------------------------

                    b_certificate_status:
                        b_certificate_status
                            ?.trim() ||
                        "not_attempted",

                    b_certificate_number:
                        b_certificate_number
                            ?.trim() ||
                        null,

                    b_certificate_year:
                        b_certificate_year
                            ? Number(
                                b_certificate_year
                            )
                            : null,

                    b_certificate_grade:
                        b_certificate_grade
                            ?.trim() ||
                        null,


                    // ------------------------------
                    // C Certificate
                    // ------------------------------

                    c_certificate_status:
                        c_certificate_status
                            ?.trim() ||
                        "not_eligible",

                    c_certificate_number:
                        c_certificate_number
                            ?.trim() ||
                        null,

                    c_certificate_year:
                        c_certificate_year
                            ? Number(
                                c_certificate_year
                            )
                            : null,

                    c_certificate_grade:
                        c_certificate_grade
                            ?.trim() ||
                        null,


                    // ------------------------------
                    // Parent
                    // ------------------------------

                    father_name:
                        father_name?.trim() ||
                        null,

                    father_phone:
                        father_phone?.trim() ||
                        null,


                    // ------------------------------
                    // Bank
                    // ------------------------------

                    bank_account_no:
                        bank_account_no?.trim() ||
                        null,

                    ifsc_code:
                        ifsc_code
                            ?.trim()
                            .toUpperCase() ||
                        null,


                    // ------------------------------
                    // Status
                    // ------------------------------

                    is_active:
                        is_active === "true",


                    // ------------------------------
                    // Profile image
                    // ------------------------------

                    profile_image_url:
                        profileImageUrl

                })
                .eq("id", id)
                .select()
                .single();


            if (updateError) {

                console.log(
                    "❌ Student update error:",
                    updateError
                );


                if (
                    updateError.code ===
                    "23505"
                ) {

                    return res.status(400).send(
                        "A student with this email or enrollment number already exists."
                    );

                }


                return res.status(400).send(
                    `Unable to update student: ${updateError.message}`
                );

            }


            console.log(
                "✅ Student updated:",
                updatedStudent.id
            );


            // ==================================================
            // REDIRECT
            // ==================================================

            res.redirect(
                `/admin/students/${id}`
            );


        } catch (err) {

            console.log(
                "❌ Update student error:",
                err
            );


            // Multer file size error
            if (
                err.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).send(
                    "Profile picture must be 200 KB or less."
                );

            }


            // Multer file type error
            if (
                err.message ===
                "Only JPG, PNG and WebP images are allowed."
            ) {

                return res.status(400).send(
                    err.message
                );

            }


            res.status(500).send(
                "Something went wrong while updating the student"
            );

        }

    }
);

// DELETE STUDENT
router.post(
    "/:id/delete",
    adminAuth,

    async (req, res) => {

        try {

            const { id } = req.params;


            // ==================================================
            // GET STUDENT
            // ==================================================

            const {
                data: student,
                error: findError
            } = await studentSupabase
                .from("students")
                .select(`
                    id,
                    name,
                    profile_image_url
                `)
                .eq("id", id)
                .single();


            if (
                findError ||
                !student
            ) {

                console.log(
                    "❌ Student not found for deletion:",
                    findError
                );


                return res.status(404).send(
                    "Student not found"
                );

            }


            // ==================================================
            // DELETE PROFILE IMAGE
            // ==================================================

            const filesToDelete = [
                `${id}/profile.jpg`,
                `${id}/profile.png`,
                `${id}/profile.webp`
            ];


            const {
                error: imageDeleteError
            } = await studentSupabase
                .storage
                .from("student-profiles")
                .remove(
                    filesToDelete
                );


            if (imageDeleteError) {

                console.log(
                    "⚠️ Profile image deletion warning:",
                    imageDeleteError
                );

            }


            // ==================================================
            // DELETE STUDENT
            // ==================================================

            const {
                error: deleteError
            } = await studentSupabase
                .from("students")
                .delete()
                .eq("id", id);


            if (deleteError) {

                console.log(
                    "❌ Student deletion error:",
                    deleteError
                );


                return res.status(500).send(
                    "Unable to delete student"
                );

            }


            console.log(
                `🗑️ Student deleted: ${student.name}`
            );


            res.redirect(
                "/admin/students"
            );


        } catch (err) {

            console.log(
                "❌ Delete student error:",
                err
            );


            res.status(500).send(
                "Something went wrong while deleting the student"
            );

        }

    }
);


module.exports = router;