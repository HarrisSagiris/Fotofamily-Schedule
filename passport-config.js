const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Ensure this path is correct

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
        User.findOne({ username: username })
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }

                // Compare passwords
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Incorrect password.' });
                    }
                });
            })
            .catch(err => console.error(err));
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id)
            .then(user => {
                done(null, user);
            })
            .catch(err => console.error(err));
    });
};
