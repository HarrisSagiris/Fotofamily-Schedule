const express = require("express");
const router = express.Router();

// Hardcoded admin credentials
const adminCredentials = {
    email: "admin@gmail.com",
    password: "123",
};

// Render login page
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// Login route
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email === adminCredentials.email && password === adminCredentials.password) {
        req.session.userId = "admin";
        req.session.role = "admin";
        res.redirect("/admin");
    } else {
        res.render("login", { error: "Invalid credentials" });
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

module.exports = router;
