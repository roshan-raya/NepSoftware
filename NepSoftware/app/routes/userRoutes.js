const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Users list route
router.get("/", UserController.getUsersList);

// User profile route
router.get("/:id", UserController.getUserProfile);

// Sign up route
router.post("/signup", UserController.signUp);

// Login route
router.post("/login", UserController.login);

// Logout route
router.post("/logout", UserController.logout);

module.exports = router; 