const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Protects routes by requiring a valid "Bearer <token>" Authorization
 * header. On success, attaches the decoded payload to req.user so
 * downstream controllers know which user is making the request.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication token missing or malformed'));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired authentication token'));
  }
}

module.exports = requireAuth;
