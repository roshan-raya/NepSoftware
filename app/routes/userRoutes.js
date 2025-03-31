const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Users list route
router.get("/", UserController.getUsersList);

// User profile route
router.get("/:id", UserController.getUserProfile);

module.exports = router; 