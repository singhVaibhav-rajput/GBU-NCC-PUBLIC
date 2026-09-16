const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// Achievement information
const achievements = [
    {
        slug: "award",
        title: "Awards",
        description: "Awards and recognitions received by NCC cadets.",
        folder: "awards"
    },
    {
        slug: "certification",
        title: "Certifications",
        description: "Certifications and accomplishments of NCC cadets.",
        folder: "certification"
    }
];

// Achievements main page
router.get("/", async (req, res) => {
    try {
        const achievementCards = [];

        for (const achievement of achievements) {
            const { data, error } = await supabase.storage
                .from("achievements")
                .list(achievement.folder);
            if (error) {
                console.log("Supabase error:", error);
                continue;
            }
            const files = data.filter(file => file.name);

            let coverImage = null;

            if (files.length > 0) {
                const { data: publicUrlData } = supabase.storage
                    .from("achievements")
                    .getPublicUrl(
                        `${achievement.folder}/${files[0].name}`
                    );

                coverImage = publicUrlData.publicUrl;
            }

            achievementCards.push({
                ...achievement,
                coverImage,
                photoCount: files.length
            });
        }

        

        res.render("achievements", {
            achievements: achievementCards
        });

    } catch (err) {
        console.log("Achievements error:", err);
        res.status(500).send("Something went wrong");
    }
});

// Individual achievement page
router.get("/:slug", async (req, res) => {
    try {
        const achievement = achievements.find(
            achievement => achievement.slug === req.params.slug
        );

        if (!achievement) {
            return res.status(404).send("Achievement not found");
        }

        const { data, error } = await supabase.storage
            .from("achievements")
            .list(achievement.folder);

        if (error) {
            console.log(" database error:", error);
            return res.status(500).send("Unable to load photos");
        }

        const photos = data
            .filter(file => file.name)
            .map(file => {

                const { data: publicUrlData } = supabase.storage
                    .from("achievements")
                    .getPublicUrl(
                        `${achievement.folder}/${file.name}`
                    );

                return publicUrlData.publicUrl;
            });

        res.render("achievement-details", {
            achievement,
            photos
        });


    } catch (err) {

        console.log("❌ Achievement details error:", err);

        res.status(500).send("Something went wrong");

    }

});


module.exports = router;