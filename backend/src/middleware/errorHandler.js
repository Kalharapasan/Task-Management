const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = err.message || 'Internal server error';
  }

  console.error('[API Error]', err);

  res.status(statusCode || 500).json({
    success: false,
    message: message || 'Something went wrong',
    error: err.message,
  });
}

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFound };
