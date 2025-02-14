// Import express.js
const express = require("express");

// Create express app
var app = express();

// Middleware to parse JSON data
app.use(express.json());

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.send("Welcome to the Ride-Sharing App!");
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

// Create a route to fetch all rides
app.get("/rides", async function(req, res) {
    try {
        const sql = 'SELECT * FROM rides';
        const [rides] = await db.query(sql);
        res.send(rides);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching rides");
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
        res.send(users);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching users");
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
