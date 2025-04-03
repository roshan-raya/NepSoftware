const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/db');
const UserModel = require('../models/userModel');

class AuthController {
    // Render login page
    static getLogin(req, res) {
        res.render('auth/login', {
            title: 'Login',
            error: null
        });
    }
    
    // Handle login form submission
    static async postLogin(req, res) {
        try {
            const { email, password } = req.body;
            
            // Validate email format
            if (!email.endsWith('@roehampton.ac.uk')) {
                return res.render('auth/login', {
                    title: 'Login',
                    error: 'Please use your Roehampton University email'
                });
            }
            
            // Find user by email
            const sql = 'SELECT * FROM Users WHERE email = ?';
            const [user] = await db.query(sql, [email]);
            
            if (!user) {
                return res.render('auth/login', {
                    title: 'Login',
                    error: 'Invalid email or password'
                });
            }
            
            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.render('auth/login', {
                    title: 'Login',
                    error: 'Invalid email or password'
                });
            }
            
            // Create JWT token
            const token = jwt.sign(
                { id: user.id, name: user.name, email: user.email, user_type: user.user_type },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            // Set token as cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });
            
            // Redirect to dashboard
            res.redirect('/dashboard');
            
        } catch (error) {
            console.error(error);
            res.render('auth/login', {
                title: 'Login',
                error: 'Server error, please try again'
            });
        }
    }
    
    // Render signup page
    static getSignup(req, res) {
        res.render('auth/signup', {
            title: 'Sign Up',
            error: null
        });
    }
    
    // Handle signup form submission
    static async postSignup(req, res) {
        try {
            const { name, email, password, confirmPassword } = req.body;
            
            // Validate email format
            if (!email.endsWith('@roehampton.ac.uk')) {
                return res.render('auth/signup', {
                    title: 'Sign Up',
                    error: 'Please use your Roehampton University email'
                });
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                return res.render('auth/signup', {
                    title: 'Sign Up',
                    error: 'Passwords do not match'
                });
            }
            
            // Check if user exists
            const checkSql = 'SELECT * FROM Users WHERE email = ?';
            const existingUsers = await db.query(checkSql, [email]);
            
            if (existingUsers.length > 0) {
                return res.render('auth/signup', {
                    title: 'Sign Up',
                    error: 'Email already in use'
                });
            }
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Determine user type based on email
            let userType = 'student';
            if (!/^\w+\d+@roehampton\.ac\.uk$/.test(email)) {
                userType = 'staff';
            }
            
            // Insert user
            const insertSql = 'INSERT INTO Users (name, email, password, user_type) VALUES (?, ?, ?, ?)';
            const result = await db.query(insertSql, [name, email, hashedPassword, userType]);
            
            if (result.affectedRows !== 1) {
                return res.render('auth/signup', {
                    title: 'Sign Up',
                    error: 'Failed to create account'
                });
            }
            
            // Create user preferences
            const userId = result.insertId;
            const prefSql = 'INSERT INTO User_Preferences (user_id) VALUES (?)';
            await db.query(prefSql, [userId]);
            
            // Redirect to login page
            req.flash('success', 'Account created successfully! Please login.');
            res.redirect('/auth/login');
            
        } catch (error) {
            console.error(error);
            res.render('auth/signup', {
                title: 'Sign Up',
                error: 'Server error, please try again'
            });
        }
    }
    
    // Handle logout
    static logout(req, res) {
        res.clearCookie('token');
        res.redirect('/');
    }
    
    // Render dashboard
    static async getDashboard(req, res) {
        try {
            const user = await UserModel.getUserById(req.user.id);
            const rides = await UserModel.getUserRides(req.user.id);
            const requests = await UserModel.getUserRequests(req.user.id);
            
            res.render('dashboard', {
                title: 'Dashboard',
                user,
                rides,
                requests
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error loading dashboard',
                error: { status: 500 }
            });
        }
    }
}

module.exports = AuthController; 