import mongoose from 'mongoose';
import fsPromises from 'fs/promises';
import path from 'path';
import { Resource } from '../models/Resource.js';
import { Note } from '../models/Note.js';
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
 * Helper to resolve resource and note documents by ID or fileName
 */
async function resolveResourceDocuments(identifier) {
  if (!identifier) return { resource: null, note: null };

  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  let resource = null;
  let note = null;

  if (isObjectId) {
    resource = await Resource.findById(identifier).populate('owner', 'name email role');
    if (!resource) {
      note = await Note.findById(identifier)
        .populate('author', 'name email role')
        .populate('subject', 'name code department');
      if (note?.fileName) {
        resource = await Resource.findOne({ fileName: note.fileName }).populate('owner', 'name email role');
      }
    }
  }

  if (!resource && !note) {
    const safeBaseName = path.basename(identifier);
    resource = await Resource.findOne({ fileName: safeBaseName }).populate('owner', 'name email role');
    note = await Note.findOne({
      $or: [
        { fileName: safeBaseName },
        { fileUrl: `/api/v1/resources/download/${safeBaseName}` }
      ]
    })
      .populate('author', 'name email role')
      .populate('subject', 'name code department');
  } else if (resource && !note) {
    note = await Note.findOne({
      $or: [
        { fileName: resource.fileName },
        { fileUrl: `/api/v1/resources/download/${resource.fileName}` }
      ]
    })
      .populate('author', 'name email role')
      .populate('subject', 'name code department');
  }

  return { resource, note };
}

/**
 * Stream study document directly to client using Node.js Readable Streams
 * GET /api/v1/resources/download/:fileName
 * GET /api/v1/resources/:id/download
 */
export const streamDownloadResource = catchAsync(async (req, res, next) => {
  const identifier = req.params.fileName || req.params.id;
  if (!identifier) {
    return next(new AppError('Resource identifier is required.', 400));
  }

  const { resource, note } = await resolveResourceDocuments(identifier);
  if (!resource && !note) {
    return next(new AppError('Resource not found.', 404));
  }

  const targetFileName = path.basename(resource?.fileName || note?.fileName || '');
  if (!targetFileName) {
    return next(new AppError('Resource file record is missing a valid filename.', 404));
  }

  // Authorization check
  const currentUserId = req.user?._id ? String(req.user._id) : null;
  const currentUserRole = req.user?.role || '';
  const resourceOwnerId = resource?.owner?._id ? String(resource.owner._id) : (resource?.owner ? String(resource.owner) : null);
  const noteAuthorId = note?.author?._id ? String(note.author._id) : (note?.author ? String(note.author) : null);

  const isOwner = currentUserId && (currentUserId === resourceOwnerId || currentUserId === noteAuthorId);
  const isPrivileged = currentUserRole === 'admin' || currentUserRole === 'faculty';
  const isPublic = note?.isPublic === true;

  if (!isOwner && !isPrivileged && !isPublic) {
    if (note && note.isPublic === false) {
      return next(new AppError('You are not authorized to access this private resource.', 403));
    }
    return next(new AppError('You are not authorized to download this resource.', 403));
  }

  // Prevent path traversal
  const uploadsDir = path.resolve(resolveFromRoot('uploads'));
  const filePath = path.resolve(path.join(uploadsDir, targetFileName));

  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return next(new AppError('Invalid file path request.', 400));
  }

  try {
    const stats = await fsPromises.stat(filePath);
    if (!stats.isFile()) {
      return next(new AppError('Requested resource is not a valid file.', 400));
    }

    const originalName = resource?.originalName || (note?.title ? `${note.title}${path.extname(targetFileName)}` : targetFileName);
    const safeDownloadName = path.basename(originalName).replace(/[\r\n"\\;,]/g, '_') || targetFileName;
    const mimeType = resource?.mimetype || (note?.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream');

    // Set appropriate streaming headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName}"`);
    res.setHeader('Content-Type', mimeType);

    // Increment download count on Note
    if (note?._id) {
      Note.findByIdAndUpdate(note._id, { $inc: { downloadCount: 1 } }).catch(err => {
        console.error('[DownloadCount] Failed to increment count:', err.message);
      });
    } else if (targetFileName) {
      Note.updateOne({ fileName: targetFileName }, { $inc: { downloadCount: 1 } }).catch(err => {
        console.error('[DownloadCount] Failed to increment count:', err.message);
      });
    }

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
 * GET /api/v1/resources/:id/info
 * GET /api/v1/resources/:id
 */
export const getResourceInfo = catchAsync(async (req, res, next) => {
  const identifier = req.params.fileName || req.params.id;
  if (!identifier) {
    return next(new AppError('Resource identifier is required.', 400));
  }

  const { resource, note } = await resolveResourceDocuments(identifier);
  if (!resource && !note) {
    return next(new AppError('Resource not found.', 404));
  }

  const targetFileName = path.basename(resource?.fileName || note?.fileName || '');
  if (!targetFileName) {
    return next(new AppError('Resource file record is missing a valid filename.', 404));
  }

  const currentUserId = req.user?._id ? String(req.user._id) : null;
  const currentUserRole = req.user?.role || '';
  const resourceOwnerId = resource?.owner?._id ? String(resource.owner._id) : (resource?.owner ? String(resource.owner) : null);
  const noteAuthorId = note?.author?._id ? String(note.author._id) : (note?.author ? String(note.author) : null);

  const isOwner = currentUserId && (currentUserId === resourceOwnerId || currentUserId === noteAuthorId);
  const isPrivileged = currentUserRole === 'admin' || currentUserRole === 'faculty';
  const isPublic = note?.isPublic === true;

  if (!isOwner && !isPrivileged && !isPublic) {
    return next(new AppError('You are not authorized to view information for this resource.', 403));
  }

  const uploadsDir = path.resolve(resolveFromRoot('uploads'));
  const filePath = path.resolve(path.join(uploadsDir, targetFileName));

  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return next(new AppError('Invalid file path request.', 400));
  }

  try {
    const stats = await fsPromises.stat(filePath);
    const originalName = resource?.originalName || (note?.title ? `${note.title}${path.extname(targetFileName)}` : targetFileName);
    const safeDownloadName = path.basename(originalName).replace(/[\r\n"\\;,]/g, '_') || targetFileName;
    const mimeType = resource?.mimetype || (note?.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream');

    res.status(200).json({
      status: 'success',
      data: {
        id: resource?._id || note?._id,
        fileName: targetFileName,
        originalName: safeDownloadName,
        mimetype: mimeType,
        sizeBytes: stats.size,
        sizeMB: +(stats.size / 1024 / 1024).toFixed(2),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        downloadCount: note?.downloadCount || 0,
        subject: note?.subject ? {
          id: note.subject._id,
          name: note.subject.name,
          code: note.subject.code
        } : null,
        author: note?.author ? {
          id: note.author._id,
          name: note.author.name,
          email: note.author.email
        } : (resource?.owner ? {
          id: resource.owner._id,
          name: resource.owner.name,
          email: resource.owner.email
        } : null)
      }
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return next(new AppError('The requested file was not found on this server.', 404));
    }
    return next(err);
  }
});

/**
 * List uploaded resources
 * GET /api/v1/resources
 */
export const listResources = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const filter = req.user?.role === 'admin' ? {} : { owner: userId };
  const resources = await Resource.find(filter).populate('owner', 'name email role').sort('-createdAt');
  res.status(200).json({
    status: 'success',
    results: resources.length,
    data: { resources }
  });
});

