/**
 * Database Readiness Middleware (Course Topic: 56 & 57 - Error Handling Middleware)
 * Ensures database queries fail fast with an informative 503 Service Unavailable
 * if MongoDB is disconnected, instead of timing out after 10 seconds.
 */
import mongoose from 'mongoose';
import AppError from '../utils/appError.js';

export const checkDbConnection = (req, res, next) => {
  // readyState 1 means 'connected'
  if (mongoose.connection.readyState !== 1) {
    return next(
      new AppError(
        'Database service is currently disconnected. Please configure a valid MONGO_URI in server/.env (e.g. MongoDB Atlas) or start your local MongoDB service.',
        503
      )
    );
  }
  next();
};

export default checkDbConnection;
