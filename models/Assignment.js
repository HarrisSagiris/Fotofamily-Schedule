const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    photographer: { type: mongoose.Schema.Types.ObjectId, ref: 'Photographer' },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
});

module.exports = mongoose.model('Assignment', assignmentSchema);
