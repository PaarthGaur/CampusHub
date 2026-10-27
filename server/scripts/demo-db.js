
import mongoose from 'mongoose';
import config from '../config/env.js';
import { User, Subject, Note } from '../models/index.js';

console.log('='.repeat(65));
console.log('🎓 CampusHub:MongoDB & Mongoose Demo');
console.log('='.repeat(65));

async function runDemo() {
  if(config.isProd) throw new Error('Database demo must only run against a development database.');
  // 1. Demonstration of Mongoose Schemas & In-Memory Validation (Offline/Standalone)
  console.log('\n[1] Mongoose Schema Validation (Negative Validation Tests):');
  try {
    const invalidUser = new User({
      name: 'A', // too short (< 2 chars)
      email: 'not-an-email', // invalid regex pattern
      password: '123' // too short (< 6 chars)
    });
    await invalidUser.validate();
  } catch (validationErr) {
    console.log('✅ Mongoose Schema Validator correctly caught invalid input:');
    for (const field in validationErr.errors) {
      console.log(`   - Field [${field}]: ${validationErr.errors[field].message}`);
    }
  }

  // Positive Validation Test
  console.log('\n[2] Mongoose Schema Validation (Positive Validation Test):');
  const validUser = new User({
    name: 'Aman Verma',
    email: 'aman.verma@campushub.edu',
    password: 'securePassword123',
    role: 'student',
    semester: 4
  });
  await validUser.validate();
  console.log(`✅ Valid document passed validation: ${validUser.name} (${validUser.email})`);

  // 3. Live Connection & CRUD Operations
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log(`✅ Connected successfully to: ${mongoose.connection.host}`);

    // 3. CRUD - CREATE
    console.log('\n[3] CRUD - CREATE:');
    const demoSubject = await Subject.findOneAndUpdate(
      { code: 'TEST101' },
      {
        code: 'TEST101',
        name: 'Cloud Computing & Microservices',
        department: 'Computer Science',
        semester: 6,
        credits: 4,
        description: 'Virtualization, Docker, Kubernetes and Serverless Architectures'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`- Created/Upserted Subject: [${demoSubject.code}] ${demoSubject.name}`);

    let demoUser = await User.findOne({ email: 'demo.student@campushub.edu' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Priya Sharma',
        email: 'demo.student@campushub.edu',
        password: 'securePassword2026', // Bcrypt hook will salt and hash this
        role: 'student',
        semester: 6
      });
      console.log(`- Created User with hashed password: ${demoUser.name} (${demoUser.email})`);
    }

    const demoNote = await Note.create({
      title: 'Docker & Containerization Cheatsheet',
      description: 'Quick reference for Dockerfile commands and multi-stage builds',
      subject: demoSubject._id,
      author: demoUser._id,
      unit: 2,
      tags: ['Docker', 'Containers', 'DevOps']
    });
    console.log(`- Created Note referencing Subject and User IDs: "${demoNote.title}"`);

    // 4. CRUD - READ with .POPULATE()
    console.log('\n[4] CRUD - READ with Mongoose .populate():');
    const populatedNote = await Note.findById(demoNote._id)
      .populate('author', 'name email role department')
      .populate('subject', 'name code semester credits');

    console.log('✅ Populated Note Document:');
    console.log({
      noteId: populatedNote._id,
      title: populatedNote.title,
      author: populatedNote.author,
      subject: populatedNote.subject
    });

    // 5. CRUD - UPDATE
    console.log('\n[5] CRUD - UPDATE:');
    const updatedNote = await Note.findByIdAndUpdate(
      demoNote._id,
      { $inc: { downloadCount: 1 }, $push: { tags: 'Cheatsheet' } },
      { new: true }
    );
    console.log(`- Updated downloadCount to: ${updatedNote.downloadCount}`);
    console.log(`- Updated tags: [${updatedNote.tags.join(', ')}]`);

    // 6. CRUD - DELETE
    console.log('\n[6] CRUD - DELETE:');
    await Note.findByIdAndDelete(demoNote._id);
    await Subject.findByIdAndDelete(demoSubject._id);
    console.log(`- Deleted test Note and test Subject successfully.`);

    console.log('\n='.repeat(65));
    console.log('🎉 MongoDB & Mongoose All Topics Verified Successfully!');
    console.log('='.repeat(65) + '\n');
  } catch (err) {
    console.error('\n❌ MongoDB Demo Error:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.name === 'MongooseServerSelectionError') {
      console.log('\n💡 Note: To run live queries, MongoDB needs to be active on MONGO_URI.');
      console.log('   You can provide your free MongoDB Atlas URI in server/.env, or start your local MongoDB service.');
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runDemo();
