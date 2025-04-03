const db = require('./db');

class MatchingService {
    /**
     * Find rides that match a user's preferences
     * @param {Object} params - Query parameters
     * @param {number} userId - The user's ID
     * @returns {Promise<Array>} Matching rides
     */
    static async findMatchingRides(params, userId) {
        try {
            // Get user preferences
            const userPrefs = await this.getUserPreferences(userId);
            
            // Base query with JOIN to driver user
            let sql = `
                SELECT r.*,
                    u.name as driver_name,
                    u.profile_photo as driver_photo,
                    u.user_type as driver_type,
                    u.is_smoker as driver_is_smoker,
                    (SELECT COUNT(*) FROM Ride_Requests WHERE ride_id = r.id AND status = 'accepted') as confirmed_passengers,
                    (SELECT AVG(rating) FROM Ratings WHERE rated_id = r.driver_id) as driver_rating
                FROM Rides r
                JOIN Users u ON r.driver_id = u.id
                WHERE r.departure_time > NOW()
                AND r.seats_available > (SELECT COUNT(*) FROM Ride_Requests WHERE ride_id = r.id AND status = 'accepted')
                AND r.driver_id != ?
            `;
            
            const queryParams = [userId];
            
            // Apply user preferences if strict matching is requested
            if (params.strictMatch === 'true' && userPrefs) {
                // Apply non-smoking preference
                if (userPrefs.non_smoking_preference) {
                    sql += ' AND r.smoking_allowed = FALSE';
                }
                
                // Apply student-only preference
                if (userPrefs.student_only_preference) {
                    sql += ' AND u.user_type = "student"';
                }
            }
            
            // Filter by location if provided
            if (params.pickup) {
                sql += ' AND r.pickup_location LIKE ?';
                queryParams.push(`%${params.pickup}%`);
            }
            
            // Filter by date if provided
            if (params.date) {
                sql += ' AND DATE(r.departure_time) = ?';
                queryParams.push(params.date);
            }
            
            // Filter by time range if provided
            if (params.timeStart && params.timeEnd) {
                sql += ' AND TIME(r.departure_time) BETWEEN ? AND ?';
                queryParams.push(params.timeStart, params.timeEnd);
            }
            
            // Filter by smoking preference if explicitly requested
            if (params.smoking === 'allowed') {
                sql += ' AND r.smoking_allowed = TRUE';
            } else if (params.smoking === 'not_allowed') {
                sql += ' AND r.smoking_allowed = FALSE';
            }
            
            // Filter by driver type if requested
            if (params.driverType === 'student') {
                sql += ' AND u.user_type = "student"';
            } else if (params.driverType === 'staff') {
                sql += ' AND u.user_type = "staff"';
            }
            
            // Order by best match (departure time closest to requested time)
            sql += ' ORDER BY r.departure_time ASC';
            
            // Execute query
            const rides = await db.query(sql, queryParams);
            
            // Calculate match score for each ride
            return rides.map(ride => {
                let matchScore = 100; // Start with perfect score
                
                // Reduce score for factors that don't match preferences
                if (userPrefs) {
                    // Smoking preference mismatch
                    if (userPrefs.non_smoking_preference && ride.smoking_allowed) {
                        matchScore -= 30;
                    }
                    
                    // Student-only preference mismatch
                    if (userPrefs.student_only_preference && ride.driver_type !== 'student') {
                        matchScore -= 20;
                    }
                }
                
                // Add match score to ride object
                return {
                    ...ride,
                    matchScore: Math.max(0, matchScore)
                };
            }).sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
            
        } catch (error) {
            console.error('Error in findMatchingRides:', error);
            throw error;
        }
    }
    
    /**
     * Get user preferences
     * @param {number} userId - The user's ID
     * @returns {Promise<Object>} User preferences
     */
    static async getUserPreferences(userId) {
        try {
            const sql = `
                SELECT up.*, u.is_smoker, u.user_type
                FROM User_Preferences up
                JOIN Users u ON up.user_id = u.id
                WHERE up.user_id = ?
            `;
            
            const [preferences] = await db.query(sql, [userId]);
            return preferences;
            
        } catch (error) {
            console.error('Error in getUserPreferences:', error);
            return null;
        }
    }
    
    /**
     * Find rides for the home page with simplified filtering
     * @returns {Promise<Array>} Upcoming rides
     */
    static async getUpcomingRides() {
        try {
            const sql = `
                SELECT r.*,
                    u.name as driver_name,
                    u.profile_photo as driver_photo,
                    u.user_type as driver_type,
                    (SELECT COUNT(*) FROM Ride_Requests WHERE ride_id = r.id AND status = 'accepted') as confirmed_passengers,
                    (SELECT AVG(rating) FROM Ratings WHERE rated_id = r.driver_id) as driver_rating
                FROM Rides r
                JOIN Users u ON r.driver_id = u.id
                WHERE r.departure_time > NOW()
                AND r.seats_available > (SELECT COUNT(*) FROM Ride_Requests WHERE ride_id = r.id AND status = 'accepted')
                ORDER BY r.departure_time ASC
                LIMIT 10
            `;
            
            return await db.query(sql);
            
        } catch (error) {
            console.error('Error in getUpcomingRides:', error);
            throw error;
        }
    }
}

module.exports = MatchingService; 