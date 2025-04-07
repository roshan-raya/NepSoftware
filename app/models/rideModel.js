const db = require('../services/db');

class RideModel {
    static async getAllRides(search = '', tag = '') {
        let sql = `
            SELECT r.id, r.driver_id, r.departure_time, r.pickup_location, 
                   r.seats_available, r.tags, r.created_at,
                   u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            ORDER BY r.departure_time
        `;
        
        if (search || tag) {
            let conditions = [];
            if (search) {
                conditions.push(`(r.pickup_location LIKE ? OR r.tags LIKE ?)`);
            }
            if (tag) {
                conditions.push(`r.tags LIKE ?`);
            }
            sql = sql.replace('ORDER BY', `WHERE ${conditions.join(' AND ')} ORDER BY`);
        }
        
        const params = [];
        if (search) {
            params.push(`%${search}%`, `%${search}%`);
        }
        if (tag) {
            params.push(`%${tag}%`);
        }
        
        return await db.query(sql, params);
    }

    static async getRideById(id) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.id = ?
        `;
        const [ride] = await db.query(sql, [id]);
        return ride;
    }

    static async getRideRequests(rideId) {
        const sql = `
            SELECT rr.*, u.name AS passenger_name, u.profile_photo
            FROM Ride_Requests rr
            JOIN Users u ON rr.passenger_id = u.id
            WHERE rr.ride_id = ?
            ORDER BY rr.requested_at
        `;
        return await db.query(sql, [rideId]);
    }

    static async checkRideAvailability(rideId) {
        const sql = 'SELECT * FROM Rides WHERE id = ? AND seats_available > 0';
        const [ride] = await db.query(sql, [rideId]);
        return ride;
    }

    static async checkExistingRequest(rideId, passengerId) {
        const sql = 'SELECT * FROM Ride_Requests WHERE ride_id = ? AND passenger_id = ?';
        const requests = await db.query(sql, [rideId, passengerId]);
        return requests.length > 0;
    }

    static async createRideRequest(rideId, passengerId, message = '') {
        const sql = 'INSERT INTO Ride_Requests (ride_id, passenger_id, status, message) VALUES (?, ?, "pending", ?)';
        return await db.query(sql, [rideId, passengerId, message]);
    }

    static async updateRequestStatus(requestId, status) {
        const sql = 'UPDATE Ride_Requests SET status = ? WHERE id = ?';
        return await db.query(sql, [status, requestId]);
    }

    static async updateRideSeats(rideId) {
        const sql = 'UPDATE Rides SET seats_available = seats_available - 1 WHERE id = ? AND seats_available > 0';
        return await db.query(sql, [rideId]);
    }

    static async getTags() {
        const sql = `
            SELECT DISTINCT TRIM(tags) AS name, 
                   COUNT(*) AS ride_count
            FROM Rides
            WHERE tags IS NOT NULL AND tags != ''
            GROUP BY TRIM(tags)
            ORDER BY name;
        `;
        return await db.query(sql);
    }

    static async getRidesByTag(tag) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.tags = ? OR r.tags LIKE ? OR r.tags LIKE ? OR r.tags LIKE ?
            ORDER BY r.departure_time;
        `;
        return await db.query(sql, [tag, `${tag},%`, `%,${tag},%`, `%,${tag}`]);
    }

    static async getRidesByDriver(driverId) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.driver_id = ?
            ORDER BY r.departure_time DESC
        `;
        return await db.query(sql, [driverId]);
    }

    static async getRidesByPassenger(passengerId) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            JOIN Ride_Requests rr ON r.id = rr.ride_id
            WHERE rr.passenger_id = ? AND rr.status = 'accepted'
            ORDER BY r.departure_time DESC
        `;
        return await db.query(sql, [passengerId]);
    }

    static async deleteRide(rideId) {
        // First delete all ride requests for this ride
        const deleteRequestsSql = 'DELETE FROM Ride_Requests WHERE ride_id = ?';
        await db.query(deleteRequestsSql, [rideId]);
        
        // Then delete the ride
        const deleteRideSql = 'DELETE FROM Rides WHERE id = ?';
        return await db.query(deleteRideSql, [rideId]);
    }

    static async createRide({ driverId, departureDatetime, pickupLocation, dropoffLocation, seatsAvailable, tags }) {
        const sql = `
            INSERT INTO Rides (driver_id, departure_time, pickup_location, dropoff_location, seats_available, tags, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const result = await db.query(sql, [driverId, departureDatetime, pickupLocation, dropoffLocation, seatsAvailable, tags]);
        return result.insertId;
    }
}

module.exports = RideModel; 