const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/',
    successRedirect: '/dashboard',
}));

router.post('/register/photographer', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newPhotographer = new User({
            username,
            password,
            role: 'photographer',
        });
        await newPhotographer.save();
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).send('Error creating photographer');
    }
});

module.exports = router;
