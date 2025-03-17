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
    connectionLimit: 5,
    queueLimit: 0,
  },
};

// Create connection pool
console.log('Creating database connection pool...');
const pool = mysql.createPool(config.db);

// Utility function to query the database
async function query(sql, params) {
  try {
    console.log('DB Query:', sql);
    console.log('DB Params:', params || []);
    
    // Ensure params is an array and all elements are of proper types
    const safeParams = Array.isArray(params) ? params.map(param => {
      // Convert any non-primitive parameters to strings to avoid type issues
      if (param === null || param === undefined) {
        return null;
      }
      if (typeof param === 'object') {
        return JSON.stringify(param);
      }
      return param;
    }) : [];
    
    console.log('Safe params after conversion:', safeParams);
    console.log('Safe param types:', safeParams.map(p => typeof p));
    
    try {
      const [rows, fields] = await pool.execute(sql, safeParams);
      console.log(`DB Result: ${rows.length} rows returned`);
      return rows;
    } catch (execError) {
      console.error('SQL execution error:', execError.message);
      console.error('SQL that failed:', sql);
      console.error('Parameters that failed:', safeParams);
      throw execError;
    }
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
    console.error('SQL state:', error.sqlState);
    console.error('SQL message:', error.sqlMessage);
    throw error; // Re-throw to be handled by the caller
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
  testConnection
<<<<<<< HEAD
}
=======
}

>>>>>>> origin/main
