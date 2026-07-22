const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = err.message || 'Internal server error';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[API Error]', err);
  }

  res.status(statusCode || 500).json({
    success: false,
    message: message || 'Something went wrong',
    error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
  });
}

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFound };
