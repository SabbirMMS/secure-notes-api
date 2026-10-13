import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';

const result = z.object({
  ADMIN_EMAIL: z.string().trim().email().toLowerCase(),
  ADMIN_PASSWORD: z.string().min(8),
}).safeParse(process.env);

if (!result.success) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to valid values.');
  process.exit(1);
}

try {
  await connectDb();
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = result.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOne({ email });

  if (user) {
    user.role = 'admin';
    user.passwordHash = passwordHash;
    await user.save();
    console.log('Admin updated.');
  } else {
    await User.create({ name: 'Admin', email, passwordHash, role: 'admin' });
    console.log('Admin created.');
  }
} catch (error) {
  console.error('Admin seed failed.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
