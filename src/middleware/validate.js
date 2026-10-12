/**
 * Request validation middleware.
 * Validates request data (body, query, params) against a provided Joi schema.
 */
const ApiError = require('../utils/ApiError');

/**
 * Validates the request object against the provided schema.
 * @param {Object} schema - Joi schema object (can contain keys: body, query, params).
 * @returns {Function} Express middleware function.
 */
const validate = (schema) => {
  return (req, res, next) => {
    // Determine which parts of the request to validate
    const validKeys = ['body', 'query', 'params'].filter(key => schema[key]);
    
    let hasError = false;
    let combinedErrors = [];

    validKeys.forEach((key) => {
      // abortEarly: false ensures we collect all validation errors, not just the first one.
      // stripUnknown: true removes any fields from the request that aren't defined in the schema (security feature).
      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        hasError = true;
        // Format each error item nicely
        const formattedErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        combinedErrors = combinedErrors.concat(formattedErrors);
      } else {
        // Replace request data with the validated/stripped value
        req[key] = value;
      }
    });

    if (hasError) {
      return next(ApiError.badRequest('Validation failed', combinedErrors));
    }

    next();
  };
};

module.exports = validate;
