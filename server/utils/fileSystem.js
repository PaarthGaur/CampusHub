/**
 * Node.js File System Module Utility (Course Topic: 51 - File System fs)
 * Demonstrates asynchronous non-blocking file operations, directory creation, and error handling.
 */
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

/**
 * Ensures required project directories exist asynchronously (non-blocking)
 * @param {string[]} directories 
 */
export async function ensureDirectories(directories) {
  for (const dir of directories) {
    try {
      await fsPromises.access(dir, fs.constants.F_OK);
    } catch {
      // Directory doesn't exist, create it recursively
      await fsPromises.mkdir(dir, { recursive: true });
      console.log(`[FileSystem] Created directory: ${path.normalize(dir)}`);
    }
  }
}

/**
 * Safely writes JSON content asynchronously
 * @param {string} filePath 
 * @param {object} data 
 */
export async function writeJsonFile(filePath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  await fsPromises.writeFile(filePath, jsonString, 'utf-8');
}

/**
 * Safely reads and parses JSON content asynchronously
 * @param {string} filePath 
 */
export async function readJsonFile(filePath) {
  try {
    const rawData = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Appends audit/log entries using asynchronous fs
 * @param {string} logFilePath 
 * @param {string} message 
 */
export async function appendLogEntry(logFilePath, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  await fsPromises.appendFile(logFilePath, entry, 'utf-8');
}
