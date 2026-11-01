/**
 * CampusHub Admin Management CLI Utility
 * Assigns roles (admin, faculty, student) securely to registered accounts.
 *
 * Usage:
 *   node scripts/set-role.js <email> <role>
 *
 * Example:
 *   node scripts/set-role.js test@campushub.in admin
 */
import mongoose from 'mongoose';
import config from '../config/env.js';
import { User } from '../models/User.js';

const [, , email, role] = process.argv;
const validRoles = ['student', 'faculty', 'admin'];

if (!email || !role) {
  console.log('\nUsage: node scripts/set-role.js <email> <role>');
  console.log(`Supported roles: ${validRoles.join(', ')}\n`);
  process.exit(1);
}

const targetRole = role.toLowerCase().trim();
if (!validRoles.includes(targetRole)) {
  console.error(`\nInvalid role "${role}". Supported roles: ${validRoles.join(', ')}\n`);
  process.exit(1);
}

try {
  await mongoose.connect(config.mongoUri);
  console.log('[Database] Connected to MongoDB.');

  const targetEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: targetEmail });

  if (!user) {
    console.error(`\nNo user account found with email: "${email}"\n`);
    process.exit(1);
  }

  const prevRole = user.role;
  user.role = targetRole;
  await user.save();

  console.log(`\nSuccessfully updated user role:`);
  console.log(`  User:    ${user.name} (${user.email})`);
  console.log(`  Change:  [${prevRole}] -> [${user.role}]\n`);
} catch (err) {
  console.error('\nFailed to update user role:', err.message, '\n');
  process.exit(1);
} finally {
  await mongoose.disconnect();
}
