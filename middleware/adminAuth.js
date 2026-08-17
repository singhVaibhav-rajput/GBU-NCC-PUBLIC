function adminAuth(req, res, next) {

    console.log("🔐 ADMIN AUTH:", req.method, req.originalUrl);
    console.log("Session:", req.session);

    if (req.session && req.session.isAdmin) {
        console.log("✅ Authenticated");
        return next();
    }

    console.log("❌ Not authenticated → redirecting");

    return res.redirect("/admin/login");
}

module.exports = adminAuth;