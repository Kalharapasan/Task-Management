require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await testConnection();
  } catch (err) {
    console.error('Server startup failed due to database connection error:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Task Management API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
})();
