/**
 * CampusHub Backend - Main Server Entry Point
 * Node.js, Express, MongoDB & Frontend Integration
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/env.js';
import { connectDB, getDBStatus } from './config/db.js';
import { resolveFromRoot } from './utils/pathHelper.js';
import { ensureDirectories } from './utils/fileSystem.js';
import { activityEmitter } from './events/activityEmitter.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './middleware/errorMiddleware.js';

// Modular REST Routers
import assistantRoutes from './routes/assistantRoutes.js';
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';

// Resolve paths using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize MongoDB connection
connectDB();

// ==========================================
// 1. Directory Initialization
// ==========================================

const requiredDirs = [
  resolveFromRoot('uploads'),
  resolveFromRoot('logs')
];

await ensureDirectories(requiredDirs);

// ==========================================
// 2. Middleware Configuration
// ==========================================

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || false }));
app.disable('x-powered-by');
app.use((req,res,next) => { res.setHeader('X-Content-Type-Options','nosniff'); next(); });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  if (req.is('application/json') && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return next(new AppError('JSON body must be an object.', 400));
  next();
});

if (config.isDev) {
  app.use(morgan(':method :status :response-time ms', { skip: req => req.path.startsWith('/api/v1/auth') }));
} else {
  app.use(morgan(':method :status :response-time ms'));
}

// Custom request logger
app.use((req, res, next) => {
  res.on('finish', () => {
    activityEmitter.logActivity('HTTP_REQUEST', {
      action: `${req.method} ${req.path}`,
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
// 3. Frontend Static Files
// ==========================================

// Frontend HTML files are in the CampusHub root directory,
// one level above the server directory.
const frontendPath = path.resolve(__dirname, '..');

// Serve CSS, JavaScript, images and other static assets.
for (const dir of ['css','js']) app.use('/' + dir, express.static(path.join(frontendPath, dir), { dotfiles: 'deny', index: false }));
const pages = ['index(1)','login','signup','dashboard','subjects','subject-details','notes','bookmarks','resources','settings','ai_assistant','sidebar'];
for (const page of pages) app.get(page === 'index(1)' ? /^\/index\(1\)\.html$/ : '/' + page + '.html', (req,res) => res.sendFile(path.join(frontendPath, page + '.html')));
app.get('/index.html', (req,res) => res.redirect('/'));

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index(1).html'));
});

// ==========================================
// 4. Health Check
// ==========================================

app.get('/api/health', (req, res) => {
  const memory = process.memoryUsage();
  const dbStatus = getDBStatus();

  res.status(dbStatus.readyState === 1 ? 200 : 503).json({
    status: dbStatus.readyState === 1 ? 'healthy' : 'degraded',
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
// 5. REST API Routes
// ==========================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/resources', resourceRoutes);

// ==========================================
// 6. Curriculum Topics Endpoint
// ==========================================

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
        concepts: [
          'V8 Engine',
          'Global Objects',
          'Event Loop',
          'Call Stack',
          'Non-blocking I/O'
        ],
        demoScript: 'npm run demo:core'
      },
      {
        topic: 51,
        title: 'Node Modules & File System',
        concepts: [
          'ES Modules',
          'fs & fs/promises',
          'path module',
          'Directory initialization'
        ],
        implementation: [
          'server/utils/pathHelper.js',
          'server/utils/fileSystem.js'
        ]
      },
      {
        topic: 52,
        title: 'Buffers, Streams & EventEmitter',
        concepts: [
          'Buffer allocation and encoding',
          'Readable and writable streams',
          'Custom EventEmitter'
        ],
        implementation: [
          'server/utils/streamHelper.js',
          'server/events/activityEmitter.js'
        ]
      },
      {
        topic: 53,
        title: 'HTTP Module & Server Foundations',
        concepts: [
          'http.createServer',
          'Request-Response Lifecycle',
          'Manual routing'
        ],
        demoScript: 'npm run demo:http'
      },
      {
        topic: 54,
        title: 'NPM, package.json, Nodemon & Environment Variables',
        concepts: [
          'package.json scripts',
          'nodemon hot-reloading',
          'dotenv configuration'
        ],
        implementation: [
          'server/config/env.js',
          'server/package.json',
          'server/.env'
        ]
      },
      {
        topic: '59-60',
        title: 'MongoDB, Atlas, CRUD Operations & Mongoose',
        concepts: [
          'MongoDB & Atlas Connection',
          'Mongoose Schemas & Types',
          'Built-in & Custom Validation',
          'Schema Hooks and Bcrypt password hashing',
          'Relational Modeling and populate()',
          'CRUD Operations'
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
        title: 'Multer File Uploads & API Testing',
        concepts: [
          'Multipart/form-data upload handling',
          'DiskStorage and filename sanitization',
          'MIME-type filtering and size validation',
          'Node Streams for file downloads',
          'Postman collection and automated assertions'
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
// 7. 404 Handler
// ==========================================

// Express 5-compatible catch-all
app.use((req, res, next) => {
  next(
    new AppError(
      `Cannot find ${req.originalUrl} on this server.`,
      404
    )
  );
});

// ==========================================
// 8. Global Error Handler
// ==========================================

app.use(globalErrorHandler);

// ==========================================
// 9. Server Startup
// ==========================================

const server = app.listen(config.port, () => {
  console.log('\n🚀 CampusHub Server successfully started!');
  console.log(`📡 Environment: ${config.env}`);
  console.log(`🌐 Website: http://localhost:${config.port}`);
  console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`📚 Topics Index: http://localhost:${config.port}/api/topics`);
  console.log(`📂 Frontend directory: ${frontendPath}\n`);
});

// ==========================================
// 10. Graceful Shutdown
// ==========================================

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');

  server.close(async () => { await (await import('mongoose')).default.disconnect(); process.exit(0); });
});

server.on('error', err => { console.error(err.code === 'EADDRINUSE' ? '[Server] Port is already in use. Stop the other server or set PORT.' : '[Server] Failed to listen.'); process.exit(1); });

export default app;
