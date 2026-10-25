/**
 * Resource Controller (Course Topic: 52 - Streams/Buffers & 58 - Multer Uploads)
 * Handles file uploads via Multer, stream-based downloads, and metadata retrieval.
 */
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { resolveFromRoot } from '../utils/pathHelper.js';
import { streamFileToOutput } from '../utils/streamHelper.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { activityEmitter } from '../events/activityEmitter.js';

/**
 * Handle multipart study material file upload
 * POST /api/v1/resources/upload (Protected)
 */
export const uploadResource = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please provide a file to upload.', 400));
  }

  const { filename, originalname, size, mimetype } = req.file;
  const fileUrl = `/api/v1/resources/download/${filename}`;

  activityEmitter.logActivity('FILE_UPLOAD', {
    userId: req.user?._id || 'Anonymous',
    action: `Uploaded study material: ${originalname}`,
    meta: {
      fileName: filename,
      originalName: originalname,
      fileSize: size,
      mimetype
    }
  });

  res.status(201).json({
    status: 'success',
    data: {
      fileName: filename,
      originalName: originalname,
      fileSize: size,
      fileType: path.extname(originalname).replace('.', '').toLowerCase(),
      mimetype,
      fileUrl
    }
  });
});

/**
 * Stream study document directly to client using Node.js Readable Streams
 * GET /api/v1/resources/download/:fileName
 * Topic Covered: 52 - Node Streams (pipe chunks without buffering entire file in RAM)
 */
export const streamDownloadResource = catchAsync(async (req, res, next) => {
  const { fileName } = req.params;

  // Prevent directory traversal attacks
  const safeBaseName = path.basename(fileName);
  const filePath = resolveFromRoot('uploads', safeBaseName);

  try {
    const stats = await fsPromises.stat(filePath);
    if (!stats.isFile()) {
      return next(new AppError('Requested resource is not a valid file.', 400));
    }

    // Set appropriate streaming headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${safeBaseName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Efficient streaming pipeline
    await streamFileToOutput(filePath, res);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return next(new AppError('The requested file was not found on this server.', 404));
    }
    return next(err);
  }
});

/**
 * Get file metadata stats using fs.promises
 * GET /api/v1/resources/info/:fileName
 */
export const getResourceInfo = catchAsync(async (req, res, next) => {
  const safeBaseName = path.basename(req.params.fileName);
  const filePath = resolveFromRoot('uploads', safeBaseName);

  try {
    const stats = await fsPromises.stat(filePath);
    res.status(200).json({
      status: 'success',
      data: {
        fileName: safeBaseName,
        sizeBytes: stats.size,
        sizeMB: +(stats.size / 1024 / 1024).toFixed(2),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return next(new AppError('File not found.', 404));
    }
    return next(err);
  }
});
