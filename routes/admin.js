const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const router = express.Router();

// Ensure only admin can access
router.use((req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        next();
    } else {
        res.redirect('/');
    }
});

// Admin dashboard
router.get('/dashboard', async (req, res) => {
    const photographers = await User.find({ role: 'photographer' });
    const events = await Event.find().populate('photographer');
    res.render('adminDashboard', { photographers, events });
});

// Event creation
router.post('/event/create', async (req, res) => {
    try {
        const { name, date, location, place, comments, photographer } = req.body;
        const newEvent = new Event({ name, date, location, place, comments, photographer });
        await newEvent.save();
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).send('Error creating event');
    }
});

// Event deletion
router.post('/event/delete/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).send('Error deleting event');
    }
});

module.exports = router;
