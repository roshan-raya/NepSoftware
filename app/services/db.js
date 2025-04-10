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
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  },
};

// Create connection pool with retry logic
let pool;
let retryCount = 0;
const maxRetries = 10;
const retryDelay = 5000; // 5 seconds

async function createPool() {
  try {
    console.log('Creating database connection pool...');
    pool = mysql.createPool(config.db);
    
    // Test the connection
    const [result] = await pool.query('SELECT 1 as test');
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    if (error.code) console.error('Error code:', error.code);
    if (error.errno) console.error('Error number:', error.errno);
    
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Retrying connection in ${retryDelay/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return createPool();
    } else {
      console.error('Max retries reached. Could not connect to database.');
      return false;
    }
  }
}

// Initialize the pool
createPool().then(success => {
  if (!success) {
    console.error('Failed to initialize database connection pool');
  }
});

// Utility function to query the database
async function query(sql, params) {
  if (!pool) {
    console.error('Database pool not initialized');
    throw new Error('Database connection not available');
  }

  try {
    console.log('DB Query:', sql);
    
    // Skip parameter processing if no params provided
    if (!params || !Array.isArray(params) || params.length === 0) {
      const [result] = await pool.query(sql);
      console.log(`DB Result: ${Array.isArray(result) ? result.length : (result ? 1 : 0)} rows returned`);
      return result;
    }
    
    // For simple cases with 1 or 2 numeric parameters
    if (params.length <= 2 && params.every(p => typeof p === 'number' || (typeof p === 'string' && !isNaN(p)))) {
      let finalQuery = sql;
      params.forEach(param => {
        const numValue = Number(param);
        finalQuery = finalQuery.replace('?', numValue);
      });
      
      console.log('Simplified numeric query:', finalQuery);
      const [result] = await pool.query(finalQuery);
      console.log(`DB Result: ${Array.isArray(result) ? result.length : (result ? 1 : 0)} rows returned`);
      return result;
    }
    
    // Process parameters for more complex cases
    const cleanParams = params.map(param => {
      if (param === null || param === undefined) {
        return null;
      }
      
      if (typeof param === 'number') {
        return param;
      }
      
      if (typeof param === 'string') {
        if (/^-?\d+(\.\d+)?$/.test(param.trim())) {
          return Number(param);
        }
        return param;
      }
      
      if (typeof param === 'object') {
        return JSON.stringify(param);
      }
      
      return param;
    });
    
    try {
      const [result] = await pool.execute(sql, cleanParams);
      console.log(`DB Result: ${Array.isArray(result) ? result.length : (result ? 1 : 0)} rows returned`);
      return result;
    } catch (execError) {
      console.error('SQL execution error:', execError.message);
      console.error('SQL that failed:', sql);
      console.error('Parameters that failed:', cleanParams);
      
      // Fallback: try with direct query
      console.log('Trying fallback with direct query...');
      let fallbackQuery = sql;
      for (let i = 0; i < cleanParams.length; i++) {
        const param = cleanParams[i];
        if (typeof param === 'string') {
          fallbackQuery = fallbackQuery.replace('?', `'${param.replace(/'/g, "''")}'`);
        } else if (param === null) {
          fallbackQuery = fallbackQuery.replace('?', 'NULL');
        } else {
          fallbackQuery = fallbackQuery.replace('?', param);
        }
      }
      const [fallbackResult] = await pool.query(fallbackQuery);
      return fallbackResult;
    }
  } catch (error) {
    console.error('Database query error:', error);
    if (error.code) console.error('Error code:', error.code);
    if (error.errno) console.error('Error number:', error.errno);
    if (error.sqlState) console.error('SQL state:', error.sqlState);
    if (error.sqlMessage) console.error('SQL message:', error.sqlMessage);
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
testConnection().then(success => {
  if (!success) {
    console.error('Failed to test database connection');
  }
});

module.exports = {
  query,
  testConnection
};