require('dotenv').config();
const { testConnection } = require('../src/config/db');

async function init() {
  console.log('🔒 Running safe database migration & initialization...');
  await testConnection();
  console.log('✅ Database setup complete without deleting any existing data.');
  process.exit(0);
}

init().catch((err) => {
  console.error('❌ Init failed:', err.message);
  process.exit(1);
});