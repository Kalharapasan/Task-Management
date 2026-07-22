require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Task Management API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
})();
