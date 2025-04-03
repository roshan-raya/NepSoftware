const db = require('../services/db');

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
}

module.exports = UserModel; 