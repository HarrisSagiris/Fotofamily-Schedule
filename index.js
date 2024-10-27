require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error(err));

app.use('/admin', adminRoutes);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
