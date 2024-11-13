// admin.js

const express = require('express');
const router = express.Router();
const Photographer = require('../models/photographer'); // Photographer model
const Event = require('../models/event'); // Event model

// Middleware to ensure admin is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/login');
}

// Admin Dashboard - List of events and photographers
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const events = await Event.find().populate('photographer');
        const photographers = await Photographer.find();
        res.render('admin', { events, photographers });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).send('Server error');
    }
});

// Route to add a new photographer
router.post('/add-photographer', isAuthenticated, async (req, res) => {
    const { username, password } = req.body;
    try {
        const newPhotographer = new Photographer({ username, password });
        await newPhotographer.save();
        res.redirect('/admin');
    } catch (error) {
        console.error('Error adding photographer:', error);
        res.status(500).send('Server error');
    }
});

// Route to assign a photographer to an event
router.post('/assign-photographer', isAuthenticated, async (req, res) => {
    const { eventId, photographerId } = req.body;
    try {
        await Event.findByIdAndUpdate(eventId, { photographer: photographerId });
        res.redirect('/admin'); // Redirect back to the admin dashboard
    } catch (error) {
        console.error('Error assigning photographer:', error);
        res.status(500).send('Server error');
    }
});

// Login route for admin
router.get('/login', (req, res) => {
    res.render('login'); // Render the login page
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Replace with your actual admin credentials
    const adminUsername = 'admin';
    const adminPassword = 'password';

    if (username === adminUsername && password === adminPassword) {
        req.session.isAdmin = true; // Set session to indicate admin is logged in
        res.redirect('/admin');
    } else {
        res.status(401).send('Invalid login');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
