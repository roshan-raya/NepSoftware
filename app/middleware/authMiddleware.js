// Re-export the authentication middleware from auth.js
const { isAuthenticated } = require('./auth');

module.exports = { 
  isAuthenticated 
}; 