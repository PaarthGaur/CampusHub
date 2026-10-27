/**
 * Bookmark Mongoose Model (Course Topic: 59 & 60 - Mongoose Schemas & Relations)
 * Allows students to bookmark and pin Notes or Subjects for fast access.
 */
import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bookmark must belong to a user']
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      default: null
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },
    folder: {
      type: String,
      trim: true,
      default: 'General'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicate bookmarking of the exact same note by the same user
bookmarkSchema.index({ user: 1, note: 1 }, { unique: true, partialFilterExpression: { note: { $type: 'objectId' } } });

bookmarkSchema.index({ user: 1, subject: 1 }, { unique: true, partialFilterExpression: { subject: { $type: 'objectId' } } });
export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
