/**
 * Node.js EventEmitter Implementation (Course Topic: 52 - EventEmitter)
 * Implements an application-wide event bus for CampusHub real-time event broadcasting
 * and asynchronous decoupled event handling.
 */
import { EventEmitter } from 'events';
import { appendLogEntry } from '../utils/fileSystem.js';
import { resolveFromRoot } from '../utils/pathHelper.js';

class CampusActivityEmitter extends EventEmitter {
  constructor() {
    super();
    // Configure max listeners to avoid memory leak warnings
    this.setMaxListeners(20);
    this.initDefaultListeners();
  }

  initDefaultListeners() {
    // Audit logging listener
    this.on('activity:log', async (data) => {
      const logPath = resolveFromRoot('logs', 'activities.log');
      const message = `[EVENT: ${data.type}] User: ${data.userId || 'Guest'} | Action: ${data.action} | Detail: ${JSON.stringify(data.meta || {})}`;
      try {
        await appendLogEntry(logPath, message);
      } catch (err) {
        console.error('[ActivityEmitter] Failed to persist log:', err.message);
      }
    });

    // Error handling listener on EventEmitter
    this.on('error', (err) => {
      console.error('[ActivityEmitter Error Captured]:', err);
    });
  }

  /**
   * Helper method to emit activity events
   * @param {string} type 
   * @param {object} payload 
   */
  logActivity(type, payload = {}) {
    this.emit('activity:log', { type, ...payload, timestamp: Date.now() });
  }
}

export const activityEmitter = new CampusActivityEmitter();
export default activityEmitter;
