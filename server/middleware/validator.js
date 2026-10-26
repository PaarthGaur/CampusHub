/**
 * Request Validation Middleware (Course Topic: 57 - Validation)
 * Uses express-validator to validate and sanitize incoming request bodies.
 */
import { body, param, query, validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

// Middleware to evaluate validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => `${err.path}: ${err.msg}`).join(', ');
    return next(new AppError(`Validation failed: ${errorMessages}`, 400));
  }
  next();
};

// Signup Validation Rules
export const validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .toLowerCase(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .custom(value => typeof value === 'string' && Buffer.byteLength(value) <= 72).withMessage('Password must be at most 72 bytes'),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4')
    .custom((value, { req }) => Number(value) === Math.ceil(Number(req.body.semester || 4) / 2)).withMessage('Year must match the selected semester'),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('role')
    .optional()
    .isIn(['student']).withMessage('Public signup only supports students'),
  validate
];

// Login Validation Rules
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address').toLowerCase(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Subject Creation Validation Rules
export const validateSubject = [
  body('code')
    .trim()
    .notEmpty().withMessage('Subject code is required')
    .isLength({ max: 15 }).withMessage('Subject code cannot exceed 15 characters'),
  body('name')
    .trim()
    .notEmpty().withMessage('Subject name is required')
    .isLength({ min: 3, max: 120 }).withMessage('Subject name must be 3-120 characters'),
  body('semester')
    .notEmpty().withMessage('Semester is required')
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be an integer between 1 and 8'),
  validate
];

// Note Creation Validation Rules
export const validateNote = [
  body('title')
    .trim()
    .notEmpty().withMessage('Note title is required')
    .isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters'),
  body('subject')
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid Subject ID format'),
  body('unit')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Unit must be between 1 and 10'),
  validate
];

// Profile fields are validated before any database update.
export const validateProfile = [
  body('name').optional().isString().bail().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('username').optional().isString().bail().trim().isLength({ min: 1, max: 40 }).withMessage('Username must be 1–40 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username may contain letters, numbers, underscores and hyphens'),
  body('email').optional().isString().bail().trim().isEmail().withMessage('Enter a valid email address').toLowerCase(),
  body('university').optional().isString().bail().trim().isLength({ max: 150 }).withMessage('University cannot exceed 150 characters'),
  body('age').optional({ values: 'null' }).isInt({ min: 13, max: 100 }).withMessage('Age must be a whole number between 13 and 100'),
  body('department').optional().isString().bail().trim().isLength({ min: 1, max: 120 }).withMessage('Course must be 1–120 characters'),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  validate
];
