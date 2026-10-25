/**
 * Authentication Controller (Course Topic: 57 - JWT Authentication & bcrypt)
 */
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { activityEmitter } from '../events/activityEmitter.js';

// Helper to format auth response and issue token
function createSendToken(user, statusCode, res) {
  const token = signToken(user._id);

  // Remove password from output JSON
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        avatar: user.avatar
      }
    }
  });
}

/**
 * Register a new user
 * POST /api/v1/auth/signup
 */
export const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, role, department, semester } = req.body;

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email address already exists.', 409));
  }

  // User pre-save hook handles bcrypt password hashing
  const newUser = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    department: department || 'Computer Science & AI',
    semester: semester || 4
  });

  activityEmitter.logActivity('USER_SIGNUP', {
    userId: newUser._id,
    action: `User registered: ${newUser.email}`,
    meta: { role: newUser.role }
  });

  createSendToken(newUser, 201, res);
});

/**
 * Log in an existing user
 * POST /api/v1/auth/login
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Explicitly select password field since schema sets `select: false`
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password credentials.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  activityEmitter.logActivity('USER_LOGIN', {
    userId: user._id,
    action: `User logged in: ${user.email}`,
    meta: { role: user.role }
  });

  createSendToken(user, 200, res);
});

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me (Protected)
 */
export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

/**
 * Update current user profile
 * PATCH /api/v1/auth/updateMe (Protected)
 */
export const updateMe = catchAsync(async (req, res, next) => {
  // Prevent password updates on this route
  if (req.body.password) {
    return next(new AppError('This route is not for password updates. Use /updatePassword.', 400));
  }

  // Filter allowed fields
  const allowedFields = ['name', 'department', 'semester', 'avatar'];
  const updateData = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
