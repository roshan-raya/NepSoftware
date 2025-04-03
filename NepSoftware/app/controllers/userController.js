const UserModel = require('../models/userModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'static/images/profiles';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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

class UserController {
    static async getUsersList(req, res) {
        try {
            const users = await UserModel.getAllUsers();
            res.render('users_list', { 
                title: 'Users List', 
                users,
                userId: req.session.userId,
                userName: req.session.userName
            });
        } catch (error) {
            console.error('Error in getUsersList:', error);
            res.status(500).render('error', { 
                title: 'Error',
                message: 'Error fetching users list'
            });
        }
    }

    static async getUserProfile(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const user = await UserModel.findById(userId);
            
            if (!user) {
                return res.status(404).render('users_profile', { 
                    title: 'User Not Found', 
                    user: null 
                });
            }
            
            const rides = await UserModel.getUserRides(userId);
            const requests = await UserModel.getUserRequests(userId);
            
            res.render('users_profile', { 
                title: `${user.name}'s Profile`, 
                user, 
                rides, 
                requests 
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching user profile");
        }
    }

    static async editProfile(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            
            // Check if user is editing their own profile
            if (userId !== req.session.userId) {
                return res.status(403).send("You can only edit your own profile");
            }
            
            const user = await UserModel.findById(userId);
            
            if (!user) {
                return res.status(404).render('users_profile', { 
                    title: 'User Not Found', 
                    user: null 
                });
            }
            
            res.render('edit_profile', { 
                title: `Edit ${user.name}'s Profile`, 
                user 
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error loading edit profile page");
        }
    }

    static async signUp(req, res) {
        try {
            const { name, email, password } = req.body;
            const photo = req.file ? req.file.filename : null;

            // Validate input
            if (!name || !email || !password) {
                return res.status(400).json({ 
                    success: false,
                    error: 'All fields are required' 
                });
            }

            // Validate email format
            if (!email.endsWith('@roehampton.ac.uk')) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Email must be a valid Roehampton University email' 
                });
            }

            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Password must be at least 6 characters long' 
                });
            }

            // Hash the password
            const hashedPassword = crypto
                .createHash('sha256')
                .update(password)
                .digest('hex');

            // Create user with photo
            const userId = await UserModel.create({ 
                name, 
                email, 
                password: hashedPassword,
                photo 
            });
            
            // Set user session
            req.session.userId = userId;
            req.session.userName = name;

            res.json({ 
                success: true, 
                message: 'Registration successful',
                user: {
                    id: userId,
                    name: name,
                    email: email,
                    photo: photo
                }
            });
        } catch (error) {
            console.error('Signup error:', error);
            
            // Handle specific error cases
            if (error.message === 'Email already registered') {
                return res.status(400).json({ 
                    success: false,
                    error: 'This email is already registered' 
                });
            }
            
            if (error.message === 'Password must be at least 6 characters long') {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }

            // Generic error response
            res.status(500).json({ 
                success: false,
                error: 'An error occurred during registration. Please try again.' 
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Email and password are required' 
                });
            }

            // Attempt to login
            const user = await UserModel.login(email, password);
            
            // Set user session
            req.session.userId = user.id;
            req.session.userName = user.name;

            res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    photo: user.profile_photo
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            
            res.status(401).json({ 
                success: false,
                error: 'Invalid email or password' 
            });
        }
    }
    
    static async logout(req, res) {
        try {
            // Destroy the session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Logout error:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'An error occurred during logout'
                    });
                }
                
                // Clear the session cookie
                res.clearCookie('connect.sid');
                
                res.json({
                    success: true,
                    message: 'Logout successful'
                });
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred during logout'
            });
        }
    }

    static async updateProfile(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            
            // Check if user is editing their own profile
            if (req.session.userId !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Unauthorized to edit this profile' 
                });
            }

            // Get existing user
            const existingUser = await UserModel.findById(userId);
            if (!existingUser) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }

            const { name, email } = req.body;
            let profile_photo = existingUser.profile_photo;

            // Handle profile photo upload if a file was provided
            if (req.file) {
                // Delete old photo if it exists and is not the default
                if (existingUser.profile_photo && !existingUser.profile_photo.includes('default.jpg')) {
                    const oldPhotoPath = path.join(__dirname, '..', 'static', 'images', 'profiles', existingUser.profile_photo);
                    if (fs.existsSync(oldPhotoPath)) {
                        fs.unlinkSync(oldPhotoPath);
                    }
                }
                profile_photo = req.file.filename;
            }

            // Update user
            const updatedUser = await UserModel.update(userId, { name, email, profile_photo });

            res.json({ 
                success: true, 
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    profile_photo: updatedUser.profile_photo
                }
            });
        } catch (error) {
            console.error('Error in updateProfile:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Server error during profile update' 
            });
        }
    }

    static async updateMissingPhotos(req, res) {
        try {
            const updatedCount = await UserModel.updateAllMissingPhotos();
            res.json({
                success: true,
                message: `Updated ${updatedCount} users with default profile photo`,
                updatedCount
            });
        } catch (error) {
            console.error('Error in updateMissingPhotos:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile photos'
            });
        }
    }
}

module.exports = UserController; 