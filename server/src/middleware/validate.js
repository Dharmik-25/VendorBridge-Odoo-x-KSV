const { error } = require('../utils/apiResponse');

/**
 * Generic request body/query validation middleware using Zod
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    return error(
      res,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }
};

module.exports = validate;
