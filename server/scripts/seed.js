
import mongoose from 'mongoose';
import config from '../config/env.js';
import { Subject } from '../models/index.js';

const initialSubjects = [
  {
    code: 'CS501',
    name: 'Database Management Systems',
    department: 'Computer Science & AI',
    semester: 5,
    credits: 4,
    description: 'Database design, relational models, SQL, normalization, transactions and ACID properties.',
    color: '#3b82f6',
    tags: ['DBMS', 'SQL', 'Relational', 'Normalization']
  },
  {
    code: '24CAI0303',
    name: 'Back End Engineering',
    department: 'Computer Science & AI',
    semester: 4,
    credits: 4,
    description: 'Node.js runtime, asynchronous architecture, Express.js REST APIs, Mongoose data modeling and JWT security.',
    color: '#10b981',
    tags: ['Node.js', 'Express', 'MongoDB', 'REST API', 'Backend']
  },
  {
    code: 'CS502',
    name: 'Computer Networks',
    department: 'Computer Science & AI',
    semester: 5,
    credits: 4,
    description: 'OSI and TCP/IP reference models, routing algorithms, transport layer protocols and network security.',
    color: '#8b5cf6',
    tags: ['Networking', 'TCP/IP', 'Routing', 'Security']
  },
  {
    code: 'CS503',
    name: 'Theory of Computation',
    department: 'Computer Science & AI',
    semester: 5,
    credits: 3,
    description: 'Finite automata, regular expressions, context-free grammars, pushdown automata and Turing machines.',
    color: '#f59e0b',
    tags: ['Automata', 'TOC', 'Grammars', 'Turing Machines']
  }
];

export async function seedDatabase() {
  if (config.isProd) throw new Error('Demo seed is disabled in production.');
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected successfully.');

    // 2. Seed Subjects
    for (const subData of initialSubjects) {
      const existing = await Subject.findOne({ code: subData.code });
      if (!existing) {
        const createdSub = await Subject.create(subData);
        console.log(`[Seed] Created Subject: ${createdSub.code} - ${createdSub.name}`);

      }
    }

    console.log('\n✅ Database seeding completed successfully!\n');
  } catch (err) {
    console.error('[Seed Error]: Could not seed subjects. Check MongoDB and MONGO_URI.');
    process.exitCode=1;
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
}

// Allow running directly via CLI: node scripts/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
