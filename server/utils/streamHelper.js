/**
 * Node.js Buffers and Streams Utility (Course Topic: 52 - Buffers, Streams, Error Handling)
 * Demonstrates:
 * 1. Buffer manipulation (alloc, from, toString, byteLength)
 * 2. Readable and Writable Streams for non-blocking I/O
 * 3. Stream pipeline with error handling
 */
import fs from 'fs';
import { pipeline } from 'stream/promises';

/**
 * Creates and inspects memory buffers
 * @param {string} text 
 */
export function analyzeBuffer(text) {
  // Creating buffer from string
  const buf = Buffer.from(text, 'utf-8');
  return {
    originalText: text,
    byteLength: buf.length,
    hexRepresentation: buf.toString('hex'),
    base64Representation: buf.toString('base64'),
    bufferSlice: buf.subarray(0, Math.min(10, buf.length)).toString('utf-8')
  };
}

/**
 * Streams file content chunk-by-chunk to a writable stream (e.g. HTTP response)
 * Prevents loading entire files into V8 heap memory.
 * @param {string} sourceFilePath 
 * @param {import('stream').Writable} destinationStream 
 */
export async function streamFileToOutput(sourceFilePath, destinationStream) {
  const readStream = fs.createReadStream(sourceFilePath, { highWaterMark: 64 * 1024 }); // 64KB chunks
  await pipeline(readStream, destinationStream);
}

/**
 * Copies a file using Streams pipeline with error propagation
 * @param {string} sourcePath 
 * @param {string} destinationPath 
 */
export async function copyFileStream(sourcePath, destinationPath) {
  const readStream = fs.createReadStream(sourcePath);
  const writeStream = fs.createWriteStream(destinationPath);
  await pipeline(readStream, writeStream);
}
