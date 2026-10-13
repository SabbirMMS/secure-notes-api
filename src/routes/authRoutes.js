import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { login, me, register } from '../controllers/authController.js';

const router = Router();
const empty = z.object({}).strict();
const email = z.string().trim().email().toLowerCase();

router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: { message: 'Too many requests' } }),
}));

router.post('/register', validate({
  body: z.object({
    name: z.string().trim().min(1),
    email,
    password: z.string().min(8),
    interests: z.array(z.string().trim().min(1)).optional(),
  }),
  query: empty,
  params: empty,
}), register);

router.post('/login', validate({
  body: z.object({ email, password: z.string().min(1) }).strict(),
  query: empty,
  params: empty,
}), login);

router.get('/me', validate({ body: empty, query: empty, params: empty }), auth, me);

export default router;
