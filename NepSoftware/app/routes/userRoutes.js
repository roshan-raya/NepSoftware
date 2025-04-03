const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../services/db');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../../static/images/profiles');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Public routes
router.get('/', UserController.getUsersList);
router.post('/signup', upload.single('photo'), UserController.signUp);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.get('/update-missing-photos', UserController.updateMissingPhotos);

// Diagnostic route
router.get('/check-profile-photos', async (req, res) => {
    try {
        const sql = 'SELECT id, name, email, profile_photo FROM Users';
        const users = await db.query(sql);
        res.json(users);
    } catch (error) {
        console.error('Error checking profile photos:', error);
        res.status(500).json({ error: 'Failed to check profile photos' });
    }
});

// Protected routes
router.use(isAuthenticated);

router.get('/:id', UserController.getUserProfile);
router.get('/:id/edit', UserController.editProfile);
router.post('/:id/update', upload.single('photo'), UserController.updateProfile);

module.exports = router; 