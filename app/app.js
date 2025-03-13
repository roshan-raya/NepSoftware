// Import express.js
const express = require("express");

// Create express app
const app = express();

// Middleware to parse JSON data
app.use(express.json());
// Middleware to parse form data (for profile editing)
app.use(express.urlencoded({ extended: true }));

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Use the Pug template engine 
app.set('view engine', 'pug');
app.set('views', './app/views');

// Create a route for root - /
app.get("/", function(req, res) {
    res.render("index");
});

// Route for the user list page
app.get('/userlist', async (req, res) => {
    try {
        const sql = 'SELECT * FROM userlist'; // Ensure this table name matches the actual table in your database
        const users = await db.query(sql);   // Fetch the users from the database
        console.log(users);                   // Log the data to check if it’s being fetched
        res.render('userlist', { users: users });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching users from the database");
    }
});



// Create a route for testing the database
app.get("/db_test", async function(req, res) {
    try {
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

// Create a route to fetch all users (API)
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

// Create a route to add a new user (API)
app.post("/users", async function(req, res) {
    const { name, email, password, phone_number, age } = req.body; // Added age
    try {
        const sql = `INSERT INTO users (name, email, password, phone_number, age) 
                     VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [name, email, password, phone_number, age]);
        res.send({ message: "User added successfully", user_id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding user");
    }
});

// User Profile Page (View)
app.get("/users/:id", async function(req, res) {
    try {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const [user] = await db.query(sql, [req.params.id]);
        if (user.length === 0) return res.status(404).send("User not found");
        res.render("profile", { title: `${user[0].name}'s Profile`, user: user[0], edit: false });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching user profile");
    }
});

// User Profile Page (Edit Form)
app.get("/users/:id/edit", async function(req, res) {
    try {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const [user] = await db.query(sql, [req.params.id]);
        if (user.length === 0) return res.status(404).send("User not found");
        res.render("profile", { title: `Edit ${user[0].name}'s Profile`, user: user[0], edit: true });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading edit page");
    }
});

// Handle Profile Update
app.post("/users/:id", async function(req, res) {
    const { name, email, phone_number, age } = req.body;
    try {
        const sql = `UPDATE users SET name = ?, email = ?, phone_number = ?, age = ? WHERE id = ?`;
        await db.execute(sql, [name, email, phone_number, age, req.params.id]);
        res.redirect(`/users/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating profile");
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