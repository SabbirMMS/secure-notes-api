import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paginationQuery } from '../utils/pagination.js';
import { createPost, deletePost, listPosts } from '../controllers/postController.js';

const router = Router();
const empty = z.object({}).strict();
const idParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).strict();
const postBody = z.object({ title: z.string().trim().min(1), content: z.string().min(1) }).strict();

router.get('/', validate({ body: empty, query: paginationQuery.strict(), params: empty }), listPosts);
router.post('/', auth, validate({ body: postBody, query: empty, params: empty }), createPost);
router.delete('/:id', auth, validate({ body: empty, query: empty, params: idParams }), deletePost);

export default router;
