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
import { protect } from '../middleware/authMiddleware.js';
import { checkDbConnection } from '../middleware/dbCheck.js';
import { uploadStudyFile } from '../middleware/uploadMiddleware.js';

const router = Router();

// Ensure DB is ready before querying
router.use(checkDbConnection);

// Public routes for viewing and searching notes
router.get('/', getAllNotes);
router.get('/:id', getNote);

// Protected routes (User must be authenticated)
router.use(protect);
router.post('/', validateNote, createNote);
router.post('/with-file', uploadStudyFile, createNoteWithFile);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/like', toggleLike);

export default router;
