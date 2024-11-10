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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
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
    const photographers = await Photographer.find();
    const events = await Event.find().populate('photographer');
    res.render('adminDashboard', { photographers, events });
});

// Route to add photographer
app.post('/admin/add-photographer', checkAuth('admin'), async (req, res) => {
    const { username, password } = req.body;
    const newPhotographer = new Photographer({ username, password });
    await newPhotographer.save();
    res.redirect('/admin/dashboard');
});

// Route to add event
app.post('/admin/add-event', checkAuth('admin'), async (req, res) => {
    const { name, date, location, photographerId } = req.body;
    const newEvent = new Event({ name, date, location, photographer: photographerId });
    await newEvent.save();
    res.redirect('/admin/dashboard');
});

// Photographer dashboard
app.get('/photographer/dashboard', checkAuth('photographer'), async (req, res) => {
    const events = await Event.find({ photographer: req.session.user.id });
    res.render('photographerDashboard', { events });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
