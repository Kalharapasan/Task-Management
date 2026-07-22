const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');


function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication token missing or malformed'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired authentication token'));
  }
}

module.exports = requireAuth;
