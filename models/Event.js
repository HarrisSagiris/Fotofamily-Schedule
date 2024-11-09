const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  partyName: { type: String, required: true },
  partyDate: { type: Date, required: true },
  photographer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: String, required: true },
});

module.exports = mongoose.model('Event', EventSchema);
