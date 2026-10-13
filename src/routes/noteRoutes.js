import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paginationQuery } from '../utils/pagination.js';
import { createNote, deleteNote, getNote, listMyNotes, updateNote } from '../controllers/noteController.js';

const router = Router();
const empty = z.object({}).strict();
const idParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).strict();
const noteBody = z.object({ title: z.string().trim().min(1), content: z.string().min(1) }).strict();
const patchBody = noteBody.partial().refine((body) => Object.keys(body).length > 0);

router.use(auth);
router.post('/', validate({ body: noteBody, query: empty, params: empty }), createNote);
router.get('/', validate({ body: empty, query: paginationQuery.strict(), params: empty }), listMyNotes);
router.get('/:id', validate({ body: empty, query: empty, params: idParams }), getNote);
router.patch('/:id', validate({ body: patchBody, query: empty, params: idParams }), updateNote);
router.delete('/:id', validate({ body: empty, query: empty, params: idParams }), deleteNote);

export default router;
