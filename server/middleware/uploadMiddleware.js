/**
 * Multer File Upload Middleware (Course Topic: 58 - Multer File Uploads)
 * Configures disk storage, filename sanitization, MIME-type validation, and size constraints.
 */
import multer from 'multer';
import path from 'path';
import config from '../config/env.js';
import { resolveFromRoot, inspectFile } from '../utils/pathHelper.js';
import AppError from '../utils/appError.js';

// Configure Multer Disk Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resolveFromRoot('uploads'));
  },
  filename: (req, file, cb) => {
    const { safeName } = inspectFile(file.originalname);
    cb(null, safeName);
  }
});

// Whitelist allowed study document MIME types
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type '${file.mimetype}'. Only PDF, Word documents, PowerPoint slides, and images are permitted.`,
        400
      ),
      false
    );
  }
};

// Initialize Multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024 // e.g. 10MB
  }
});

// Single study material document upload handler
export const uploadStudyFile = upload.single('file');

export default upload;
