const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME ;

module.exports = async function globalTeardown() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ,
    port: process.env.DB_PORT ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
  });

  await connection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
  await connection.end();
};
