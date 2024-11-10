const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: String,
    date: String,
    details: String,
    assignedPhotographer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Event", eventSchema);
