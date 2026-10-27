/**
 * Auth Express Router (Course Topic: 55, 56 & 57)
 */
import { checkDbConnection } from '../middleware/dbCheck.js';
import { authRateLimit } from '../middleware/authRateLimit.js';
import { Router } from 'express';
import { signup, login, getMe, updateMe, updatePassword } from '../controllers/authController.js';
import { validateSignup, validateLogin, validateProfile } from '../middleware/validator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/signup', authRateLimit, validateSignup, checkDbConnection, signup);
router.post('/login', authRateLimit, validateLogin, checkDbConnection, login);

// Protected routes (require valid JWT)
router.use(protect);
router.get('/me', getMe);
router.patch('/updateMe', validateProfile, updateMe);
router.patch('/updatePassword', updatePassword);

export default router;
