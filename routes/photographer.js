// photographer.js

const express = require('express');
const router = express.Router();
const Photographer = require('../models/Photographer'); // Photographer model
const Event = require('../models/Event'); // Event model

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
        res.render('photographerDashboard', { events }); // Updated to match view name
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
    try {
        const { eventId, updates } = req.body;

        if (!eventId || !updates) {
            return res.status(400).json({ error: 'Event ID and updates are required' });
        }

        // Map the form fields to database fields
        const mappedUpdates = {
            children: updates.children,
            count: updates.count,
            photo: updates.photo,
            comments: updates.comments
        };

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $set: mappedUpdates },
            { new: true }
        ).populate('photographer');

        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Route to assign photographer to event
router.put('/assign-photographer', async (req, res) => {
    try {
        const { eventId, photographerId } = req.body;
        const event = await Event.findByIdAndUpdate(
            eventId,
            { photographer: photographerId },
            { new: true }
        ).populate('photographer');
        res.json(event);
    } catch (error) {
        console.error('Error assigning photographer:', error);
        res.status(500).json({ error: 'Failed to assign photographer' });
    }
});

module.exports = router;