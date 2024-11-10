const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

router.get("/", async (req, res) => {
    if (req.session.role !== "photographer") return res.redirect("/login");
    const events = await Event.find({ assignedPhotographer: req.session.userId });
    res.render("photographerDashboard", { events });
});

module.exports = router;
