/**
 * Node.js Core Architecture & Features Demonstration
 * Topics Covered:
 * - 50: V8 Engine, Global Objects, Event Loop, Call Stack, Callback Queue, Non-blocking I/O
 * - 51: Modules (ESM), File System (fs), Path Module
 * - 52: Buffers, Streams, EventEmitter, Error Handling
 */
import os from 'os';
import { activityEmitter } from '../events/activityEmitter.js';
import { analyzeBuffer } from '../utils/streamHelper.js';
import { resolveFromRoot, inspectFile } from '../utils/pathHelper.js';

console.log('='.repeat(60));
console.log('🎓 CampusHub: Node.js Core Architecture & Runtime Demo');
console.log('='.repeat(60));

// 1. V8 Engine & Global Objects Inspection
console.log('\n[1] V8 Engine & Runtime Global Objects:');
console.log(`- Node.js Version: ${process.version}`);
console.log(`- V8 Engine Version: ${process.versions.v8}`);
console.log(`- Operating System: ${os.type()} ${os.arch()} (${os.platform()})`);
console.log(`- Process ID (PID): ${process.pid}`);
console.log(`- Memory Usage (Heap Used): ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

// 2. Path Module
console.log('\n[2] Path Module Resolution:');
const sampleFile = inspectFile('DBMS_Unit1_LectureNotes.pdf');
console.log(`- Safe Generated Name: ${sampleFile.safeName}`);
console.log(`- Extension: ${sampleFile.ext}`);
console.log(`- Resolved Path: ${resolveFromRoot('uploads', sampleFile.safeName)}`);

// 3. Buffers
console.log('\n[3] Buffers & Binary Data:');
const bufferStats = analyzeBuffer('CampusHub - Collaborative Student Learning');
console.log(`- String: "${bufferStats.originalText}"`);
console.log(`- Byte Length: ${bufferStats.byteLength} bytes`);
console.log(`- Hex Format: ${bufferStats.hexRepresentation.slice(0, 32)}...`);
console.log(`- Base64 Format: ${bufferStats.base64Representation.slice(0, 32)}...`);

// 4. EventEmitter
console.log('\n[4] Event-Driven Architecture (EventEmitter):');
activityEmitter.logActivity('DEMO_RUN', {
  action: 'Run core architecture demonstration',
  userId: 'student_admin'
});
console.log('- Emitted "activity:log" event successfully to CampusActivityEmitter.');

// 5. Event Loop, Call Stack & Task Queues (Microtask vs Macrotask)
console.log('\n[5] Event Loop Phases (Call Stack -> Microtasks -> Macrotasks):');
console.log('  [A] Synchronous 1 (Call Stack)');

setTimeout(() => {
  console.log('  [F] Macrotask: setTimeout 0ms (Timers Phase of Event Loop)');
}, 0);

setImmediate(() => {
  console.log('  [G] Macrotask: setImmediate (Check Phase of Event Loop)');
});

process.nextTick(() => {
  console.log('  [C] Microtask: process.nextTick (Runs immediately after call stack, before promises)');
});

Promise.resolve().then(() => {
  console.log('  [D] Microtask: Promise.then (Microtask queue)');
});

console.log('  [B] Synchronous 2 (Call Stack)');
console.log('\n(Notice the execution order below when asynchronous phases fire!)\n');
