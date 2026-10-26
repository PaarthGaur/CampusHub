/**
 * Authentication & Authorization Middleware (Course Topic: 57 - JWT Authentication & Protected Routes)
 */
import { checkDbConnection } from './dbCheck.js';
import { verifyToken } from '../utils/jwt.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { User } from '../models/User.js';

/**
 * Protects routes by validating JWT Bearer token
 */
export const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token from Authorization header (Format: Bearer <token>)
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please provide an authentication token.', 401));
  }

  // 2. Verify token signature and expiration
  const decoded = await verifyToken(token);

  // 3. Verify user still exists in database
  let unavailable;
  checkDbConnection(req, res, err => { unavailable = err; });
  if (unavailable) return next(unavailable);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (!currentUser.isActive) {
    return next(new AppError('This user account has been deactivated.', 403));
  }

  // 4. Attach authenticated user to request object
  req.user = currentUser;
  next();
});

/**
 * Restricts access to specific user roles (RBAC)
 * @param  {...string} roles - e.g. 'admin', 'faculty'
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

export default { protect, restrictTo };
