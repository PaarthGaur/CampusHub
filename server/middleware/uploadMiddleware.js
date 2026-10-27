import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import config from '../config/env.js';
import { resolveFromRoot } from '../utils/pathHelper.js';
import { Resource } from '../models/Resource.js';
import AppError from '../utils/appError.js';

const mimeTypes = {
  '.pdf': 'application/pdf', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain',
  '.doc': 'application/msword', '.ppt': 'application/vnd.ms-powerpoint',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

// Inspect bytes, extension and MIME together; never execute or unpack documents.
export function validStudyFile(bytes, extension, mimetype) {
  if (mimeTypes[extension] !== mimetype || bytes.length === 0) return false;
  const starts = hex => bytes.subarray(0, hex.length / 2).equals(Buffer.from(hex, 'hex'));
  switch (extension) {
    case '.pdf': return bytes.subarray(0, 5).toString() === '%PDF-';
    case '.png': return starts('89504e470d0a1a0a');
    case '.jpg': case '.jpeg': return starts('ffd8ff');
    case '.txt':
      try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); return !bytes.includes(0); }
      catch { return false; }
    case '.doc': case '.ppt': return starts('d0cf11e0a1b11ae1');
    case '.docx': case '.pptx':
      return starts('504b0304') && bytes.includes(Buffer.from('[Content_Types].xml')) &&
        bytes.includes(Buffer.from(extension === '.docx' ? 'word/' : 'ppt/'));
    default: return false;
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024, files: 1, fields: 12 }
});

export const uploadStudyFile = (req, res, next) => upload.single('file')(req, res, async error => {
  if (error) return next(error);
  if (!req.file) return next();
  const file = req.file;
  const bytes = file.buffer;
  const extension = path.extname(file.originalname).toLowerCase();
  if (!validStudyFile(bytes, extension, file.mimetype)) {
    return next(new AppError('File content, extension and MIME type must match a supported study document.', 400));
  }
  file.filename = randomUUID() + extension;
  file.path = resolveFromRoot('uploads', file.filename);
  delete file.buffer;
  try {
    await writeFile(file.path, bytes, { flag: 'wx' });
    await Resource.create({
      owner: req.user._id,
      fileName: file.filename,
      originalName: path.basename(file.originalname).replace(/[\r\n"\\]/g, '_').slice(0, 150),
      fileSize: file.size,
      mimetype: file.mimetype
    });
    // Only clean up orphaned uploads when the response ends with an error status.
    // NOTE: res.writableFinished is always false inside a 'finish' handler (it
    // becomes true after the event fires), so we rely solely on statusCode.
    const cleanup = () => {
      if (res.statusCode >= 400) {
        Promise.all([unlink(file.path), Resource.deleteOne({ fileName: file.filename })])
          .catch(() => console.error('[Upload] Cleanup failed.'));
      }
    };
    res.once('finish', cleanup);
    res.once('close', () => { if (!res.writableFinished) cleanup(); });
    next();
  } catch (err) {
    await unlink(file.path).catch(() => {});
    next(err);
  }
});

export default upload;
