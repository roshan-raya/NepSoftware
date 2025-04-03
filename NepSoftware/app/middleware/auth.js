/**
 * Authentication middleware to check if a user is logged in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAuthenticated = (req, res, next) => {
  // Check if user is logged in (session exists)
  if (req.session && req.session.userId) {
    // User is authenticated, proceed to the next middleware/route handler
    return next();
  }
  
  // User is not authenticated, redirect to home page with a message
  return res.redirect('/?auth=required');
};

module.exports = {
  isAuthenticated
}; 