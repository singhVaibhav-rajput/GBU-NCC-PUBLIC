require("dotenv").config();
const studentSupabase = require("./config/studentSupabase");
const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const { createClient } = require("@supabase/supabase-js");
const session = require("express-session");
const methodOverride = require("method-override");
const app = express();
const PORT = 8080;


app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

// Make safe Supabase public values available to EJS
app.locals.SUPABASE_URL = process.env.SUPABASE_URL;
app.locals.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

app.use(express.urlencoded({ extended: true }));


//routers
const aboutRouter = require("./routes/about");
const activitiesRouter = require("./routes/activities");
const achievementsRouter = require("./routes/achievements");
const noticesRouter = require("./routes/notices");
//admin routers
const adminRouter = require("./routes/admin");
const adminNoticesRouter = require("./routes/adminNotices");
const adminAuthRouter = require("./routes/adminAuth");
const adminActivitiesRouter = require("./routes/adminActivities");
const adminAchievementsRouter = require("./routes/adminAchievements");
const adminStudentsRouter = require("./routes/adminStudents");
//public student routes
// const studentAuthRouter = require("./routes/studentAuth");
// const studentRouter = require("./routes/student");


// EJS setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));




// Static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/admin-test", (req, res) => {
    console.log("🔥 ADMIN TEST ROUTE HIT");
    res.send("Admin routing works!");
});


//middleware-session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 4
        }
    })
);




// Home route
app.get("/", async (req, res) => {
    try {

        // Get student statistics
        const {
            data: students,
            error: studentsError
        } = await studentSupabase
            .from("students")
            .select("ncc_status, c_certificate_status");

        if (studentsError) {
            console.log(
                "❌ Home student statistics error:",
                studentsError
            );

            return res.status(500).send(
                "Unable to load NCC statistics"
            );
        }


        // Get vacancy count
        const {
            data: unitStats,
            error: vacancyError
        } = await studentSupabase
            .from("ncc_unit_statistics")
            .select("vacancies")
            .eq("id", 1)
            .single();

        if (vacancyError) {
            console.log(
                "❌ Home vacancy error:",
                vacancyError
            );

            return res.status(500).send(
                "Unable to load NCC statistics"
            );
        }


        const studentList = students || [];


        // Calculate statistics
        const stats = {

            totalStudents:
                studentList.length,

            vacancies:
                unitStats?.vacancies || 0,

            nccCompleted:
                studentList.filter(
                    student =>
                        student.ncc_status === "completed"
                ).length,

            nccOngoing:
                studentList.filter(
                    student =>
                        student.ncc_status === "ongoing"
                ).length,

            cCertificateOngoing:
                studentList.filter(
                    student =>
                        student.c_certificate_status === "ongoing"
                ).length
        };


        res.render("home", {
            stats
        });

    } catch (err) {

        console.log(
            "❌ Home route error:",
            err
        );

        res.status(500).send(
            "Something went wrong while loading the homepage"
        );
    }
});



app.use("/about", aboutRouter);
app.use("/activities", activitiesRouter);
app.use("/achievements", achievementsRouter);
app.use("/notices", noticesRouter);
app.use("/admin", adminAuthRouter);
app.use("/admin", adminRouter);
app.use("/admin", adminNoticesRouter);
app.use("/admin/activities", adminActivitiesRouter);
app.use("/admin/achievements",adminAchievementsRouter);
app.use("/admin/students", adminStudentsRouter);
// app.use("/student", studentAuthRouter);
// app.use("/student", studentRouter);



app.get("/test-supabase", async (req, res) => {

    const { data, error } = await supabase.storage
        .from("gallery")
        .list("test");

    if (error) {
        console.log("Supabase error:", error);
        return res.status(500).send("Supabase connection failed");
    }

    console.log("Gallery files:", data);

    res.send("Supabase connected successfully!");
});







app.listen(PORT, () => {
    console.log(`NCC website running on http://localhost:${PORT}`);
});