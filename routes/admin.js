const express = require("express");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


router.get("/", adminAuth, (req, res) => {

    res.render("admin/dashboard");

});


module.exports = router;