const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Login routes
router.get('/login', AuthController.getLogin);
router.post('/login', AuthController.postLogin);

// Signup routes
router.get('/signup', AuthController.getSignup);
router.post('/signup', AuthController.postSignup);

// Logout route
router.get('/logout', AuthController.logout);

// Dashboard route (protected)
router.get('/dashboard', auth.verifyToken, AuthController.getDashboard);

module.exports = router; 