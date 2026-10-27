/**
 * Bookmark Express Router (Course Topic: 55, 56 & 57)
 */
import { Router } from 'express';
import {
  getMyBookmarks,
  toggleBookmark,
  deleteBookmark
} from '../controllers/bookmarkController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkDbConnection } from '../middleware/dbCheck.js';

const router = Router();

// Ensure DB is ready before querying
router.use(protect);
router.use(checkDbConnection);

// All bookmark actions are personal and require authentication


router.get('/', getMyBookmarks);
router.post('/toggle', toggleBookmark);
router.delete('/:id', deleteBookmark);

export default router;
