const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Users list route
router.get("/", UserController.getUsersList);

// User profile route
router.get("/:id", UserController.getUserProfile);

// Sign up route
router.post("/signup", UserController.signUp);

module.exports = router; 