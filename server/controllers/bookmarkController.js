/**
 * Bookmark Controller (Course Topic: 55, 56 & 57 - Relations & Populates)
 */
import { Bookmark } from '../models/Bookmark.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get all bookmarks for the authenticated user
 * GET /api/v1/bookmarks (Protected)
 */
export const getMyBookmarks = catchAsync(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .populate({
      path: 'note',
      populate: [
        { path: 'author', select: 'name email avatar' },
        { path: 'subject', select: 'name code color' }
      ]
    })
    .populate('subject', 'name code department')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookmarks.length,
    data: { bookmarks }
  });
});

/**
 * Toggle bookmark for a note
 * POST /api/v1/bookmarks/toggle (Protected)
 */
export const toggleBookmark = catchAsync(async (req, res, next) => {
  const { noteId, subjectId } = req.body;

  if (!noteId && !subjectId) {
    return next(new AppError('Please provide a noteId or subjectId to bookmark.', 400));
  }

  const query = { user: req.user._id };
  if (noteId) query.note = noteId;
  if (subjectId) query.subject = subjectId;

  const existingBookmark = await Bookmark.findOne(query);

  if (existingBookmark) {
    await Bookmark.findByIdAndDelete(existingBookmark._id);
    return res.status(200).json({
      status: 'success',
      bookmarked: false,
      message: 'Bookmark removed successfully.'
    });
  }

  const newBookmark = await Bookmark.create({
    user: req.user._id,
    note: noteId || null,
    subject: subjectId || null
  });

  res.status(201).json({
    status: 'success',
    bookmarked: true,
    data: { bookmark: newBookmark }
  });
});

/**
 * Remove a bookmark by ID
 * DELETE /api/v1/bookmarks/:id (Protected)
 */
export const deleteBookmark = catchAsync(async (req, res, next) => {
  const bookmark = await Bookmark.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!bookmark) {
    return next(new AppError('Bookmark not found or does not belong to you.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
