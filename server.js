const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// Models
const Photographer = require('./models/Photographer');
const Event = require('./models/Event');

const app = express();

// Configure middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware with secure settings
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Connect to MongoDB with error handling and retry logic
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://appleidmusic960:Dataking8@tapsidecluster.oeofi.mongodb.net/', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            retryWrites: true
        });
        console.log('Connected to MongoDB successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        setTimeout(connectDB, 5000);
    }
};

connectDB();

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

const adminCredentials = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123'
};

function checkAuth(role) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.redirect('/?error=Please login first');
        }
        if (req.session.user.role !== role) {
            return res.redirect('/?error=Unauthorized access');
        }
        next();
    };
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke! Please try again.' });
});

// Routes
app.get('/', (req, res) => {
    const error = req.query.error;
    res.render('login', { error });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('login', { error: 'Username and password are required' });
        }

        if (username === adminCredentials.username && password === adminCredentials.password) {
            req.session.user = { role: 'admin' };
            return res.redirect('/admin/dashboard');
        }

        const photographer = await Photographer.findOne({ username });
        if (photographer && photographer.password === password) {
            req.session.user = {
                role: 'photographer',
                username: photographer.username,
                id: photographer._id
            };
            return res.redirect('/photographer/dashboard');
        }

        res.render('login', { error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login' });
    }
});

app.get('/admin/dashboard', checkAuth('admin'), async (req, res) => {
    try {
        const [photographers, events] = await Promise.all([
            Photographer.find(),
            Event.find().populate('photographer')
        ]);
        res.render('adminDashboard', { photographers, events });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
});

// API Routes
app.get('/auth/photographers', async (req, res) => {
    try {
        const photographers = await Photographer.find();
        res.json(photographers);
    } catch (error) {
        console.error('Error fetching photographers:', error);
        res.status(500).json({ error: 'Failed to fetch photographers' });
    }
});

app.get('/events/all', async (req, res) => {
    try {
        const events = await Event.find().populate('photographer');
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.post('/admin/create-photographer', checkAuth('admin'), async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingPhotographer = await Photographer.findOne({ username });
        if (existingPhotographer) {
            return res.status(400).json({ error: 'Photographer with this username already exists' });
        }

        const newPhotographer = new Photographer({ username, password });
        await newPhotographer.save();
        res.status(201).json(newPhotographer);
    } catch (error) {
        console.error('Error creating photographer:', error);
        res.status(500).json({ error: 'Error creating photographer' });
    }
});

app.post('/admin/update-photographer', checkAuth('admin'), async (req, res) => {
    try {
        const { photographerId, username, password } = req.body;
        const updatedPhotographer = await Photographer.findByIdAndUpdate(
            photographerId, 
            { username, password },
            { new: true }
        );
        res.json(updatedPhotographer);
    } catch (error) {
        console.error('Error updating photographer:', error);
        res.status(500).json({ error: 'Error updating photographer' });
    }
});

app.post('/admin/update-event', checkAuth('admin'), async (req, res) => {
    try {
        const { eventId, field, value } = req.body;
        
        if (!eventId || field === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Event ID and field are required' 
            });
        }

        // Get existing event first
        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) {
            return res.status(404).json({ 
                success: false,
                error: 'Event not found' 
            });
        }

        // Create update object
        const update = {};
        update[field] = value;

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $set: update },
            { 
                new: true,
                runValidators: true 
            }
        ).populate('photographer');

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('eventUpdate', updatedEvent);
        }

        res.json({ 
            success: true,
            event: updatedEvent 
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update event',
            details: error.message 
        });
    }
});

app.get('/admin/assign-photographer', checkAuth('admin'), async (req, res) => {
    try {
        const photographers = await Photographer.find();
        const events = await Event.find().populate('photographer');
        res.render('assignPhotographer', { photographers, events });
    } catch (error) {
        console.error('Error loading assign photographer page:', error);
        res.status(500).json({ error: 'Failed to load assign photographer page' });
    }
});

app.post('/admin/assign-photographer', checkAuth('admin'), async (req, res) => {
    try {
        const { eventId, photographerId } = req.body;
        
        if (!eventId || !photographerId) {
            return res.status(400).json({ error: 'Event ID and photographer ID are required' });
        }

        const event = await Event.findByIdAndUpdate(
            eventId,
            { photographer: photographerId },
            { new: true }
        ).populate('photographer');

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Error assigning photographer:', error);
        res.status(500).json({ error: 'Failed to assign photographer' });
    }
});

app.post('/events/create', checkAuth('admin'), async (req, res) => {
    try {
        const eventData = req.body;
        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();
        const populatedEvent = await Event.findById(savedEvent._id).populate('photographer');
        
        res.status(201).json(populatedEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event', details: error.message });
    }
});

app.delete('/events/:id', checkAuth('admin'), async (req, res) => {
    try {
        const eventId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const result = await Event.findByIdAndDelete(eventId);
        if (!result) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

app.get('/photographer/dashboard', checkAuth('photographer'), async (req, res) => {
    try {
        const events = await Event.find({ photographer: req.session.user.id });
        res.render('photographerDashboard', { 
            events, 
            username: req.session.user.username 
        });
    } catch (error) {
        console.error('Error loading photographer dashboard:', error);
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
});

app.post('/photographer/update-event', checkAuth('photographer'), async (req, res) => {
    try {
        const { eventId, updates } = req.body;
        
        if (!eventId || !updates) {
            return res.status(400).json({ error: 'Event ID and updates are required' });
        }

        // Get existing event first
        const existingEvent = await Event.findOne({ 
            _id: eventId, 
            photographer: req.session.user.id 
        });

        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found or unauthorized' });
        }

        // Merge existing data with updates
        const validUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined && value !== null && value !== '') {
                validUpdates[key] = value;
            } else {
                // Keep existing value if update is empty
                validUpdates[key] = existingEvent[key];
            }
        }

        const event = await Event.findOneAndUpdate(
            { 
                _id: eventId, 
                photographer: req.session.user.id 
            },
            { $set: validUpdates },
            { 
                new: true,
                runValidators: true
            }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('eventUpdate', event);
        }

        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            error: 'Failed to update event',
            details: error.message
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// Set up Socket.IO
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('io', io);

io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});