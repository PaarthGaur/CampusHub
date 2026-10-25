/**
 * CampusHub Backend - Main Server Entry Point
 * Phase 1: Node.js Foundation, Environment Configuration & Express Architecture
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/env.js';
import { connectDB, getDBStatus } from './config/db.js';
import { resolveFromRoot } from './utils/pathHelper.js';
import { ensureDirectories } from './utils/fileSystem.js';
import { activityEmitter } from './events/activityEmitter.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './middleware/errorMiddleware.js';

// Modular REST Routers
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';

const app = express();

// Initialize MongoDB Connection (Topic 59 & 60)
connectDB();

// ==========================================
// 1. Directory Initialization (fs & path)
// ==========================================
const requiredDirs = [
  resolveFromRoot('uploads'),
  resolveFromRoot('logs')
];

await ensureDirectories(requiredDirs);

// ==========================================
// 2. Middleware Configuration
// ==========================================
// Enable CORS for frontend integration
app.use(cors());

// Body Parsers (built-in express middleware)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Custom request logger connected to EventEmitter
app.use((req, res, next) => {
  res.on('finish', () => {
    activityEmitter.logActivity('HTTP_REQUEST', {
      action: `${req.method} ${req.originalUrl}`,
      meta: {
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
  });
  next();
});

// ==========================================
// 3. Foundation Routes (Topics 53, 54, 55, 56)
// ==========================================

// Base welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'CampusHub Backend API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/topics',
    healthCheck: '/api/health'
  });
});

// Health check endpoint displaying V8, Node runtime metrics, and Database state
app.get('/api/health', (req, res) => {
  const memory = process.memoryUsage();
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    nodeRuntime: {
      version: process.version,
      v8Version: process.versions.v8,
      platform: process.platform,
      arch: process.arch
    },
    memoryUsageMB: {
      rss: +(memory.rss / 1024 / 1024).toFixed(2),
      heapTotal: +(memory.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: +(memory.heapUsed / 1024 / 1024).toFixed(2),
      external: +(memory.external / 1024 / 1024).toFixed(2)
    }
  });
});

// ==========================================
// 4. REST API Route Mounting (Topics 55, 56, 57, 58)
// ==========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/resources', resourceRoutes);

// Curriculum topics coverage route
app.get('/api/topics', (req, res) => {
  res.status(200).json({
    course: 'Back End Engineering (24CAI0303)',
    completedPhases: [
      'Phase 1: Node.js Foundation & Environment Setup',
      'Phase 2: MongoDB Connection & Mongoose Data Models',
      'Phase 3: REST API Architecture & Express Routing',
      'Phase 4: Authentication, Security & Error Handling Middleware',
      'Phase 5: Multer File Uploads & Node Streaming I/O',
      'Phase 6: Frontend Integration & Postman API Testing'
    ],
    implementedTopics: [
      {
        topic: 50,
        title: 'Introduction to Node.js & Architecture',
        concepts: ['V8 Engine', 'Global Objects', 'Event Loop', 'Call Stack', 'Non-blocking I/O'],
        demoScript: 'npm run demo:core'
      },
      {
        topic: 51,
        title: 'Node Modules & File System',
        concepts: ['ES Modules', 'fs & fs/promises', 'path module', 'Directory initialization'],
        implementation: ['server/utils/pathHelper.js', 'server/utils/fileSystem.js']
      },
      {
        topic: 52,
        title: 'Buffers, Streams & EventEmitter',
        concepts: ['Buffer alloc & encoding', 'Readable/Writable Streams', 'Custom EventEmitter'],
        implementation: ['server/utils/streamHelper.js', 'server/events/activityEmitter.js']
      },
      {
        topic: 53,
        title: 'HTTP Module & Server Foundations',
        concepts: ['http.createServer', 'Request-Response Lifecycle', 'Manual routing'],
        demoScript: 'npm run demo:http'
      },
      {
        topic: 54,
        title: 'NPM, package.json, Nodemon & Environment Variables',
        concepts: ['package.json scripts', 'nodemon hot-reloading', 'dotenv configuration'],
        implementation: ['server/config/env.js', 'server/package.json', 'server/.env']
      },
      {
        topic: '59-60',
        title: 'MongoDB, Atlas, CRUD Operations & Mongoose',
        concepts: [
          'MongoDB & Atlas Connection',
          'Mongoose Schemas & Types',
          'Built-in & Custom Validation (Regex, Enums, Min/Max)',
          'Schema Hooks (Bcrypt password hashing pre-save)',
          'Relational Modeling & .populate()',
          'CRUD Operations (Create, Read, Update, Delete)'
        ],
        implementation: [
          'server/config/db.js',
          'server/models/User.js',
          'server/models/Subject.js',
          'server/models/Note.js',
          'server/models/Bookmark.js'
        ],
        demoScript: 'npm run demo:db',
        seedScript: 'npm run seed'
      },
      {
        topic: 58,
        title: 'Multer File Uploads & API Testing using Postman',
        concepts: [
          'Multipart/form-data upload handling',
          'DiskStorage & filename sanitization',
          'MIME-type filtering & size validation',
          'Node Streams (fs.createReadStream) for efficient file streaming',
          'Postman collection with automated test assertions'
        ],
        implementation: [
          'server/middleware/uploadMiddleware.js',
          'server/controllers/resourceController.js',
          'server/routes/resourceRoutes.js',
          'server/tests/postman/CampusHub.postman_collection.json'
        ]
      }
    ]
  });
});

// ==========================================
// 5. 404 Catch-all Handler & Error Middleware
// ==========================================
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// Centralized Global Error Handler
app.use(globalErrorHandler);

// ==========================================
// 5. Server Startup
// ==========================================
const server = app.listen(config.port, () => {
  console.log(`\n🚀 CampusHub Server successfully started!`);
  console.log(`📡 Environment: ${config.env}`);
  console.log(`🌐 URL: http://localhost:${config.port}`);
  console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`📚 Topics Index: http://localhost:${config.port}/api/topics\n`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});

export default app;
