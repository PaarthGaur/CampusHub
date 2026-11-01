/**
 * Note Express Router (Course Topic: 55, 56 & 57)
 */
import { Router } from 'express';
import {
  getAllNotes,
  getNote,
  createNote,
  createNoteWithFile,
  updateNote,
  deleteNote,
  toggleLike
} from '../controllers/noteController.js';
import { validateNote } from '../middleware/validator.js';
import { protect, optionalProtect, restrictTo } from '../middleware/authMiddleware.js';
import { checkDbConnection } from '../middleware/dbCheck.js';
import { uploadStudyFile } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(checkDbConnection);

// Public read routes with optional authentication (guests can view public notes; logged-in users see public + own notes)
router.get('/', optionalProtect, getAllNotes);
router.get('/:id', optionalProtect, getNote);

// Protected routes (User must be authenticated for write / modify / like)
router.use(protect);

// Faculty & Admin only can create / upload notes
router.post('/', restrictTo('admin', 'faculty'), validateNote, createNote);
router.post('/with-file', restrictTo('admin', 'faculty'), uploadStudyFile, validateNote, createNoteWithFile);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/like', toggleLike);

export default router;
