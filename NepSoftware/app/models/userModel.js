const db = require('../services/db');
const crypto = require('crypto');

class UserModel {
    static async getAllUsers() {
        const sql = 'SELECT * FROM Users ORDER BY name';
        return await db.query(sql);
    }

    static async getUserById(id) {
        const sql = 'SELECT * FROM Users WHERE id = ?';
        const [user] = await db.query(sql, [id]);
        return user;
    }

    static async getUserRides(userId) {
        const sql = 'SELECT * FROM Rides WHERE driver_id = ? ORDER BY departure_time';
        return await db.query(sql, [userId]);
    }

    static async getUserRequests(userId) {
        const sql = 'SELECT * FROM Ride_Requests WHERE passenger_id = ? ORDER BY requested_at DESC';
        return await db.query(sql, [userId]);
    }

    static async createUser(name, email, password) {
        try {
            // Validate password
            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Check if email already exists
            const existingUser = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
            if (existingUser.length > 0) {
                throw new Error('Email already registered');
            }

            // Hash the password using SHA-256
            const hashedPassword = crypto
                .createHash('sha256')
                .update(password)
                .digest('hex');

            // Insert new user
            const sql = 'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)';
            const result = await db.query(sql, [name, email, hashedPassword]);
            
            if (!result.insertId) {
                throw new Error('Failed to create user');
            }

            return result.insertId;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    static async login(email, password) {
        try {
            // Hash the password for comparison
            const hashedPassword = crypto
                .createHash('sha256')
                .update(password)
                .digest('hex');

            // Find user with matching email and password
            const sql = 'SELECT id, name, email FROM Users WHERE email = ? AND password = ?';
            const [user] = await db.query(sql, [email, hashedPassword]);

            if (!user) {
                throw new Error('Invalid email or password');
            }

            return user;
        } catch (error) {
            console.error('Error in login:', error);
            throw error;
        }
    }
}

module.exports = UserModel; 