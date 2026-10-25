/**
 * Subject Express Router (Course Topic: 55, 56 & 57)
 */
import { Router } from 'express';
import {
  getAllSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.js';
import { validateSubject } from '../middleware/validator.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { checkDbConnection } from '../middleware/dbCheck.js';

const router = Router();

// Ensure DB is ready before querying
router.use(checkDbConnection);

// Public routes for browsing course curriculum
router.get('/', getAllSubjects);
router.get('/:identifier', getSubject);

// Protected routes (Admin / Faculty only for creation and modification)
router.use(protect);
router.post('/', restrictTo('admin', 'faculty'), validateSubject, createSubject);
router.patch('/:id', restrictTo('admin', 'faculty'), updateSubject);
router.delete('/:id', restrictTo('admin'), deleteSubject);

export default router;
