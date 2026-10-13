import { Router } from 'express';
import { z } from 'zod';
import { postsByUser } from '../controllers/aggregationController.js';
import { validate } from '../middleware/validate.js';
import { paginationQuery } from '../utils/pagination.js';

const router = Router();
const empty = z.object({}).strict();
const idParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).strict();

router.get('/:id/posts', validate({ body: empty, query: paginationQuery.strict(), params: idParams }), postsByUser);

export default router;
