// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_NAME = 'ridesharingapp_test';

// Add any other test-specific environment variables or setup here 

module.exports = {
  db: {
    host: 'localhost',
    port: '3306',
    database: 'test_db',
    user: 'test_user',
    password: 'test_password'
  }
}; 