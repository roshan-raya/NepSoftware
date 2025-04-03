const db = require('../services/db');
const crypto = require('crypto');

class UserModel {
    static async getAllUsers() {
        const sql = 'SELECT id, name, email, COALESCE(profile_photo, NULL) as profile_photo, created_at FROM Users ORDER BY name';
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
            const sql = 'SELECT id, name, email, profile_photo FROM Users WHERE email = ? AND password = ?';
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

    static async findById(id) {
        try {
            const sql = 'SELECT * FROM Users WHERE id = ?';
            const results = await db.query(sql, [id]);
            return results[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM Users WHERE email = ?';
        const [user] = await db.query(sql, [email]);
        return user;
    }

    static async create({ name, email, password, photo }) {
        try {
            // Validate password
            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Check if email already exists
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw new Error('Email already registered');
            }

            // Insert new user with photo path
            const sql = 'INSERT INTO Users (name, email, password, profile_photo) VALUES (?, ?, ?, ?)';
            const result = await db.query(sql, [name, email, password, photo]);
            
            if (!result.insertId) {
                throw new Error('Failed to create user');
            }

            return result.insertId;
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    static async update(id, userData) {
        try {
            const { name, email, profile_photo } = userData;
            const sql = 'UPDATE Users SET name = ?, email = ?, profile_photo = ? WHERE id = ?';
            await db.query(sql, [name, email, profile_photo, id]);
            
            // Return the updated user
            return this.findById(id);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const sql = 'DELETE FROM Users WHERE id = ?';
            await db.query(sql, [id]);
            return true;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    static async updateAllMissingPhotos() {
        try {
            // First, update missing photos to default.jpg
            const sql1 = 'UPDATE Users SET profile_photo = "default.jpg" WHERE profile_photo IS NULL OR profile_photo = "" OR profile_photo = "null" OR profile_photo = "defualt.jpg"';
            await db.query(sql1);

            // Then, fix paths that include 'static/images/profiles/'
            const sql2 = 'UPDATE Users SET profile_photo = REPLACE(profile_photo, "static/images/profiles/", "") WHERE profile_photo LIKE "static/images/profiles/%"';
            await db.query(sql2);

            // Get the final count of affected rows
            const [result] = await db.query('SELECT COUNT(*) as count FROM Users WHERE profile_photo IS NOT NULL');
            return result.count;
        } catch (error) {
            console.error('Error in updateAllMissingPhotos:', error);
            throw error;
        }
    }
}

module.exports = UserModel; 