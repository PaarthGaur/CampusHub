/**
 * Database Seed Script (Course Topic: 59 & 60 - MongoDB CRUD & Mongoose Models)
 * Populates MongoDB with standard university subjects, initial student users, and course notes.
 */
import mongoose from 'mongoose';
import config from '../config/env.js';
import { User, Subject, Note } from '../models/index.js';

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
  try {
    console.log(`[Seed] Connecting to MongoDB: ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected successfully.');

    // 1. Seed or find demo student & faculty users
    let faculty = await User.findOne({ email: 'dr.rahul@campushub.edu' });
    if (!faculty) {
      faculty = await User.create({
        name: 'Dr. Rahul Sharma',
        email: 'dr.rahul@campushub.edu',
        password: 'password123', // Will be hashed by pre-save hook
        role: 'faculty',
        department: 'Computer Science & AI'
      });
      console.log(`[Seed] Created Faculty User: ${faculty.name}`);
    }

    let student = await User.findOne({ email: 'student@campushub.edu' });
    if (!student) {
      student = await User.create({
        name: 'Aman Verma',
        email: 'student@campushub.edu',
        password: 'password123',
        role: 'student',
        semester: 5,
        department: 'Computer Science & AI'
      });
      console.log(`[Seed] Created Student User: ${student.name}`);
    }

    // 2. Seed Subjects
    for (const subData of initialSubjects) {
      const existing = await Subject.findOne({ code: subData.code });
      if (!existing) {
        const createdSub = await Subject.create(subData);
        console.log(`[Seed] Created Subject: ${createdSub.code} - ${createdSub.name}`);

        // 3. Seed initial Note for this subject (Demonstrating Relations)
        await Note.create({
          title: `${createdSub.name} - Unit 1 Overview & Notes`,
          description: `Comprehensive lecture notes covering foundational concepts for ${createdSub.code}.`,
          subject: createdSub._id,
          author: faculty._id,
          unit: 1,
          tags: createdSub.tags,
          fileName: `${createdSub.code}_Unit1_Notes.pdf`,
          fileSize: 1024 * 1024 * 2.4, // 2.4 MB
          fileType: 'pdf'
        });
        console.log(`[Seed] Created Note for ${createdSub.code}`);
      }
    }

    console.log('\n✅ Database seeding completed successfully!\n');
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
}

// Allow running directly via CLI: node scripts/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
