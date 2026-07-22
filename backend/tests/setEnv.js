
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST ;
process.env.DB_PORT = process.env.DB_PORT ;
process.env.DB_NAME = process.env.DB_NAME ;
process.env.DB_USER = process.env.DB_USER ;
process.env.DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
process.env.JWT_SECRET = process.env.JWT_SECRET ;
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ;
process.env.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN && process.env.ACCESS_TOKEN_EXPIRES_IN !== 'undefined' ? process.env.ACCESS_TOKEN_EXPIRES_IN : '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN && process.env.REFRESH_TOKEN_EXPIRES_IN !== 'undefined' ? process.env.REFRESH_TOKEN_EXPIRES_IN : '7d';
process.env.CLIENT_URL = process.env.CLIENT_URL ;
