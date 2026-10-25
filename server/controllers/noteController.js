/**
 * Note Controller (Course Topic: 55, 56 & 57 - CRUD APIs & Populate)
 */
import { Note } from '../models/Note.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get all notes with filters and populated references
 * GET /api/v1/notes
 */
export const getAllNotes = catchAsync(async (req, res) => {
  const queryObj = {};

  if (req.query.subject) queryObj.subject = req.query.subject;
  if (req.query.author) queryObj.author = req.query.author;
  if (req.query.unit) queryObj.unit = Number(req.query.unit);

  if (req.query.search) {
    queryObj.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const notes = await Note.find(queryObj)
    .populate('author', 'name email role avatar department')
    .populate('subject', 'name code department semester color')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Note.countDocuments(queryObj);

  res.status(200).json({
    status: 'success',
    results: notes.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { notes }
  });
});

/**
 * Get single note by ID with populated author and subject
 * GET /api/v1/notes/:id
 */
export const getNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id)
    .populate('author', 'name email role avatar department')
    .populate('subject', 'name code department semester credits color');

  if (!note) {
    return next(new AppError('No note found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { note }
  });
});

/**
 * Create a new study note
 * POST /api/v1/notes (Protected)
 */
export const createNote = catchAsync(async (req, res, next) => {
  // Automatically assign logged-in user as the author
  req.body.author = req.user._id;

  const newNote = await Note.create(req.body);

  const populated = await newNote.populate([
    { path: 'author', select: 'name email role avatar' },
    { path: 'subject', select: 'name code department' }
  ]);

  res.status(201).json({
    status: 'success',
    data: { note: populated }
  });
});

/**
 * Create a new study note with attached document file (Multer)
 * POST /api/v1/notes/with-file (Protected)
 */
export const createNoteWithFile = catchAsync(async (req, res, next) => {
  req.body.author = req.user._id;

  if (req.file) {
    req.body.fileName = req.file.filename;
    req.body.fileUrl = `/api/v1/resources/download/${req.file.filename}`;
    req.body.fileSize = req.file.size;
    req.body.fileType = req.file.mimetype.split('/')[1] || 'pdf';
  }

  // Parse tags if sent as JSON string or comma-separated in form-data
  if (typeof req.body.tags === 'string') {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch {
      req.body.tags = req.body.tags.split(',').map((t) => t.trim());
    }
  }

  const newNote = await Note.create(req.body);

  const populated = await newNote.populate([
    { path: 'author', select: 'name email role avatar' },
    { path: 'subject', select: 'name code department' }
  ]);

  res.status(201).json({
    status: 'success',
    data: { note: populated }
  });
});

/**
 * Update an existing note
 * PATCH /api/v1/notes/:id (Protected - Author or Admin)
 */
export const updateNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new AppError('No note found with that ID', 404));
  }

  // Verify ownership: only author or admin can update
  if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to edit this note.', 403));
  }

  const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'author', select: 'name email role' },
    { path: 'subject', select: 'name code' }
  ]);

  res.status(200).json({
    status: 'success',
    data: { note: updatedNote }
  });
});

/**
 * Delete a note
 * DELETE /api/v1/notes/:id (Protected - Author or Admin)
 */
export const deleteNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new AppError('No note found with that ID', 404));
  }

  if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this note.', 403));
  }

  await Note.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Like or unlike a note
 * POST /api/v1/notes/:id/like (Protected)
 */
export const toggleLike = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return next(new AppError('No note found with that ID', 404));
  }

  const userId = req.user._id;
  const alreadyLiked = note.likes.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    // Remove like
    note.likes = note.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    // Add like
    note.likes.push(userId);
  }

  await note.save();

  res.status(200).json({
    status: 'success',
    data: {
      liked: !alreadyLiked,
      totalLikes: note.likes.length
    }
  });
});
