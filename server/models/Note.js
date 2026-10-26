/**
 * Note Mongoose Model (Course Topic: 59 & 60 - Mongoose Relations & Populate)
 * Stores academic notes, lecture slides, and student resources linked to Subject and User.
 */
import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: 'Course study material and lecture reference.'
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'A note must belong to a specific Subject']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A note must have an author User']
    },
    unit: {
      type: Number,
      min: [1, 'Unit must be at least 1'],
      max: [10, 'Unit cannot exceed 10'],
      default: 1
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: 0
    },
    fileType: {
      type: String,
      default: 'pdf'
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for relationship lookup and full-text search
noteSchema.index({ subject: 1, author: 1 });
noteSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Note = mongoose.model('Note', noteSchema);
export default Note;
