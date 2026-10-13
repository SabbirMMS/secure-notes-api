import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { paginationQuery } from '../utils/pagination.js';
import { createUser, deleteUser, getUser, listAllNotes, listUsers, updateUser } from '../controllers/adminController.js';
import { groupUsersByInterests } from '../controllers/aggregationController.js';

const router = Router();
const empty = z.object({}).strict();
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const idParams = z.object({ id: objectId }).strict();
const userBody = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']).optional(),
  interests: z.array(z.string().trim().min(1)).optional(),
}).strict();
const patchBody = userBody.partial().refine((body) => Object.keys(body).length > 0);

router.use(auth, requireRole('admin'));
router.get('/notes', validate({ body: empty, query: paginationQuery.extend({ owner: objectId.optional() }).strict(), params: empty }), listAllNotes);
router.post('/users', validate({ body: userBody, query: empty, params: empty }), createUser);
router.get('/users', validate({ body: empty, query: paginationQuery.extend({ email: z.string().trim().email().toLowerCase().optional() }).strict(), params: empty }), listUsers);
router.get('/users/grouped-by-interests', validate({
  body: empty,
  query: paginationQuery.extend({ interest: z.string().trim().min(1).optional() }).strict(),
  params: empty,
}), groupUsersByInterests);
router.get('/users/:id', validate({ body: empty, query: empty, params: idParams }), getUser);
router.patch('/users/:id', validate({ body: patchBody, query: empty, params: idParams }), updateUser);
router.delete('/users/:id', validate({ body: empty, query: empty, params: idParams }), deleteUser);

export default router;
