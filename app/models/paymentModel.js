const db = require('../config/database');

class PaymentModel {
    // Create a new payment record
    static async createPayment({ rideId, requestId, passengerId, amount, method, status = 'pending' }) {
        try {
            const sql = `
                INSERT INTO Payments (
                    ride_id,
                    request_id,
                    passenger_id,
                    amount,
                    payment_method,
                    status,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;
            
            const result = await db.query(sql, [
                rideId,
                requestId,
                passengerId,
                amount,
                method,
                status
            ]);
            
            return result.insertId;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }
    
    // Get a payment record by ID
    static async getPaymentById(paymentId) {
        try {
            const sql = `
                SELECT p.*, 
                       u.name as passenger_name,
                       r.driver_id,
                       dr.name as driver_name,
                       rr.status as request_status
                FROM Payments p
                JOIN Users u ON p.passenger_id = u.id
                JOIN Rides r ON p.ride_id = r.id
                JOIN Users dr ON r.driver_id = dr.id
                JOIN Ride_Requests rr ON p.request_id = rr.id
                WHERE p.id = ?
            `;
            
            const [payment] = await db.query(sql, [paymentId]);
            return payment;
        } catch (error) {
            console.error('Error getting payment by ID:', error);
            throw error;
        }
    }
    
    // Get payments by user ID (either as passenger or driver)
    static async getPaymentsByUser(userId) {
        try {
            const sql = `
                SELECT p.*, 
                       r.departure_time,
                       r.pickup_location,
                       r.destination,
                       u.name as passenger_name,
                       dr.name as driver_name,
                       r.driver_id,
                       'passenger' as role
                FROM Payments p
                JOIN Rides r ON p.ride_id = r.id
                JOIN Users u ON p.passenger_id = u.id
                JOIN Users dr ON r.driver_id = dr.id
                WHERE p.passenger_id = ?
                
                UNION
                
                SELECT p.*, 
                       r.departure_time,
                       r.pickup_location,
                       r.destination,
                       u.name as passenger_name,
                       dr.name as driver_name,
                       r.driver_id,
                       'driver' as role
                FROM Payments p
                JOIN Rides r ON p.ride_id = r.id
                JOIN Users u ON p.passenger_id = u.id
                JOIN Users dr ON r.driver_id = dr.id
                WHERE r.driver_id = ?
                
                ORDER BY created_at DESC
            `;
            
            return await db.query(sql, [userId, userId]);
        } catch (error) {
            console.error('Error getting payments by user:', error);
            throw error;
        }
    }
    
    // Update payment status
    static async updatePaymentStatus(paymentId, status) {
        try {
            const sql = `
                UPDATE Payments
                SET status = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;
            
            return await db.query(sql, [status, paymentId]);
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }
    
    // Get payments by ride ID
    static async getPaymentsByRide(rideId) {
        try {
            const sql = `
                SELECT p.*, 
                       u.name as passenger_name,
                       r.driver_id,
                       dr.name as driver_name,
                       rr.status as request_status
                FROM Payments p
                JOIN Users u ON p.passenger_id = u.id
                JOIN Rides r ON p.ride_id = r.id
                JOIN Users dr ON r.driver_id = dr.id
                JOIN Ride_Requests rr ON p.request_id = rr.id
                WHERE p.ride_id = ?
                ORDER BY p.created_at DESC
            `;
            
            return await db.query(sql, [rideId]);
        } catch (error) {
            console.error('Error getting payments by ride:', error);
            throw error;
        }
    }
    
    // Get payment statistics for a driver
    static async getDriverPaymentStats(driverId) {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(amount) as total_earnings,
                    AVG(amount) as average_fare,
                    MAX(amount) as highest_fare,
                    MIN(amount) as lowest_fare
                FROM Payments p
                JOIN Rides r ON p.ride_id = r.id
                WHERE r.driver_id = ? AND p.status = 'completed'
            `;
            
            const [stats] = await db.query(sql, [driverId]);
            return stats;
        } catch (error) {
            console.error('Error getting driver payment stats:', error);
            throw error;
        }
    }
}

module.exports = PaymentModel; 