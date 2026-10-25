/**
 * Node.js Path Module Utility (Course Topic: 51 - Path Module)
 * Demonstrates path resolution, extension extraction, normalization, and ESM __dirname handling.
 */
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Returns __filename and __dirname equivalents for ES Modules
 * @param {string} metaUrl - import.meta.url of the caller
 */
export function getDirname(metaUrl) {
  const filename = fileURLToPath(metaUrl);
  const dirname = path.dirname(filename);
  return { __filename: filename, __dirname: dirname };
}

/**
 * Resolves paths relative to the project root directory
 * @param  {...string} segments - path segments to join
 */
export function resolveFromRoot(...segments) {
  const { __dirname } = getDirname(import.meta.url);
  // Navigates from server/utils to server root, or further up
  return path.resolve(__dirname, '..', ...segments);
}

/**
 * Sanitizes and inspects a file upload path
 * @param {string} originalName 
 */
export function inspectFile(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext);
  const safeName = `${base.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}${ext}`;
  return { ext, base, safeName };
}
