/**
 * User Mongoose Model (Course Topic: 59 & 60 - Mongoose Schemas, Validation & Hooks)
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    username: { type: String, trim: true, maxlength: 40, match: [/^[a-zA-Z0-9_-]*$/, 'Username may contain letters, numbers, underscores and hyphens'] },
    university: { type: String, trim: true, maxlength: [150, 'University cannot exceed 150 characters'], default: '' },
    age: { type: Number, min: 13, max: 100, default: null, validate: { validator: value => value == null || Number.isInteger(value), message: 'Age must be a whole number' } },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (val) => emailRegex.test(val),
        message: 'Please provide a valid email address'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Exclude from query results by default for security
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'faculty', 'admin'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'student'
    },
    department: {
      type: String,
      trim: true,
      default: 'Computer Science & AI'
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [8, 'Semester cannot exceed 8'],
      default: 4
    },
    avatar: {
      type: String,
      validate: { validator: value => /^https:\/\//i.test(value), message: 'Avatar must use HTTPS' },
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('year').get(function () { return Math.ceil(this.semester / 2); });

// Mongoose Pre-save Hook: Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

});

// Instance Method: Compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
export default User;
