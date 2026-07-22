
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST && process.env.DB_HOST !== 'undefined' ? process.env.DB_HOST : '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT && process.env.DB_PORT !== 'undefined' ? process.env.DB_PORT : '3306';
process.env.DB_NAME = process.env.DB_NAME && process.env.DB_NAME !== 'undefined' ? process.env.DB_NAME : 'task_management_test';
process.env.DB_USER = process.env.DB_USER && process.env.DB_USER !== 'undefined' ? process.env.DB_USER : 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== 'undefined' ? process.env.DB_PASSWORD : '';
process.env.JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET !== 'undefined' ? process.env.JWT_SECRET : 'test_jwt_secret_3c9f1e8b7a4d2f6c9a1e5b8d7f2c4a9e6b1d8f3a7c5e9f2b4d6a8c1e3f5b7d9';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET !== 'undefined' ? process.env.JWT_REFRESH_SECRET : 'test_jwt_refresh_secret_8e4a2c7f1d9b6e3a5f8c2d7b9a1e4f6c3b8d5a2f7e9c1d4b6a3f8e5c2d7b9a1';
process.env.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN && process.env.ACCESS_TOKEN_EXPIRES_IN !== 'undefined' ? process.env.ACCESS_TOKEN_EXPIRES_IN : '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN && process.env.REFRESH_TOKEN_EXPIRES_IN !== 'undefined' ? process.env.REFRESH_TOKEN_EXPIRES_IN : '7d';
process.env.CLIENT_URL = process.env.CLIENT_URL && process.env.CLIENT_URL !== 'undefined' ? process.env.CLIENT_URL : 'http://localhost:5173';
