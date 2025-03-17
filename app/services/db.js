require("dotenv").config();

const mysql = require('mysql2/promise');

// Log environment variables for debugging (excluding sensitive info)
console.log('Database Environment:', {
  host: process.env.DB_CONTAINER || process.env.MYSQL_HOST,
  port: process.env.DB_PORT,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_ROOT_USER || process.env.MYSQL_USER
});

const config = {
  db: {
    host: process.env.DB_CONTAINER || process.env.MYSQL_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.MYSQL_ROOT_USER || process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASS || 'password',
    database: process.env.MYSQL_DATABASE || 'ridesharingapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
};

// Create connection pool
console.log('Creating database connection pool...');
const pool = mysql.createPool(config.db);

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

// Function to execute queries
async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Test database connection
async function testConnection() {
  try {
    const result = await query('SELECT 1 as test');
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize connection test
testConnection();

module.exports = {
  query,
  testConnection,
  pool
};
