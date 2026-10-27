/**
 * Database Connection Configuration (Course Topic: 59 & 60 - MongoDB & Mongoose)
 * Establishes and monitors connection to MongoDB/MongoDB Atlas using Mongoose.
 */
import mongoose from 'mongoose';
import config from './env.js';

let isConnected = false;
let warned = false;

export async function connectDB() {
  if (isConnected) {
    console.log('[MongoDB] Using existing database connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    if (!warned) { console.error('[MongoDB] Connection unavailable. Start MongoDB or configure MONGO_URI in server/.env. Retrying in the background.'); warned = true; }
    const retry = setTimeout(connectDB, 10000); retry.unref();

  }
}

// Connection lifecycle event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  warned = false;
  console.log('[MongoDB Event] Connection established.');
});

mongoose.connection.on('error', (err) => {
  if (isConnected) console.error('[MongoDB Event] Connection error. Check database configuration.');
});

mongoose.connection.on('disconnected', () => {
  if (isConnected) console.warn('[MongoDB Event] Connection disconnected.');
  isConnected = false;
});

export function getDBStatus() {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  return {
    state: stateMap[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null
  };
}

export default connectDB;
