/**
 * Subject Mongoose Model (Course Topic: 59 & 60 - Mongoose Schemas & Indexing)
 */
import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Subject code is required (e.g. 24CAI0303)'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [15, 'Subject code cannot exceed 15 characters']
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [3, 'Subject name must be at least 3 characters'],
      maxlength: [120, 'Subject name cannot exceed 120 characters']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      default: 'Computer Science & AI'
    },
    semester: {
      type: Number,
      required: [true, 'Semester number is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8']
    },
    credits: {
      type: Number,
      min: [1, 'Minimum credits is 1'],
      max: [6, 'Maximum credits is 6'],
      default: 4
    },
    description: {
      type: String,
      trim: true,
      default: 'Comprehensive university course syllabus and study curriculum.'
    },
    color: {
      type: String,
      default: '#4f46e5' // UI badge accent color
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for high-performance querying and text search
subjectSchema.index({ code: 1, semester: 1 });
subjectSchema.index({ name: 'text', description: 'text', code: 'text' });

export const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
