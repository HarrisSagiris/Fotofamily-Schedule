const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Event = require("../models/Event");

router.get("/", async (req, res) => {
    if (req.session.role !== "admin") return res.redirect("/login");
    const photographers = await User.find({ role: "photographer" });
    const events = await Event.find({}).populate("assignedPhotographer");
    res.render("adminDashboard", { photographers, events });
});

router.post("/addPhotographer", async (req, res) => {
    const { email, password } = req.body;
    const newPhotographer = new User({ email, password, role: "photographer" });
    await newPhotographer.save();
    res.redirect("/admin");
});

router.post("/addEvent", async (req, res) => {
    const { name, date, details, photographerId } = req.body;
    const newEvent = new Event({
        name,
        date,
        details,
        assignedPhotographer: photographerId,
    });
    await newEvent.save();
    res.redirect("/admin");
});

module.exports = router;
