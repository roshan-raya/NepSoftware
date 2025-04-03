const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = {
    // Middleware to verify JWT token
    verifyToken: (req, res, next) => {
        // Get token from cookies
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).redirect('/auth/login');
        }
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(401).redirect('/auth/login');
        }
    },
    
    // Middleware to check if user is authenticated (doesn't redirect)
    isAuthenticated: (req, res, next) => {
        const token = req.cookies.token;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
            } catch (err) {
                req.user = null;
            }
        } else {
            req.user = null;
        }
        
        next();
    },
    
    // Middleware to restrict access to specific user types
    checkUserType: (allowedTypes) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).redirect('/auth/login');
            }
            
            if (allowedTypes.includes(req.user.user_type)) {
                next();
            } else {
                return res.status(403).render('error', {
                    message: 'Access denied',
                    error: { status: 403 }
                });
            }
        };
    }
};

module.exports = auth; 