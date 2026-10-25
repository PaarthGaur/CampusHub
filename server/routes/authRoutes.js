/**
 * Auth Express Router (Course Topic: 55, 56 & 57)
 */
import { Router } from 'express';
import { signup, login, getMe, updateMe } from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../middleware/validator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

// Protected routes (require valid JWT)
router.use(protect);
router.get('/me', getMe);
router.patch('/updateMe', updateMe);

export default router;
