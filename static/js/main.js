/**
 * main.js - Main entry point for the Roehampton Ride Sharing app
 * Initializes global functionality and loads required scripts
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    initializeBootstrapComponents();
    
    // Setup real-time notifications via Socket.io if available
    setupNotifications();
    
    // Initialize page-specific functionality
    initializePageFunctionality();
});

// Initialize Bootstrap components
function initializeBootstrapComponents() {
    // Initialize all tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize all popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Setup Socket.io notifications if available
function setupNotifications() {
    if (typeof io !== 'undefined') {
        // Connect to Socket.io server
        const socket = io();
        
        // Listen for notifications
        socket.on('notification', function(data) {
            showNotification(data.title, data.message, data.type);
        });
    }
}

// Display notification
function showNotification(title, message, type = 'info') {
    // Check if we have the notification container
    let container = document.getElementById('notification-container');
    
    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        <strong>${title}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 150);
    }, 5000);
}

// Initialize page-specific functionality
function initializePageFunctionality() {
    // Get current page from pathname
    const path = window.location.pathname;
    
    // Home page
    if (path === '/' || path === '/index') {
        // Initialize home page specific functionality
    }
    
    // Rides listing page
    else if (path.match(/^\/rides\/?$/)) {
        // Initialize rides listing functionality
    }
    
    // Ride detail page
    else if (path.match(/^\/rides\/\d+$/)) {
        // Initialize ride detail functionality
    }
    
    // Messages page
    else if (path.match(/^\/messages\/?/)) {
        initializeMessaging();
    }
}

// Global socket connection for messaging
let messagingSocket;

// Initialize messaging functionality
function initializeMessaging() {
    // Connect to Socket.io if available
    if (typeof io !== 'undefined') {
        messagingSocket = io();
        
        // Setup event listeners
        setupMessageListeners();
        
        // Join conversation rooms based on current page
        joinConversationRooms();
        
        // Mark messages as read
        markMessagesAsRead();
    }
}

// Set up message listeners
function setupMessageListeners() {
    // Listen for new messages
    messagingSocket.on('new_message', function(message) {
        addMessageToConversation(message);
        
        // Mark as read if conversation is open
        if (isConversationOpen(message.sender_id)) {
            markMessageAsRead(message.id);
        }
    });
    
    // Listen for message read status updates
    messagingSocket.on('message_read', function(data) {
        updateMessageReadStatus(data.message_id);
    });
    
    // Setup send message form
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', function(event) {
            event.preventDefault();
            sendMessage();
        });
    }
}

// Join conversation rooms based on current URL
function joinConversationRooms() {
    const path = window.location.pathname;
    const conversationMatch = path.match(/\/messages\/conversation\/(\d+)/);
    
    if (conversationMatch) {
        const otherUserId = conversationMatch[1];
        messagingSocket.emit('join_conversation', { userId: getCurrentUserId(), otherUserId });
    }
}

// Mark messages as read when conversation is opened
function markMessagesAsRead() {
    const path = window.location.pathname;
    const conversationMatch = path.match(/\/messages\/conversation\/(\d+)/);
    
    if (conversationMatch) {
        const otherUserId = conversationMatch[1];
        
        // Emit event to mark all messages from this user as read
        messagingSocket.emit('mark_messages_read', {
            userId: getCurrentUserId(),
            senderId: otherUserId
        });
        
        // Update UI to show messages as read
        const messages = document.querySelectorAll('.message-received');
        messages.forEach(message => {
            message.querySelector('.message-status').textContent = 'Read';
        });
    }
}

// Add a new message to the conversation
function addMessageToConversation(message) {
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;
    
    const isCurrentUser = message.sender_id === getCurrentUserId();
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'} mb-3`;
    messageElement.dataset.messageId = message.id;
    
    messageElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <strong class="${isCurrentUser ? 'text-primary' : 'text-success'}">${isCurrentUser ? 'You' : message.sender_name}</strong>
            <small class="text-muted">${formatDate(message.sent_at)}</small>
        </div>
        <p class="mb-0 mt-1">${message.message_text}</p>
        ${message.ride_id ? `<small class="text-muted">Related to ride #${message.ride_id}</small>` : ''}
        ${isCurrentUser ? `<small class="message-status text-muted">${message.read_status ? 'Read' : 'Sent'}</small>` : ''}
    `;
    
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send a new message
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const rideSelect = document.getElementById('ride-select');
    
    if (!messageInput || !messageInput.value.trim()) return;
    
    const path = window.location.pathname;
    const conversationMatch = path.match(/\/messages\/conversation\/(\d+)/);
    
    if (conversationMatch) {
        const receiverId = conversationMatch[1];
        const message = {
            sender_id: getCurrentUserId(),
            receiver_id: receiverId,
            message_text: messageInput.value.trim(),
            ride_id: rideSelect ? rideSelect.value : null,
            sent_at: new Date().toISOString()
        };
        
        // Emit message event to server
        messagingSocket.emit('send_message', message);
        
        // Add message to UI immediately
        addMessageToConversation({
            ...message,
            sender_name: 'You',
            read_status: false
        });
        
        // Clear input
        messageInput.value = '';
    }
}

// Check if conversation with user is currently open
function isConversationOpen(userId) {
    const path = window.location.pathname;
    const conversationMatch = path.match(/\/messages\/conversation\/(\d+)/);
    
    return conversationMatch && conversationMatch[1] === userId.toString();
}

// Mark message as read
function markMessageAsRead(messageId) {
    messagingSocket.emit('mark_message_read', { messageId });
}

// Update message read status in UI
function updateMessageReadStatus(messageId) {
    const message = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (message) {
        const statusElement = message.querySelector('.message-status');
        if (statusElement) {
            statusElement.textContent = 'Read';
        }
    }
}

// Get current user ID from meta tag or global variable
function getCurrentUserId() {
    const userIdMeta = document.querySelector('meta[name="user-id"]');
    if (userIdMeta) {
        return parseInt(userIdMeta.content, 10);
    }
    
    // Fallback to global variable if available
    return window.currentUserId || null;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// Format currency in GBP
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount);
}

// Calculate average rating
function calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating, 0);
    return (sum / ratings.length).toFixed(1);
}

// Generate HTML for star ratings
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let html = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (halfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star"></i>';
    }
    
    return html;
}

// Check if a date is in the past
function isPastDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
} 