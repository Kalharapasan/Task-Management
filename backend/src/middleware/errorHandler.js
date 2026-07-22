const ApiError = require('../utils/ApiError');


function errorHandler(err, req, res, next) {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  }

  if (process.env.NODE_ENV !== 'production' && !(err instanceof ApiError)) {
    console.error(err);
  }

  res.status(statusCode || 500).json({
    success: false,
    message: message || 'Something went wrong',
  });
}

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFound };
