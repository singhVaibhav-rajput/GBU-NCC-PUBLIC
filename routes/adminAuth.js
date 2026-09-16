const express = require("express");
const router = express.Router();

// LOGIN PAGE
router.get("/login", (req, res) => {
    if (req.session && req.session.isAdmin) {
        console.log("Already logged in");
        return res.redirect("/admin");
    }

    res.render("admin/login", {
        error: null
    });
});


// LOGIN
router.post("/login", (req, res) => {
    console.log("🔥 LOGIN POST HIT");
    const { username, password } = req.body;
    console.log("Username:", username);
    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        req.session.isAdmin = true;
        console.log("✅ ADMIN LOGIN SUCCESS");
        return res.redirect("/admin");
    }
    res.render("admin/login", {
        error: "Invalid username or password"
    });
});


// LOGOUT
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("❌ Logout error:", err);
            return res.status(500).send("Unable to logout");
        }
        res.redirect("/admin/login");
    });
});

module.exports = router;