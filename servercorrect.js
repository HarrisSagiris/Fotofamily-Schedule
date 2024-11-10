const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const xlsx = require('xlsx');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://appleidmusic960:Dataking8@tapsidecluster.oeofi.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Photographer schema and model
const photographerSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Photographer = mongoose.model('Photographer', photographerSchema);

// Event schema and model
const eventSchema = new mongoose.Schema({
  date: String,
  time: String,
  location: String,
  photographer: String,
});

const Event = mongoose.model('Event', eventSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(fileUpload());
app.set('view engine', 'ejs');
app.set('views', './views');

// Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Hardcoded admin credentials
const adminCredentials = { email: 'admin@gmail.com', password: '123' };

// Middleware for access control
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/login');
};

const isPhotographer = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'photographer') return next();
  res.redirect('/login');
};

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Login route
app.get('/login', (req, res) => {
  res.render('login', { message: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if admin credentials match
  if (email === adminCredentials.email && password === adminCredentials.password) {
    req.session.user = { role: 'admin' };
    return res.redirect('/admin');
  }

  // Check if photographer credentials match in database
  const photographer = await Photographer.findOne({ username: email, password });
  if (photographer) {
    req.session.user = { role: 'photographer', name: photographer.username };
    return res.redirect('/photographer');
  }

  // Invalid credentials
  res.render('login', { message: 'Invalid credentials' });
});

// Admin dashboard
app.get('/admin', isAdmin, async (req, res) => {
  const events = await Event.find({});
  const photographers = await Photographer.find({});
  res.render('admin', { events, photographers });
});

// Add photographer route (for admin to create new photographer accounts)
app.post('/add-photographer', isAdmin, async (req, res) => {
  const { username, password } = req.body;
  const newPhotographer = new Photographer({ username, password });
  await newPhotographer.save();
  res.redirect('/admin');
});

// File upload route (for admin to upload schedule)
app.post('/upload', isAdmin, async (req, res) => {
  if (!req.files || !req.files.excelFile) {
    return res.status(400).send('No file uploaded.');
  }

  const workbook = xlsx.read(req.files.excelFile.data, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  await Event.deleteMany({});
  await Event.insertMany(data.map(row => ({
    date: row.Date,
    time: row.Time,
    location: row.Location,
    photographer: row.Photographer,
  })));

  res.redirect('/admin');
});

// Photographer dashboard
app.get('/photographer', isPhotographer, async (req, res) => {
  const events = await Event.find({ photographer: req.session.user.name });
  res.render('photographer', { events });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
