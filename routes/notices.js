const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// Notices page
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("notices")
            .select("*")
            .order("date", { ascending: false });
        if (error) {
            console.log("❌ Supabase database error:", error);
            return res.status(500).send("Unable to load notices");
        }
        const notices = data.map(notice => {
            const { data: publicUrlData } = supabase.storage
                .from("notices")
                .getPublicUrl(notice.file_path);
            return {
                ...notice,
                fileUrl: publicUrlData.publicUrl
            };
        });

        res.render("notices", {
            notices
        });
    } catch (err) {
        console.log("❌ Notices error:", err);
        res.status(500).send("Something went wrong");
    }
});


module.exports = router;