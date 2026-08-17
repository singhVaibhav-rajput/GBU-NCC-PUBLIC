const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");


// Activities main page
router.get("/", async (req, res) => {

    try {

        // Get activities from database
        const { data: activities, error: dbError } = await supabase
            .from("activities")
            .select("*")
            .order("created_at", { ascending: false });

        if (dbError) {
            console.log("❌ Activities database error:", dbError);
            return res.status(500).send("Unable to load activities");
        }


        const activityCards = [];


        for (const activity of activities) {

            const { data: files, error } = await supabase.storage
                .from("activities")
                .list(activity.folder);


            if (error) {

                console.log(
                    `❌ Storage error for ${activity.folder}:`,
                    error
                );

                continue;
            }


            const validFiles = files.filter(file => file.name);


            // Get first image as cover
            let coverImage = null;


            if (validFiles.length > 0) {

                const { data: publicUrlData } = supabase.storage
                    .from("activities")
                    .getPublicUrl(
                        `${activity.folder}/${validFiles[0].name}`
                    );

                coverImage = publicUrlData.publicUrl;
            }


            activityCards.push({

                ...activity,

                coverImage,

                photoCount: validFiles.length

            });

        }


        console.log("Activity cards:", activityCards);


        res.render("activities", {

            activities: activityCards

        });


    } catch (err) {

        console.log("Activities error:", err);

        res.status(500).send("Something went wrong");

    }

});


// Individual activity page
router.get("/:slug", async (req, res) => {

    try {

        // Find activity in database
        const { data: activity, error: dbError } = await supabase
            .from("activities")
            .select("*")
            .eq("slug", req.params.slug)
            .single();


        if (dbError || !activity) {

            return res.status(404).send("Activity not found");

        }


        // Get photos from Supabase Storage
        const { data: files, error } = await supabase.storage
            .from("activities")
            .list(activity.folder);


        if (error) {

            console.log("Supabase storage error:", error);

            return res.status(500).send("Unable to load photos");

        }


        const photos = files
            .filter(file => file.name)
            .map(file => {

                const { data: publicUrlData } = supabase.storage
                    .from("activities")
                    .getPublicUrl(
                        `${activity.folder}/${file.name}`
                    );

                return publicUrlData.publicUrl;

            });


        console.log(
            `${activity.title} photos:`,
            photos
        );


        res.render("activity-details", {

            activity,

            photos

        });


    } catch (err) {

        console.log("Activity details error:", err);

        res.status(500).send("Something went wrong");

    }

});


module.exports = router;