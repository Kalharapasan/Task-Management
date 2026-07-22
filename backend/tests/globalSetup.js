const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'task_management_test';

module.exports = async function globalSetup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });


  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schemaSql = fs
    .readFileSync(schemaPath, 'utf8')
    .replace(/task_management/g, DB_NAME);

  await connection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
  await connection.query(schemaSql);
  await connection.end();
};
