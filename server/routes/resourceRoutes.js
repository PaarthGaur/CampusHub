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
import { protect, restrictTo } from '../middleware/authMiddleware.js';

import { checkDbConnection } from '../middleware/dbCheck.js';

const router = Router();

// Ensure DB is ready before querying
router.use(checkDbConnection);

// All resource routes require authentication
router.use(protect);

router.get('/', listResources);
router.post('/upload', restrictTo('admin', 'faculty'), uploadStudyFile, uploadResource);

// Download and info routes (uses Node.js Streams) - supports both :fileName and :id
router.get('/download/:fileName', streamDownloadResource);
router.get('/:id/download', streamDownloadResource);
router.get('/info/:fileName', getResourceInfo);
router.get('/:id/info', getResourceInfo);
router.get('/:id', getResourceInfo);

export default router;
