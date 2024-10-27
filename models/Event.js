const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: String,
    date: Date,
    printer: String,
});

module.exports = mongoose.model('Event', eventSchema);
