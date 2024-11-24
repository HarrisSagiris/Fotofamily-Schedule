const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: String,
    date: String,
    location: String,
    photographer: { type: mongoose.Schema.Types.ObjectId, ref: 'Photographer' },
});

module.exports = mongoose.model('Event', eventSchema);