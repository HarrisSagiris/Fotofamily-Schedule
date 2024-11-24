const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// Models
const Photographer = require('./models/Photographer');
const Event = require('./models/Event');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Connect to MongoDB
mongoose.connect('mongodb+srv://appleidmusic960:Dataking8@tapsidecluster.oeofi.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Hardcoded admin credentials
const adminCredentials = { username: 'admin', password: 'admin123' };

// Middleware to check if user is logged in
function checkAuth(role) {
    return (req, res, next) => {
        if (req.session.user && req.session.user.role === role) {
            next();
        } else {
            res.redirect('/');
        }
    };
}

// Route for login page
app.get('/', (req, res) => {
    res.render('login');
});

// Login POST route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check admin credentials
    if (username === adminCredentials.username && password === adminCredentials.password) {
        req.session.user = { role: 'admin' };
        return res.redirect('/admin/dashboard');
    }

    // Check photographer credentials
    const photographer = await Photographer.findOne({ username, password });
    if (photographer) {
        req.session.user = { role: 'photographer', username: photographer.username, id: photographer._id };
        return res.redirect('/photographer/dashboard');
    }

    res.render('login', { error: 'Invalid credentials' });
});

// Admin dashboard
app.get('/admin/dashboard', checkAuth('admin'), async (req, res) => {
    try {
        const photographers = await Photographer.find();
        const events = await Event.find().populate('photographer');
        res.render('adminDashboard', { photographers, events });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// Get all photographers (for dropdown)
app.get('/auth/photographers', checkAuth('admin'), async (req, res) => {
    try {
        const photographers = await Photographer.find();
        res.json(photographers);
    } catch (error) {
        console.error('Error fetching photographers:', error);
        res.status(500).json({ error: 'Failed to fetch photographers' });
    }
});

// Get all events
app.get('/events/all', async (req, res) => {
    try {
        const events = await Event.find().populate('photographer');
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Route to add photographer
app.post('/admin/create-photographer', checkAuth('admin'), async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if photographer already exists
        const existingPhotographer = await Photographer.findOne({ username });
        if (existingPhotographer) {
            return res.status(400).send('Photographer with this username already exists');
        }

        const newPhotographer = new Photographer({ username, password });
        await newPhotographer.save();
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error creating photographer:', error);
        res.status(500).send('Error creating photographer');
    }
});

// Route to update photographer
app.post('/admin/update-photographer', checkAuth('admin'), async (req, res) => {
    try {
        const { photographerId, username, password } = req.body;
        await Photographer.findByIdAndUpdate(photographerId, { username, password });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error updating photographer:', error);
        res.status(500).send('Error updating photographer');
    }
});

// Route to assign photographer to event
app.put('/admin/assign-photographer', checkAuth('admin'), async (req, res) => {
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

// Route to add event
app.post('/events/create', checkAuth('admin'), async (req, res) => {
    try {
        const { title, date, time, location, photographer } = req.body;
        
        if (!title || !date || !time || !location) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let photographerId = null;
        if (photographer && photographer !== 'unassigned') {
            photographerId = mongoose.Types.ObjectId(photographer);
        }
        
        const newEvent = new Event({ 
            title, 
            date, 
            time,
            location, 
            photographer: photographerId
        });
        
        const savedEvent = await newEvent.save();
        const populatedEvent = await Event.findById(savedEvent._id).populate('photographer');
        res.status(201).json(populatedEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Delete event route
app.delete('/events/:id', checkAuth('admin'), async (req, res) => {
    try {
        const result = await Event.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Photographer dashboard
app.get('/photographer/dashboard', checkAuth('photographer'), async (req, res) => {
    try {
        const events = await Event.find({ photographer: req.session.user.id });
        res.render('photographerDashboard', { events, username: req.session.user.username });
    } catch (error) {
        console.error('Error loading photographer dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));