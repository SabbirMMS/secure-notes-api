import mongoose from 'mongoose';
import { env } from './env.js';
import { User } from '../models/User.js';
import { Note } from '../models/Note.js';
import { Post } from '../models/Post.js';

export async function connectDb() {
  await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
  await Promise.all([User.init(), Note.init(), Post.init()]);
}
