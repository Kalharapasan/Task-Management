const jwt = require('jsonwebtoken');


function signAccessToken(payload) {
  const expiresIn =
    process.env.ACCESS_TOKEN_EXPIRES_IN && process.env.ACCESS_TOKEN_EXPIRES_IN !== 'undefined'
      ? process.env.ACCESS_TOKEN_EXPIRES_IN
      : '15m';
  const secret = process.env.JWT_SECRET 
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET ;
  return jwt.verify(token, secret);
}

function signRefreshToken(payload) {
  const expiresIn =
    process.env.REFRESH_TOKEN_EXPIRES_IN && process.env.REFRESH_TOKEN_EXPIRES_IN !== 'undefined'
      ? process.env.REFRESH_TOKEN_EXPIRES_IN
      : '7d';
  const secret = process.env.JWT_REFRESH_SECRET ;
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET ;
  return jwt.verify(token, secret);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
