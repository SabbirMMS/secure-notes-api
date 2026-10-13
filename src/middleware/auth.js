import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function auth(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '');
  if (!match) return res.status(401).json({ error: { message: 'Unauthorized' } });

  try {
    const payload = jwt.verify(match[1], env.JWT_SECRET);
    if (typeof payload !== 'object' || !mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    next(error);
  }
}
