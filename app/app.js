// Import express.js
const express = require("express");
const path = require("path");

// Create express app
var app = express();

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// app.set('views','./app/views'); // Removed old path
// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add static files location
app.use(express.static("static"));
app.use('/css', express.static(path.join(__dirname, '../static/css')));
app.use('/images', express.static(path.join(__dirname, '../static/images')));
app.use(express.static(path.join(__dirname, '../styles')));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.render('index');
});

// Create a route for testing the database
app.get("/db_test", async function(req, res) {
    try {
        // Query the users table to test connection
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
        
        // Return all diagnostic information
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

// Create a route to fetch all tags
app.get("/tags", async function(req, res) {
    try {
<<<<<<< HEAD
        // Get all tags from rides
        const sql = `
            SELECT DISTINCT tags
            FROM Rides
            WHERE tags IS NOT NULL AND tags != ''
            LIMIT 50
        `;
        
        const tagsResult = await db.query(sql);
        
        // Extract unique tags and count rides for each tag
        const tagMap = new Map();
        
        tagsResult.forEach(row => {
            if (row.tags) {
                row.tags.split(',').forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag) {
                        if (tagMap.has(trimmedTag)) {
                            tagMap.set(trimmedTag, tagMap.get(trimmedTag) + 1);
                        } else {
                            tagMap.set(trimmedTag, 1);
                        }
                    }
                });
            }
        });
        
        // Convert to array of objects for the template
        const tags = Array.from(tagMap.entries()).map(([name, ride_count]) => ({
            name,
            ride_count
        }));
=======
        // Get all unique tags and count rides for each tag
        const sql = `
            SELECT DISTINCT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(r.tags, ',', n.n), ',', -1)) AS name,
            COUNT(DISTINCT r.id) AS ride_count
            FROM Rides r
            JOIN (
                SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
                SELECT 4 UNION ALL SELECT 5
            ) n ON CHAR_LENGTH(r.tags) - CHAR_LENGTH(REPLACE(r.tags, ',', '')) >= n.n - 1
            GROUP BY name
            ORDER BY name;
        `;
        const tags = await db.query(sql);
>>>>>>> origin/main
        
        // Check if a specific tag is selected
        const selectedTag = req.query.tag;
        let taggedRides = [];
        
        if (selectedTag) {
<<<<<<< HEAD
            // Get rides with the selected tag - using a simple query
=======
            // Get rides with the selected tag
>>>>>>> origin/main
            const ridesSql = `
                SELECT r.*, u.name AS driver_name, u.profile_photo
                FROM Rides r
                JOIN Users u ON r.driver_id = u.id
                WHERE r.tags LIKE ?
<<<<<<< HEAD
                ORDER BY r.departure_time
                LIMIT 50
            `;
            // Use a simple LIKE query
            taggedRides = await db.query(ridesSql, [`%${selectedTag}%`]);
=======
                ORDER BY r.departure_time;
            `;
            // Ensure the parameter is properly formatted
            const tagParam = `%${selectedTag}%`;
            taggedRides = await db.query(ridesSql, [tagParam]);
>>>>>>> origin/main
        }
        
        res.render('tags_list', { 
            title: 'Tags & Categories', 
            tags, 
            selectedTag, 
            taggedRides 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching tags");
    }
});

// Users list route
app.get("/users", async function(req, res) {
    try {
        const sql = 'SELECT * FROM Users ORDER BY name';
        const users = await db.query(sql);
        res.render('users_list', { title: 'Users List', users });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching users");
    }
});

// User profile route
app.get("/users/:id", async function(req, res) {
    try {
        const userId = parseInt(req.params.id, 10);
        
        // Get user details
        const userSql = 'SELECT * FROM Users WHERE id = ?';
        const [user] = await db.query(userSql, [userId]);
        
        if (!user) {
            return res.status(404).render('users_profile', { title: 'User Not Found', user: null });
        }
        
        // Get user's rides
        const ridesSql = 'SELECT * FROM Rides WHERE driver_id = ? ORDER BY departure_time';
        const rides = await db.query(ridesSql, [userId]);
        
        // Get user's ride requests
        const requestsSql = 'SELECT * FROM Ride_Requests WHERE passenger_id = ? ORDER BY requested_at DESC';
        const requests = await db.query(requestsSql, [userId]);
        
        res.render('users_profile', { 
            title: `${user.name}'s Profile`, 
            user, 
            rides, 
            requests 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching user profile");
    }
});

// Rides listing route
app.get("/rides", async function(req, res) {
    try {
<<<<<<< HEAD
        const search = req.query.search || '';
        const tag = req.query.tag || '';
        
        // Build the query based on filters
        let sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
        `;
        
        const params = [];
        
        // Add WHERE clause only if we have filters
        if (search || tag) {
            sql += ' WHERE ';
            
            if (search) {
                sql += '(r.pickup_location LIKE ? OR r.dropoff_location LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
                
                if (tag) {
                    sql += ' AND ';
                }
            }
            
            if (tag) {
                sql += 'r.tags LIKE ?';
                params.push(`%${tag}%`);
            }
        }
        
        // Add ordering and limit
        sql += ` ORDER BY r.departure_time LIMIT 50`;
        
        console.log('Executing rides query:', sql, params);
        
        const rides = await db.query(sql, params);
        console.log(`Found ${rides.length} rides`);
        
        // Get all unique tags for the filter dropdown - very simple query
        const tagsSql = `
            SELECT DISTINCT tags
=======
        // Use a simpler query without pagination first
        const simpleSql = `
            SELECT r.*, u.name AS driver_name
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            ORDER BY r.departure_time
            LIMIT 50
        `;
        
        console.log('Executing simple rides query:', simpleSql);
        
        const rides = await db.query(simpleSql);
        console.log(`Found ${rides.length} rides`);
        
        // Get all unique tags for the filter dropdown
        const tagsSql = `
            SELECT DISTINCT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', 1), ',', -1)) AS tag
>>>>>>> origin/main
            FROM Rides
            WHERE tags IS NOT NULL AND tags != ''
            LIMIT 20
        `;
        
<<<<<<< HEAD
        console.log('Executing tags query:', tagsSql);
        const tagsResult = await db.query(tagsSql);
        console.log('Tags result:', tagsResult);
        
        // Extract unique tags from the results
        const allTags = new Set();
        tagsResult.forEach(row => {
            if (row.tags) {
                row.tags.split(',').forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag) {
                        allTags.add(trimmedTag);
                    }
                });
            }
        });
        
        const tags = Array.from(allTags);
=======
        console.log('Executing simple tags query:', tagsSql);
        const tagsResult = await db.query(tagsSql);
        console.log('Tags result:', tagsResult);
        
        const tags = tagsResult.map(row => row.tag);
>>>>>>> origin/main
        
        res.render('rides_list', { 
            title: 'Available Rides', 
            rides, 
<<<<<<< HEAD
            search,
            tag,
=======
            search: '',
            tag: '',
>>>>>>> origin/main
            tags,
            currentPage: 1, 
            totalPages: 1
        });
    } catch (error) {
        console.error('Error in /rides route:', error);
        console.error('Error stack:', error.stack);
        res.status(500).render('error', { 
            message: 'Error fetching rides', 
            error: { status: 500, stack: error.stack } 
        });
    }
});

