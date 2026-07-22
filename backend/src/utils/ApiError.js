/**
 * Lightweight custom error class so controllers can throw errors with
 * an explicit HTTP status code, and the central error handler can
 * respond consistently without guessing.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
