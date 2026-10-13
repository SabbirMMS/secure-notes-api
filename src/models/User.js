import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    interests: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Supports login, duplicate checks, and admin email search while enforcing uniqueness.
userSchema.index({ email: 1 }, { unique: true });
// Supports the optional interest filter before grouping users by interest.
userSchema.index({ interests: 1 });

export const User = mongoose.model('User', userSchema);
