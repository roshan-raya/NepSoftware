const db = require('../services/db');

class UserActivityModel {
    static async logActivity(userId, activityType, activityData) {
        try {
            const sql = `
                INSERT INTO UserActivity (user_id, activity_type, activity_data)
                VALUES (?, ?, ?)
            `;
            
            // Convert activityData to JSON string if it's an object
            const dataParam = typeof activityData === 'object' 
                ? JSON.stringify(activityData) 
                : activityData;
            
            const result = await db.query(sql, [userId, activityType, dataParam]);
            return result.insertId;
        } catch (error) {
            console.error('Error in logActivity:', error);
            throw error;
        }
    }
    
    static async getUserActivities(userId, limit = 20) {
        try {
            const sql = `
                SELECT * FROM UserActivity
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [userId, limit]);
        } catch (error) {
            console.error('Error in getUserActivities:', error);
            throw error;
        }
    }
    
    static async getUserActivitiesByType(userId, activityType, limit = 20) {
        try {
            const sql = `
                SELECT * FROM UserActivity
                WHERE user_id = ? AND activity_type = ?
                ORDER BY created_at DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [userId, activityType, limit]);
        } catch (error) {
            console.error('Error in getUserActivitiesByType:', error);
            throw error;
        }
    }
    
    static async getLatestActivity(userId) {
        try {
            const sql = `
                SELECT * FROM UserActivity
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            `;
            
            const activities = await db.query(sql, [userId]);
            return activities.length > 0 ? activities[0] : null;
        } catch (error) {
            console.error('Error in getLatestActivity:', error);
            throw error;
        }
    }
    
    static async getActivityStats(userId) {
        try {
            const sql = `
                SELECT 
                    activity_type, 
                    COUNT(*) as count,
                    MAX(created_at) as latest
                FROM UserActivity
                WHERE user_id = ?
                GROUP BY activity_type
            `;
            
            return await db.query(sql, [userId]);
        } catch (error) {
            console.error('Error in getActivityStats:', error);
            throw error;
        }
    }
    
    // Format activity for display
    static formatActivity(activity) {
        let activityText = '';
        const activityData = typeof activity.activity_data === 'string' 
            ? JSON.parse(activity.activity_data) 
            : activity.activity_data;
            
        switch (activity.activity_type) {
            case 'ride_offered':
                activityText = `Offered a ride to ${activityData?.destination || 'a destination'}`;
                break;
            case 'ride_joined':
                activityText = `Joined a ride to ${activityData?.destination || 'a destination'}`;
                break;
            case 'ride_completed':
                activityText = `Completed a ride to ${activityData?.destination || 'a destination'}`;
                break;
            case 'profile_updated':
                activityText = `Updated profile ${activityData?.detail ? ': ' + activityData.detail : ''}`;
                break;
            case 'review_posted':
                activityText = `Posted a ${activityData?.review_type || ''} review`;
                break;
            default:
                activityText = `Performed activity: ${activity.activity_type}`;
        }
        
        return {
            ...activity,
            activityText,
            formattedDate: new Date(activity.created_at).toLocaleString()
        };
    }
}

module.exports = UserActivityModel; 