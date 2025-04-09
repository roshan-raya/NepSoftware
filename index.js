"use strict";

// Include the app.js file.
// This will run the code.
console.log("Starting Ride Sharing App...");

const app = require("./app/app.js");
const http = require('http');

// Get port from environment or use 3000 as default
const port = process.env.PORT || 3000;
app.set('port', port);

// Create HTTP server
const server = http.createServer(app);

// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
  // Listen on provided port, on all network interfaces
  server.listen(port);

  // Event listener for HTTP server "error" event
  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // Handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        console.error('Please stop any other server running on port ' + port + ' or use a different port');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  // Event listener for HTTP server "listening" event
  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Ride Sharing App listening on ' + bind);
  });
}

// Export the app for testing
module.exports = app;