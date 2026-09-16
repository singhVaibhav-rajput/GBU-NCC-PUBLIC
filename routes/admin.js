const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const studentSupabase = require("../config/studentSupabase");
const router = express.Router();


// ADMIN DASHBOAR
router.get("/", adminAuth, async (req, res) => {
    try {
        // Get students
        const {
            data: students,
            error: studentsError
        } = await studentSupabase
            .from("students")
            .select("ncc_status, c_certificate_status");

        if (studentsError) {
            console.log("❌ Dashboard student error:", studentsError);
            return res.status(500).send(
                "Unable to load dashboard statistics"
            );
        }

        // Get vacancy
        const {
            data: unitStats,
            error: vacancyError
        } = await studentSupabase
            .from("ncc_unit_statistics")
            .select("vacancies")
            .eq("id", 1)
            .single();

        if (vacancyError) {
            console.log("❌ Dashboard vacancy error:", vacancyError);
            return res.status(500).send(
                "Unable to load vacancy statistics"
            );
        }

        const studentList = students || [];

        const stats = {
            totalStudents: studentList.length,
            vacancies: unitStats?.vacancies || 0,
            nccCompleted: studentList.filter(
                student => student.ncc_status === "completed"
            ).length,
            nccOngoing: studentList.filter(
                student => student.ncc_status === "ongoing"
            ).length,
            cCertificateOngoing: studentList.filter(
                student => student.c_certificate_status === "ongoing"
            ).length
        };

        res.render("admin/dashboard", {
            stats
        });
    } catch (err) {
        res.status(500).send(
            "Something went wrong while loading the dashboard"
        );
    }
});

// UPDATE VACANCIES
router.post("/vacancies", adminAuth, async (req, res) => {
    try {
        const vacancies = Number(req.body.vacancies);
        
        // Validate vacancy value
        if (
            !Number.isInteger(vacancies) ||
            vacancies < 0
        ) {
            return res.status(400).send(
                "Vacancies must be a valid number greater than or equal to 0."
            );
        }

        const {
            error
        } = await studentSupabase
            .from("ncc_unit_statistics")
            .upsert(
                {
                    id: 1,
                    vacancies,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "id"
                }
            );
        if (error) {
            console.log(
                "❌ Vacancy update error:",
                error
            );

            return res.status(500).send(
                "Unable to update vacancies"
            );
        }

        console.log(
            `✅ Vacancies updated: ${vacancies}`
        );

        res.redirect("/admin");
    } catch (err) {
        console.log(
            "❌ Vacancy update error:",
            err
        );
        res.status(500).send(
            "Something went wrong while updating vacancies"
        );
    }
});


module.exports = router;