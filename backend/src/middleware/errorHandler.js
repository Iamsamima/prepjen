const logger = require('../utils/logger');

module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: err.message || 'Internal server error',
    details: err.details,
  };
  if (status >= 500) logger.error(req.method, req.originalUrl, err);
  if (process.env.NODE_ENV !== 'production' && err.stack) payload.stack = err.stack;
  res.status(status).json(payload);
};