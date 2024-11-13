// photographer.js

const express = require('express');
const router = express.Router();
const Photographer = require('../models/photographer'); // Photographer model
const Event = require('../models/event'); // Event model

// Middleware to ensure photographer is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.photographerId) {
        return next();
    }
    res.redirect('/photographer/login');
}

// Photographer Dashboard - View assigned events
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const events = await Event.find({ photographer: req.session.photographerId });
        res.render('photographer', { events });
    } catch (error) {
        console.error('Error loading photographer dashboard:', error);
        res.status(500).send('Server error');
    }
});

// Login route for photographer
router.get('/login', (req, res) => {
    res.render('photographer_login'); // Render the photographer login page
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const photographer = await Photographer.findOne({ username });
        
        if (photographer && photographer.password === password) {
            req.session.photographerId = photographer._id; // Set session to indicate photographer is logged in
            res.redirect('/photographer');
        } else {
            res.status(401).send('Invalid login');
        }
    } catch (error) {
        console.error('Error during photographer login:', error);
        res.status(500).send('Server error');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/photographer/login');
    });
});

// Update specific fields for an event by the photographer
router.post('/update-event', isAuthenticated, async (req, res) => {
    const { eventId, childrenCount, photo, comments } = req.body;

    try {
        await Event.findByIdAndUpdate(eventId, {
            childrenCount,
            photo,
            comments,
        });
        res.redirect('/photographer'); // Redirect back to photographer dashboard
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
