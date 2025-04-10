const UserModel = require('../models/userModel');
const ReviewModel = require('../models/reviewModel');
const UserActivityModel = require('../models/userActivityModel');
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
            
            // Get user ratings and reviews
            const driverReviews = await ReviewModel.getReviewsForUser(userId, 'driver');
            const passengerReviews = await ReviewModel.getReviewsForUser(userId, 'passenger');
            
            // Get user recent activity
            const recentActivity = await UserActivityModel.getUserActivities(userId, 5);
            
            res.render('users_profile', { 
                title: `${user.name}'s Profile`, 
                user, 
                rides, 
                requests,
                driverReviews,
                passengerReviews,
                recentActivity,
                isCurrentUser: req.session.userId === userId
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
            const { name, email, password, dob } = req.body;
            const photo = req.file ? req.file.filename : null;

            // Validate input
            if (!name || !email || !password || !dob) {
                return res.status(400).json({ 
                    success: false,
                    error: 'All fields are required' 
                });
            }
            
            // Validate age (must be 18+)
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            // Adjust age if birth month hasn't occurred yet this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 18) {
                return res.status(400).json({ 
                    success: false,
                    error: 'You must be at least 18 years old to use this service' 
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

            // Create user with photo and dob
            const userId = await UserModel.create({ 
                name, 
                email, 
                password: hashedPassword,
                photo,
                dob 
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
                },
                // Let client side know to check for redirects
                checkRedirect: true
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
                },
                // Let client side know to check for redirects
                checkRedirect: true
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
            let photoUpdated = false;

            // Handle profile photo upload if a file was provided
            if (req.file) {
                try {
                    // Delete old photo if it exists and is not the default
                    if (existingUser.profile_photo && !existingUser.profile_photo.includes('default.jpg')) {
                        const oldPhotoPath = path.join(__dirname, '../../static/images/profiles', existingUser.profile_photo);
                        if (fs.existsSync(oldPhotoPath)) {
                            fs.unlinkSync(oldPhotoPath);
                        }
                    }
                    profile_photo = req.file.filename;
                    photoUpdated = true;
                    
                    // Log the photo update activity
                    await UserActivityModel.logPhotoUpdate(userId, {
                        filename: profile_photo,
                        size: req.file.size,
                        originalName: req.file.originalname
                    });
                } catch (photoError) {
                    console.error('Error handling profile photo:', photoError);
                    // Continue with the rest of the update even if photo update fails
                }
            }

            // Update user
            const updatedUser = await UserModel.update(userId, { name, email, profile_photo });

            res.json({ 
                success: true, 
                message: 'Profile updated successfully',
                photo_updated: photoUpdated,
                photo_url: `/images/profiles/${profile_photo}`,
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

    static async getUserActivity(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            
            // Check if user exists
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).render('error', { 
                    message: 'User not found' 
                });
            }
            
            // Check if user is viewing their own activity or is an admin
            if (userId !== req.session.userId) {
                return res.status(403).render('error', { 
                    message: 'Unauthorized to view this activity' 
                });
            }
            
            const activities = await UserActivityModel.getUserActivities(userId, 20);
            const activityStats = await UserActivityModel.getActivityStats(userId);
            
            res.render('user_activity', {
                title: 'Your Activity',
                user,
                activities,
                activityStats
            });
        } catch (error) {
            console.error('Error in getUserActivity:', error);
            res.status(500).render('error', { 
                message: 'Error fetching user activity', 
                error 
            });
        }
    }
    
    static async verifyUserAccount(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            
            // Only admin can verify other users (for now)
            // In real application this would have more robust admin checking
            // Or verification would be done through email/SMS verification
            if (req.session.userId !== 1) { // Assuming admin is user ID 1
                return res.status(403).json({ 
                    success: false, 
                    error: 'Unauthorized to verify accounts' 
                });
            }
            
            await UserModel.verifyUser(userId);
            
            res.json({
                success: true,
                message: 'User verified successfully'
            });
        } catch (error) {
            console.error('Error in verifyUserAccount:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify user'
            });
        }
    }
    
    static async getRatingsAndReviews(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const reviewType = req.query.type || 'all'; // 'driver', 'passenger', or 'all'
            
            // Check if user exists
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).render('error', { 
                    message: 'User not found' 
                });
            }
            
            let reviews = [];
            if (reviewType === 'all') {
                const driverReviews = await ReviewModel.getReviewsForUser(userId, 'driver');
                const passengerReviews = await ReviewModel.getReviewsForUser(userId, 'passenger');
                reviews = [...driverReviews, ...passengerReviews];
            } else {
                reviews = await ReviewModel.getReviewsForUser(userId, reviewType);
            }
            
            res.render('user_reviews_page', {
                title: `${user.name}'s Reviews`,
                user,
                reviews,
                reviewType,
                isCurrentUser: req.session.userId === userId
            });
        } catch (error) {
            console.error('Error in getRatingsAndReviews:', error);
            res.status(500).render('error', { 
                message: 'Error fetching user reviews', 
                error 
            });
        }
    }
}

module.exports = UserController; 