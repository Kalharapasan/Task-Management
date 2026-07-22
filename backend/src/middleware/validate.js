const { validationResult } = require('express-validator');

/**
 * Runs after a set of express-validator check(...) chains. Collects
 * any validation failures into a single, readable 400 response instead
 * of letting bad data reach the controller/database layer.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formatted = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formatted,
  });
}

module.exports = validate;
