import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

// Supports owner filtering and newest-first notes in one index scan.
noteSchema.index({ owner: 1, _id: -1 });

export const Note = mongoose.model('Note', noteSchema);
