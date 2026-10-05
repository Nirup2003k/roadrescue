const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Something went wrong on our end. Please try again.';
  let errors = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.code === '23505') {
    statusCode = 409;
    message = 'That record already exists.';
  } else if (err.code && err.code.startsWith('23')) {
    statusCode = 400;
    message = 'The request could not be processed due to a data conflict.';
  }

  if (statusCode === 500) {
    console.error('[unhandled error]', err);
  }

  res.status(statusCode).json({ success: false, message, ...(errors ? { errors } : {}) });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
