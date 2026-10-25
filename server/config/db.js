/**
 * Database Connection Configuration (Course Topic: 59 & 60 - MongoDB & Mongoose)
 * Establishes and monitors connection to MongoDB/MongoDB Atlas using Mongoose.
 */
import mongoose from 'mongoose';
import config from './env.js';

let isConnected = false;

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
    console.error(`[MongoDB] Connection Warning: ${error.message}`);
    console.warn(`[MongoDB] Hint: Set a valid MONGO_URI in server/.env (e.g. MongoDB Atlas connection string or local MongoDB service)`);
  }
}

// Connection lifecycle event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[MongoDB Event] Connection established.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Event] Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB Event] Connection disconnected.');
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
