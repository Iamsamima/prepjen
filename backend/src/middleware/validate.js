/* Zod validation middleware. Use: validate(schema, 'body' | 'query' | 'params') */
const ApiError = require('../utils/ApiError');

module.exports = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new ApiError(400, 'Validation failed', result.error.flatten()));
  }
  req[source] = result.data;
  next();
};