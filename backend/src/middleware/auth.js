const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication token missing or malformed'));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email, role, iat, exp }
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired authentication token'));
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  return next();
}

module.exports = requireAuth;
module.exports.requireAdmin = requireAdmin;
