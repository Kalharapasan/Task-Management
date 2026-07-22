// Runs inside each test file's environment before anything else, so
// src/config/db.js and jsonwebtoken picks up these values as soon as
// they're required by the app. Falls back to sensible local defaults
// but respects any values already set (e.g. by CI).
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST ;
process.env.DB_PORT = process.env.DB_PORT ;
process.env.DB_NAME = process.env.DB_NAME ;
process.env.DB_USER = process.env.DB_USER ;
process.env.DB_PASSWORD = process.env.DB_PASSWORD;
process.env.JWT_SECRET = process.env.JWT_SECRET ;
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ;
process.env.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ;
process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ;
process.env.CLIENT_URL = process.env.CLIENT_URL ;
