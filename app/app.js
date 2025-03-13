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
app.use(express.static(path.join(__dirname, '../styles')));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.render('index', { title: 'Ride-Sharing App' });
});

// Create a route for testing the database
app.get("/db_test", async function(req, res) {
    try {
        // Query the users table to test connection
        const sql = 'SELECT * FROM users';
        const [results] = await db.query(sql);
        console.log(results);
        res.send(results);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection error");
    }
});

// Create a route to fetch all tags
app.get("/tags", async function(req, res) {
    try {
        const sql = 'SELECT * FROM tags';
        const [tags] = await db.query(sql);
        res.render('tags/list', { title: 'All Tags', tags });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching tags");
    }
});

// Create a route to fetch all rides
app.get("/rides", async function(req, res) {
    try {
        let sql, params = [];
        let tagFilter = null;
        
        // Get all tags for the filter
        const [tags] = await db.query('SELECT * FROM tags');
        
        // Check if tag filter is applied
        if (req.query.tag) {
            tagFilter = parseInt(req.query.tag);
            sql = `
                SELECT r.*, u.name as driver_name 
                FROM rides r
                JOIN users u ON r.driver_id = u.id
                JOIN ride_tags rt ON r.id = rt.ride_id
                WHERE rt.tag_id = ?
                ORDER BY r.departure_time
            `;
            params = [tagFilter];
        } else {
            sql = `
                SELECT r.*, u.name as driver_name 
                FROM rides r
                JOIN users u ON r.driver_id = u.id
                ORDER BY r.departure_time
            `;
        }
        
        const [rides] = await db.query(sql, params);
        
        res.render('rides/list', { 
            title: 'Available Rides', 
            rides,
            tags,
            tagFilter
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching rides");
    }
});

// Create a route to get ride details
app.get("/rides/:id", async function(req, res) {
    try {
        const rideId = req.params.id;
        const sql = `
            SELECT r.*, u.name as driver_name, u.email as driver_email, u.phone_number as driver_phone
            FROM rides r
            JOIN users u ON r.driver_id = u.id
            WHERE r.id = ?
        `;
        const [rides] = await db.query(sql, [rideId]);
        
        if (rides.length === 0) {
            return res.status(404).send("Ride not found");
        }
        
        const ride = rides[0];
        
        // Get bookings for this ride
        const bookingsSql = `
            SELECT b.*, u.name as passenger_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.ride_id = ?
        `;
        const [bookings] = await db.query(bookingsSql, [rideId]);
        
        // Get tags for this ride
        const tagsSql = `
            SELECT t.*
            FROM tags t
            JOIN ride_tags rt ON t.id = rt.tag_id
            WHERE rt.ride_id = ?
        `;
        const [tags] = await db.query(tagsSql, [rideId]);
        
        res.render('rides/detail', { 
            title: `Ride from ${ride.origin} to ${ride.destination}`,
            ride,
            bookings,
            tags
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching ride details");
    }
});

// Create a route to add a new ride
app.post("/rides", async function(req, res) {
    const { driver_id, origin, destination, departure_time, available_seats, price } = req.body;

    try {
        const sql = `INSERT INTO rides (driver_id, origin, destination, departure_time, available_seats, price) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [driver_id, origin, destination, departure_time, available_seats, price]);
        res.send({ message: "Ride added successfully", ride_id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding ride");
    }
});

// Create a route to fetch all users
app.get("/users", async function(req, res) {
    try {
        const sql = 'SELECT * FROM users';
        const [users] = await db.query(sql);
        res.render('users/list', { title: 'All Users', users });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching users");
    }
});

// Create a route to get user profile
app.get("/users/:id", async function(req, res) {
    try {
        const userId = req.params.id;
        const sql = 'SELECT * FROM users WHERE id = ?';
        const [users] = await db.query(sql, [userId]);
        
        if (users.length === 0) {
            return res.status(404).send("User not found");
        }
        
        const user = users[0];
        
        // Get rides offered by this user
        const ridesSql = 'SELECT * FROM rides WHERE driver_id = ?';
        const [rides] = await db.query(ridesSql, [userId]);
        
        // Get bookings made by this user
        const bookingsSql = `
            SELECT b.*, r.origin, r.destination, r.departure_time
            FROM bookings b
            JOIN rides r ON b.ride_id = r.id
            WHERE b.user_id = ?
        `;
        const [bookings] = await db.query(bookingsSql, [userId]);
        
        res.render('users/profile', { 
            title: `${user.name}'s Profile`,
            user,
            rides,
            bookings
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching user profile");
    }
});

// Create a route to add a new user
app.post("/users", async function(req, res) {
    const { name, email, password, phone_number } = req.body;

    try {
        const sql = `INSERT INTO users (name, email, password, phone_number) 
                     VALUES (?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [name, email, password, phone_number]);
        res.send({ message: "User added successfully", user_id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding user");
    }
});

// Create a route to fetch all bookings
app.get("/bookings", async function(req, res) {
    try {
        const sql = 'SELECT * FROM bookings';
        const [bookings] = await db.query(sql);
        res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching bookings");
    }
});

// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
