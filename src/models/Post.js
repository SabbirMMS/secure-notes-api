import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

// Supports lookup and newest-first listing of one author's posts.
postSchema.index({ author: 1, _id: -1 });

export const Post = mongoose.model('Post', postSchema);
