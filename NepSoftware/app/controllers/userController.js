const UserModel = require('../models/userModel');

class UserController {
    static async getUsersList(req, res) {
        try {
            const users = await UserModel.getAllUsers();
            res.render('users_list', { title: 'Users List', users });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching users");
        }
    }

    static async getUserProfile(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const user = await UserModel.getUserById(userId);
            
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

    static async signUp(req, res) {
        try {
            const { name, email, password } = req.body;

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

            // Create user
            const userId = await UserModel.createUser(name, email, password);
            
            // Set user session
            req.session.userId = userId;
            req.session.userName = name;

            res.json({ 
                success: true, 
                message: 'Registration successful',
                user: {
                    id: userId,
                    name: name,
                    email: email
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
                    email: user.email
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
}

module.exports = UserController; 