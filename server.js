const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const path = require("path");

// Initialize app
const app = express();

// Database connection setup
mongoose.connect("mongodb+srv://appleidmusic960:Dataking8@tapsidecluster.oeofi.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

// Models
const User = require("./models/User");
const Event = require("./models/Event");

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Static folder for CSS, JS, etc.
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session setup
app.use(
    session({
        secret: "yourSecretKey",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: "mongodb+srv://appleidmusic960:Dataking8@tapsidecluster.oeofi.mongodb.net/" }),
    })
);

// Middleware for user sessions
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "123";

// Login route
app.get("/auth/login", (req, res) => {
    res.render("login", { message: null });
});

app.post("/auth/login", (req, res) => {
    const { email, password } = req.body;

    // Check if the credentials match the hardcoded admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Set the session for the admin
        req.session.user = { email: ADMIN_EMAIL, role: "admin" };
        res.redirect("/admin");
    } else {
        // Attempt to find a photographer in the database
        User.findOne({ email, role: "photographer" }, (err, user) => {
            if (err || !user) {
                return res.render("login", { message: "Invalid credentials" });
            }

            // Redirect photographer to their dashboard
            req.session.user = { email: user.email, role: "photographer" };
            res.redirect("/photographer");
        });
    }
});

// Logout route
app.get("/auth/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/auth/login");
});

// Protect admin routes
const isAuthenticatedAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === "admin") {
        return next();
    }
    res.redirect("/auth/login");
};

// Protect photographer routes
const isAuthenticatedPhotographer = (req, res, next) => {
    if (req.session.user && req.session.user.role === "photographer") {
        return next();
    }
    res.redirect("/auth/login");
};

// Admin dashboard route
app.get("/admin", isAuthenticatedAdmin, (req, res) => {
    res.render("admin_dashboard"); // Render your admin dashboard view
});

// Photographer dashboard route
app.get("/photographer", isAuthenticatedPhotographer, (req, res) => {
    res.render("photographer_dashboard"); // Render your photographer dashboard view
});

// Default route
app.get("/", (req, res) => {
    res.redirect("/auth/login");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