// Ride detail route
app.get("/rides/:id", async function(req, res) {
    try {
        const rideId = parseInt(req.params.id, 10);
        
        // Get ride details with driver information
        const rideSql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.id = ?
        `;
        const [ride] = await db.query(rideSql, [rideId]);
        
        if (!ride) {
            return res.status(404).render('rides_detail', { title: 'Ride Not Found', ride: null });
        }
        
        // Get ride requests with passenger information
        const requestsSql = `
            SELECT rr.*, u.name AS passenger_name, u.profile_photo
            FROM Ride_Requests rr
            JOIN Users u ON rr.passenger_id = u.id
            WHERE rr.ride_id = ?
            ORDER BY rr.requested_at
        `;
        const requests = await db.query(requestsSql, [rideId]);
        
        res.render('rides_detail', { 
            title: `Ride Details: ${ride.pickup_location} to ${ride.dropoff_location}`,
            ride,
            requests
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching ride details");
    }
});

// Route to handle ride request submission
app.post("/rides/:id/request", async function(req, res) {
    try {
        const rideId = parseInt(req.params.id, 10);
        const passengerId = 1; // In a real app, this would come from the authenticated user
        const message = req.body.message || '';
        
        // Check if the ride exists and has available seats
        const rideSql = 'SELECT * FROM Rides WHERE id = ? AND seats_available > 0';
        const [ride] = await db.query(rideSql, [rideId]);
        
        if (!ride) {
            return res.status(404).send("Ride not found or no seats available");
        }
        
        // Check if the user already has a request for this ride
        const checkSql = 'SELECT * FROM Ride_Requests WHERE ride_id = ? AND passenger_id = ?';
        const existingRequests = await db.query(checkSql, [rideId, passengerId]);
        
        if (existingRequests.length > 0) {
            return res.status(400).send("You already have a request for this ride");
        }
        
        // Insert the new request
        const insertSql = 'INSERT INTO Ride_Requests (ride_id, passenger_id, status) VALUES (?, ?, "pending")';
        await db.query(insertSql, [rideId, passengerId]);
        
        res.redirect(`/rides/${rideId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error submitting ride request");
    }
});

// Routes to handle request acceptance/rejection
app.post("/rides/:rideId/requests/:requestId/accept", async function(req, res) {
    try {
        const rideId = parseInt(req.params.rideId, 10);
        const requestId = parseInt(req.params.requestId, 10);
        
        // Update the request status
        const updateSql = 'UPDATE Ride_Requests SET status = "accepted" WHERE id = ?';
        await db.query(updateSql, [requestId]);
        
        // Decrease available seats
        const updateRideSql = 'UPDATE Rides SET seats_available = seats_available - 1 WHERE id = ? AND seats_available > 0';
        await db.query(updateRideSql, [rideId]);
        
        res.redirect(`/rides/${rideId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error accepting ride request");
    }
});

app.post("/rides/:rideId/requests/:requestId/reject", async function(req, res) {
    try {
        const rideId = parseInt(req.params.rideId, 10);
        const requestId = parseInt(req.params.requestId, 10);
        
        // Update the request status
        const updateSql = 'UPDATE Ride_Requests SET status = "rejected" WHERE id = ?';
        await db.query(updateSql, [requestId]);
        
        res.redirect(`/rides/${rideId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error rejecting ride request");
    }
});

// Error handler
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('error', {
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Export the app
<<<<<<< HEAD
module.exports = app;
=======
module.exports = app;
>>>>>>> origin/main
