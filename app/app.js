// Import express.js
const express = require("express");
const path = require("path");

// Create express app
var app = express();

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add static files location
app.use(express.static("static"));
app.use('/css', express.static(path.join(__dirname, '../static/css')));
app.use('/images', express.static(path.join(__dirname, '../static/images')));
app.use(express.static(path.join(__dirname, '../styles')));

// Add a helper function for profile photos with default fallback
app.locals.getProfilePhoto = function(photoName) {
    return '/images/profiles/default.jpg';
};

// Import routes
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.render('index');
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
