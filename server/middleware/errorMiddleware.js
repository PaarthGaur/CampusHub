/**
 * Centralized Error Handling Middleware (Course Topic: 57 - Error Handling Middleware)
 * Formats structured JSON error responses, captures operational errors, and logs runtime bugs.
 */
import AppError from '../utils/appError.js';
import config from '../config/env.js';

// Specific Mongoose & JWT Error Handlers
function handleCastErrorDB(err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

function handleDuplicateFieldsDB(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const val = err.keyValue ? err.keyValue[field] : 'value';
  const message = `Duplicate value '${val}' for field '${field}'. Please use another value.`;
  return new AppError(message, 409);
}

function handleValidationErrorDB(err) {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
}

function handleJWTError() {
  return new AppError('Invalid authentication token. Please log in again.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Your token has expired. Please log in again.', 401);
}

// Development Error Details
function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
}

// Production Error Response (Hides sensitive stack trace)
function sendErrorProd(err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.error('[UNEXPECTED ERROR]:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong on the server!'
    });
  }
}

// Global Express Error Middleware: (err, req, res, next)
export const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.name === 'MulterError') err = new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds upload size limit.' : 'Invalid multipart upload.',400);
  if (err.type === 'entity.parse.failed') err = new AppError('Invalid JSON request body.',400);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (config.isDev) {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
