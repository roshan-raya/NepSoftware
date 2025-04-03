const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All message routes require authentication
router.use(auth.verifyToken);

// Get all conversations
router.get('/', MessageController.getConversations);

// Start a new conversation
router.get('/new', MessageController.newConversation);

// View a specific conversation
router.get('/conversation/:userId', MessageController.getConversation);

// Send a message
router.post('/send/:userId', MessageController.sendMessage);

module.exports = router; 