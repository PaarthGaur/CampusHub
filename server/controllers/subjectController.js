/**
 * Subject Controller (Course Topic: 55 & 56 - CRUD APIs & Query Filtering)
 */
import { Subject } from '../models/Subject.js';
import { Note } from '../models/Note.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get all subjects with optional filtering, search, and pagination
 * GET /api/v1/subjects
 */
export const getAllSubjects = catchAsync(async (req, res) => {
  const queryObj = {};

  // Filtering by semester or department
  if (req.query.semester) queryObj.semester = Number(req.query.semester);
  if (req.query.department) queryObj.department = req.query.department;

  // Search by keyword (name or code)
  if (req.query.search) {
    queryObj.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { code: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Sorting
  const sortBy = req.query.sort || 'code';

  const subjects = await Subject.find(queryObj).sort(sortBy);

  res.status(200).json({
    status: 'success',
    results: subjects.length,
    data: { subjects }
  });
});

/**
 * Get single subject by Code or ID
 * GET /api/v1/subjects/:identifier
 */
export const getSubject = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  let subject;
  // Check if identifier is MongoDB ObjectId or Course Code
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    subject = await Subject.findById(identifier);
  } else {
    subject = await Subject.findOne({ code: identifier.toUpperCase() });
  }

  if (!subject) {
    return next(new AppError(`No subject found with identifier '${identifier}'`, 404));
  }

  // Attach associated notes count
  const notesCount = await Note.countDocuments({ subject: subject._id });

  res.status(200).json({
    status: 'success',
    data: {
      subject,
      notesCount
    }
  });
});

/**
 * Create a new subject
 * POST /api/v1/subjects (Protected - Admin/Faculty)
 */
export const createSubject = catchAsync(async (req, res, next) => {
  const existing = await Subject.findOne({ code: req.body.code?.toUpperCase() });
  if (existing) {
    return next(new AppError(`Subject with code '${req.body.code}' already exists.`, 409));
  }

  const newSubject = await Subject.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { subject: newSubject }
  });
});

/**
 * Update an existing subject
 * PATCH /api/v1/subjects/:id (Protected - Admin/Faculty)
 */
export const updateSubject = catchAsync(async (req, res, next) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!subject) {
    return next(new AppError('No subject found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { subject }
  });
});

/**
 * Delete a subject
 * DELETE /api/v1/subjects/:id (Protected - Admin)
 */
export const deleteSubject = catchAsync(async (req, res, next) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);

  if (!subject) {
    return next(new AppError('No subject found with that ID', 404));
  }

  // Also clean up any notes associated with this subject
  await Note.deleteMany({ subject: subject._id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
