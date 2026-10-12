/**
 * Server entry point.
 * Imports the configured app and starts listening for connections.
 * Also handles unhandled exceptions and promise rejections for safety.
 */
const app = require('./app');
const appConfig = require('./config/app');

// Handle uncaught exceptions (last resort error handler)
// Log the error and exit safely rather than continuing in an unknown state
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Start the server
const server = app.listen(appConfig.port, () => {
  console.log(`Server running in ${appConfig.env} mode on port ${appConfig.port}`);
});

// Handle unhandled promise rejections (e.g., failed DB connection not caught in try-catch)
// Allows for graceful shutdown of the server
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
