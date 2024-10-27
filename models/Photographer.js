const mongoose = require('mongoose');

const photographerSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

module.exports = mongoose.model('Photographer', photographerSchema);
