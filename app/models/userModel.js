const db = require('../services/db');
const crypto = require('crypto');
const UserActivityModel = require('./userActivityModel');

class UserModel {
    static async getAllUsers() {
        const sql = 'SELECT id, name, email, COALESCE(profile_photo, NULL) as profile_photo, created_at, is_verified, driver_rating, passenger_rating FROM Users ORDER BY name';
        return await db.query(sql);
    }

    static async getUserById(id) {
        const sql = 'SELECT * FROM Users WHERE id = ?';
        const [user] = await db.query(sql, [id]);
        
        // Update last active timestamp
        if (user) {
            await db.query('UPDATE Users SET last_active = NOW() WHERE id = ?', [id]);
        }
        
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

    static async getUserActivity(userId, limit = 10) {
        return await UserActivityModel.getUserActivities(userId, limit);
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
            
            // Log the activity
            await UserActivityModel.logActivity(
                result.insertId, 
                'profile_updated', 
                { detail: 'Account created' }
            );

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
            const sql = 'SELECT id, name, email, profile_photo, is_verified FROM Users WHERE email = ? AND password = ?';
            const [user] = await db.query(sql, [email, hashedPassword]);

            if (!user) {
                throw new Error('Invalid email or password');
            }
            
            // Update last active timestamp
            await db.query('UPDATE Users SET last_active = NOW() WHERE id = ?', [user.id]);

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

    static async create({ name, email, password, photo, dob }) {
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

            // Insert new user with photo path and dob
            const sql = 'INSERT INTO Users (name, email, password, profile_photo, date_of_birth) VALUES (?, ?, ?, ?, ?)';
            const result = await db.query(sql, [name, email, password, photo, dob]);
            
            if (!result.insertId) {
                throw new Error('Failed to create user');
            }
            
            // Log the activity
            await UserActivityModel.logActivity(
                result.insertId, 
                'profile_updated', 
                { detail: 'Account created' }
            );

            return result.insertId;
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    static async update(id, userData) {
        try {
            // Prepare columns and values to update
            const columns = [];
            const values = [];
            const validFields = [
                'name', 'email', 'profile_photo', 'bio', 'phone',
                'preferred_pickup', 'preferred_payment'
            ];
            
            // Add only provided fields to the update query
            for (const field of validFields) {
                if (userData[field] !== undefined) {
                    columns.push(`${field} = ?`);
                    values.push(userData[field]);
                }
            }
            
            // If no valid fields provided, throw error
            if (columns.length === 0) {
                throw new Error('No valid fields provided for update');
            }
            
            // Add id to values array
            values.push(id);
            
            // Build and execute SQL query
            const sql = `UPDATE Users SET ${columns.join(', ')} WHERE id = ?`;
            await db.query(sql, values);
            
            // Log the activity
            await UserActivityModel.logActivity(
                id, 
                'profile_updated', 
                { fields: Object.keys(userData).filter(key => validFields.includes(key)) }
            );
            
            // Return the updated user
            return this.findById(id);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    static async updatePassword(id, currentPassword, newPassword) {
        try {
            // Hash the passwords
            const hashedCurrentPassword = crypto
                .createHash('sha256')
                .update(currentPassword)
                .digest('hex');
                
            const hashedNewPassword = crypto
                .createHash('sha256')
                .update(newPassword)
                .digest('hex');
            
            // Verify current password
            const [user] = await db.query(
                'SELECT id FROM Users WHERE id = ? AND password = ?', 
                [id, hashedCurrentPassword]
            );
            
            if (!user) {
                throw new Error('Current password is incorrect');
            }
            
            // Update password
            await db.query('UPDATE Users SET password = ? WHERE id = ?', [hashedNewPassword, id]);
            
            // Log the activity
            await UserActivityModel.logActivity(id, 'profile_updated', { detail: 'Password changed' });
            
            return true;
        } catch (error) {
            console.error('Error in updatePassword:', error);
            throw error;
        }
    }

    static async verifyUser(id) {
        try {
            const sql = 'UPDATE Users SET is_verified = TRUE, verification_date = NOW() WHERE id = ?';
            await db.query(sql, [id]);
            
            // Log the activity
            await UserActivityModel.logActivity(id, 'profile_updated', { detail: 'Account verified' });
            
            return true;
        } catch (error) {
            console.error('Error in verifyUser:', error);
            throw error;
        }
    }

    static async unverifyUser(id) {
        try {
            const sql = 'UPDATE Users SET is_verified = FALSE, verification_date = NULL WHERE id = ?';
            await db.query(sql, [id]);
            
            // Log the activity
            await UserActivityModel.logActivity(id, 'profile_updated', { detail: 'Account verification removed' });
            
            return true;
        } catch (error) {
            console.error('Error in unverifyUser:', error);
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
    
    static async getActiveUsers(days = 7, limit = 10) {
        try {
            const sql = `
                SELECT id, name, email, profile_photo, last_active, 
                       driver_rating, passenger_rating, is_verified
                FROM Users 
                WHERE last_active > DATE_SUB(NOW(), INTERVAL ? DAY)
                ORDER BY last_active DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [days, limit]);
        } catch (error) {
            console.error('Error in getActiveUsers:', error);
            throw error;
        }
    }
    
    static async getTopRatedDrivers(limit = 5) {
        try {
            const sql = `
                SELECT id, name, email, profile_photo, 
                       driver_rating, passenger_rating, is_verified
                FROM Users 
                WHERE driver_rating > 0
                ORDER BY driver_rating DESC, last_active DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [limit]);
        } catch (error) {
            console.error('Error in getTopRatedDrivers:', error);
            throw error;
        }
    }
    
    static async getTopRatedPassengers(limit = 5) {
        try {
            const sql = `
                SELECT id, name, email, profile_photo, 
                       driver_rating, passenger_rating, is_verified
                FROM Users 
                WHERE passenger_rating > 0
                ORDER BY passenger_rating DESC, last_active DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [limit]);
        } catch (error) {
            console.error('Error in getTopRatedPassengers:', error);
            throw error;
        }
    }
}

module.exports = UserModel; 