const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");

const app = express();

const PORT = 8080;

// EJS setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
    res.render("home");
});


//routers
const aboutRouter = require("./routes/about");
const activitiesRouter = require("./routes/activities");
const achievementsRouter = require("./routes/achievements");
const galleryRouter = require("./routes/gallery");
const noticesRouter = require("./routes/notices");

app.use("/about", aboutRouter);
app.use("/activities", activitiesRouter);
app.use("/achievements", achievementsRouter);
app.use("/gallery", galleryRouter);
app.use("/notices", noticesRouter);


app.listen(PORT, () => {
    console.log(`NCC website running on http://localhost:${PORT}`);
});