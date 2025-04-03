const db = require('../services/db');
const UserModel = require('../models/userModel');

class MessageController {
    // Get all conversations for current user
    static async getConversations(req, res) {
        try {
            const userId = req.user.id;
            
            // Find all unique conversations
            const sql = `
                SELECT DISTINCT 
                    CASE 
                        WHEN sender_id = ? THEN receiver_id 
                        ELSE sender_id 
                    END AS other_user_id,
                    MAX(sent_at) as last_message_time
                FROM Messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY other_user_id
                ORDER BY last_message_time DESC
            `;
            
            const conversations = await db.query(sql, [userId, userId, userId]);
            
            // Get user details and latest message for each conversation
            const conversationsWithDetails = await Promise.all(
                conversations.map(async (conv) => {
                    const otherUser = await UserModel.getUserById(conv.other_user_id);
                    
                    // Get the latest message in this conversation
                    const latestMessageSql = `
                        SELECT * FROM Messages
                        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                        ORDER BY sent_at DESC
                        LIMIT 1
                    `;
                    
                    const [latestMessage] = await db.query(
                        latestMessageSql, 
                        [userId, conv.other_user_id, conv.other_user_id, userId]
                    );
                    
                    // Get count of unread messages
                    const unreadSql = `
                        SELECT COUNT(*) as unread_count
                        FROM Messages
                        WHERE receiver_id = ? AND sender_id = ? AND read_status = FALSE
                    `;
                    
                    const [unreadResult] = await db.query(unreadSql, [userId, conv.other_user_id]);
                    
                    return {
                        otherUser,
                        latestMessage,
                        unreadCount: unreadResult.unread_count || 0
                    };
                })
            );
            
            res.render('messages/conversations', {
                title: 'My Conversations',
                conversations: conversationsWithDetails
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error loading conversations',
                error: { status: 500 }
            });
        }
    }
    
    // Get a single conversation
    static async getConversation(req, res) {
        try {
            const userId = req.user.id;
            const otherUserId = parseInt(req.params.userId, 10);
            
            // Check if other user exists
            const otherUser = await UserModel.getUserById(otherUserId);
            
            if (!otherUser) {
                return res.status(404).render('error', {
                    message: 'User not found',
                    error: { status: 404 }
                });
            }
            
            // Get all messages between these users
            const messagesSql = `
                SELECT m.*, 
                    s.name as sender_name, 
                    r.name as receiver_name
                FROM Messages m
                JOIN Users s ON m.sender_id = s.id
                JOIN Users r ON m.receiver_id = r.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.sent_at ASC
            `;
            
            const messages = await db.query(
                messagesSql, 
                [userId, otherUserId, otherUserId, userId]
            );
            
            // Mark all messages from other user as read
            const updateSql = `
                UPDATE Messages
                SET read_status = TRUE
                WHERE sender_id = ? AND receiver_id = ? AND read_status = FALSE
            `;
            
            await db.query(updateSql, [otherUserId, userId]);
            
            // Get shared rides (to reference in messages)
            const sharedRidesSql = `
                SELECT r.* FROM Rides r
                WHERE (r.driver_id = ? AND r.id IN (
                    SELECT ride_id FROM Ride_Requests WHERE passenger_id = ? AND status = 'accepted'
                ))
                OR (r.driver_id = ? AND r.id IN (
                    SELECT ride_id FROM Ride_Requests WHERE passenger_id = ? AND status = 'accepted'
                ))
                ORDER BY r.departure_time DESC
            `;
            
            const sharedRides = await db.query(
                sharedRidesSql,
                [userId, otherUserId, otherUserId, userId]
            );
            
            res.render('messages/conversation', {
                title: `Conversation with ${otherUser.name}`,
                otherUser,
                messages,
                sharedRides
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error loading conversation',
                error: { status: 500 }
            });
        }
    }
    
    // Send a message
    static async sendMessage(req, res) {
        try {
            const senderId = req.user.id;
            const receiverId = parseInt(req.params.userId, 10);
            const { message, rideId } = req.body;
            
            // Check if receiver exists
            const receiver = await UserModel.getUserById(receiverId);
            
            if (!receiver) {
                return res.status(404).render('error', {
                    message: 'Recipient not found',
                    error: { status: 404 }
                });
            }
            
            // Validate message
            if (!message || message.trim() === '') {
                return res.redirect(`/messages/conversation/${receiverId}`);
            }
            
            // Insert the message
            const sql = `
                INSERT INTO Messages (sender_id, receiver_id, ride_id, message_text)
                VALUES (?, ?, ?, ?)
            `;
            
            await db.query(
                sql,
                [senderId, receiverId, rideId || null, message.trim()]
            );
            
            // Redirect back to conversation
            res.redirect(`/messages/conversation/${receiverId}`);
            
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error sending message',
                error: { status: 500 }
            });
        }
    }
    
    // Start new conversation
    static async newConversation(req, res) {
        try {
            const userId = req.user.id;
            
            // Get all users except current user
            const usersSql = 'SELECT * FROM Users WHERE id != ? ORDER BY name';
            const users = await db.query(usersSql, [userId]);
            
            res.render('messages/new_conversation', {
                title: 'New Conversation',
                users
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error loading new conversation form',
                error: { status: 500 }
            });
        }
    }
}

module.exports = MessageController; 