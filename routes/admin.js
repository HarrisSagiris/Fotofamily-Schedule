const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Event = require("../models/Event");

// Other existing routes...

// Save Events Route
router.post("/saveEvents", async (req, res) => {
    const { events } = req.body;

    try {
        await Promise.all(events.map(async (eventData) => {
            const photographer = await User.findOne({ email: eventData.photographerEmail, role: "photographer" });
            const event = await Event.findOneAndUpdate(
                { name: eventData.name },
                {
                    name: eventData.name,
                    date: eventData.date,
                    details: eventData.details,
                    assignedPhotographer: photographer ? photographer._id : null
                },
                { upsert: true, new: true }
            );

            if (photographer) {
                photographer.assignedEvents.addToSet(event._id);
                await photographer.save();
            }
        }));

        res.json({ success: true });
    } catch (error) {
        console.error("Error saving events:", error);
        res.json({ success: false, error: "Failed to save events." });
    }
});

module.exports = router;
