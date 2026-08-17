require("dotenv").config();

const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const { createClient } = require("@supabase/supabase-js");
const session = require("express-session");
const app = express();
const PORT = 8080;


const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);
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
const adminAchievementsRouter =
    require("./routes/adminAchievements");




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
app.get("/", (req, res) => {
    res.render("home");
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