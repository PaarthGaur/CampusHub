/**
 * Resource Routes (Course Topic: 52 - Streams & 58 - Multer Uploads)
 */
import { Router } from 'express';
import {
  listResources,
  uploadResource,
  streamDownloadResource,
  getResourceInfo
} from '../controllers/resourceController.js';
import { uploadStudyFile } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', listResources);

// Public download and info routes (uses Node.js Streams)
router.get('/download/:fileName', streamDownloadResource);
router.get('/info/:fileName', getResourceInfo);

// Protected upload route (requires authentication & multipart/form-data)
router.post('/upload', uploadStudyFile, uploadResource);

export default router;
