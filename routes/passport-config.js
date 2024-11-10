const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');

const ADMIN_CREDENTIALS = { email: 'admin@gmail.com', password: 'admin123', role: 'admin' };

module.exports = (passport) => {
    passport.use(new LocalStrategy({ usernameField: 'email' },
        async (email, password, done) => {
            try {
                // Check for hardcoded admin
                if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
                    return done(null, ADMIN_CREDENTIALS);
                }

                // Check for photographer
                const user = await User.findOne({ email });
                if (!user) return done(null, false, { message: 'Incorrect email.' });
                if (user.password !== password) return done(null, false, { message: 'Incorrect password.' });
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.email);
    });

    passport.deserializeUser(async (email, done) => {
        try {
            if (email === ADMIN_CREDENTIALS.email) {
                done(null, ADMIN_CREDENTIALS);
            } else {
                const user = await User.findOne({ email });
                done(null, user);
            }
        } catch (error) {
            done(error);
        }
    });
};
