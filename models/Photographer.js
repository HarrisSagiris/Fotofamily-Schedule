const mongoose = require('mongoose');

const photographerSchema = new mongoose.Schema({
    username: String,
    password: String,
});

module.exports = mongoose.model('Photographer', photographerSchema);
