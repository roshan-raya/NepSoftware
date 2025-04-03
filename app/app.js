// Import express.js
const express = require("express");
const path = require("path");
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Create express app
var app = express();

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie and session middleware
app.use(cookieParser());
app.use(session({
    secret: process.env.JWT_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Add static files location with improved organization
app.use(express.static("static"));
app.use('/css', express.static(path.join(__dirname, '../static/css')));
app.use('/js', express.static(path.join(__dirname, '../static/js')));
app.use('/vendor', express.static(path.join(__dirname, '../static/vendor')));
app.use('/images', express.static(path.join(__dirname, '../static/images')));
app.use('/fonts', express.static(path.join(__dirname, '../static/fonts')));

// Add a helper function for profile photos with default fallback
app.locals.getProfilePhoto = function(photoName) {
    if (!photoName) return '/images/profiles/default.jpg';
    return `/images/profiles/${photoName}`;
};

// Add a helper for formatting dates
app.locals.formatDate = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Add a helper for rating stars
app.locals.ratingStars = function(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star text-warning"></i>';
    }
    
    if (halfStar) {
        html += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star text-warning"></i>';
    }
    
    return html;
};

// Import middleware
const auth = require('./middleware/auth');

// Import routes
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

// Get the functions in the db.js file to use
const db = require('./services/db');
const MatchingService = require('./services/matchingService');

// Apply authentication check middleware to all routes to make user info available
app.use(auth.isAuthenticated);

// Create a route for root - /
app.get("/", async function(req, res) {
    try {
        // Get upcoming rides for homepage
        const upcomingRides = await MatchingService.getUpcomingRides();
        
        res.render('index', {
            title: 'Roehampton Ride Sharing',
            user: req.user,
            upcomingRides
        });
    } catch (error) {
        console.error(error);
        res.render('index', {
            title: 'Roehampton Ride Sharing',
            user: req.user,
            upcomingRides: []
        });
    }
});

// Dashboard route (protected)
app.get("/dashboard", auth.verifyToken, async function(req, res) {
    try {
        // Redirect to auth controller dashboard method
        res.redirect('/auth/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error loading dashboard',
            error: { status: 500 }
        });
    }
});

// Create a route for testing the database
app.get("/db_test", async function(req, res) {
    try {
        const sql = 'SELECT * FROM Users';
        const results = await db.query(sql);
        console.log(results);
        res.send(results);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection error");
    }
});

// Add a diagnostic route to check all tables
app.get("/diagnostic", async function(req, res) {
    try {
        const output = {};
        
        // Test Users table
        try {
            const usersSql = 'SELECT COUNT(*) as count FROM Users';
            const usersResult = await db.query(usersSql);
            output.users = {
                success: true,
                count: usersResult[0].count,
                message: 'Users table accessible'
            };
        } catch (error) {
            output.users = {
                success: false,
                error: error.message,
                message: 'Error accessing Users table'
            };
        }
        
        // Test Rides table
        try {
            const ridesSql = 'SELECT COUNT(*) as count FROM Rides';
            const ridesResult = await db.query(ridesSql);
            output.rides = {
                success: true,
                count: ridesResult[0].count,
                message: 'Rides table accessible'
            };
        } catch (error) {
            output.rides = {
                success: false,
                error: error.message,
                message: 'Error accessing Rides table'
            };
        }
        
        // Test Ride_Requests table
        try {
            const requestsSql = 'SELECT COUNT(*) as count FROM Ride_Requests';
            const requestsResult = await db.query(requestsSql);
            output.requests = {
                success: true,
                count: requestsResult[0].count,
                message: 'Ride_Requests table accessible'
            };
        } catch (error) {
            output.requests = {
                success: false,
                error: error.message,
                message: 'Error accessing Ride_Requests table'
            };
        }
        
        // Test Ratings table
        try {
            const ratingsSql = 'SELECT COUNT(*) as count FROM Ratings';
            const ratingsResult = await db.query(ratingsSql);
            output.ratings = {
                success: true,
                count: ratingsResult[0].count,
                message: 'Ratings table accessible'
            };
        } catch (error) {
            output.ratings = {
                success: false,
                error: error.message,
                message: 'Error accessing Ratings table'
            };
        }
        
        // Test Messages table
        try {
            const messagesSql = 'SELECT COUNT(*) as count FROM Messages';
            const messagesResult = await db.query(messagesSql);
            output.messages = {
                success: true,
                count: messagesResult[0].count,
                message: 'Messages table accessible'
            };
        } catch (error) {
            output.messages = {
                success: false,
                error: error.message,
                message: 'Error accessing Messages table'
            };
        }
        
        // Test a simple join query
        try {
            const joinSql = `
                SELECT r.id, u.name 
                FROM Rides r 
                JOIN Users u ON r.driver_id = u.id 
                LIMIT 1
            `;
            const joinResult = await db.query(joinSql);
            output.join = {
                success: true,
                result: joinResult,
                message: 'Join query successful'
            };
        } catch (error) {
            output.join = {
                success: false,
                error: error.message,
                message: 'Error with join query'
            };
        }
        
        res.json(output);
    } catch (error) {
        console.error('Diagnostic error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Diagnostic test failed'
        });
    }
});

// Use routes
app.use("/users", userRoutes);
app.use("/rides", rideRoutes);
app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
app.use("/ratings", ratingRoutes);

// Error handler
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('error', {
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Export the app
module.exports = app;
