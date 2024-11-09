module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

module.exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access Denied');
};

module.exports.isPhotographer = (req, res, next) => {
    if (req.user && req.user.role === 'photographer') {
        return next();
    }
    res.status(403).send('Access Denied');
};
