import { Note } from '../models/Note.js';
import { paginate } from '../utils/pagination.js';

export async function createNote(req, res, next) {
  try {
    const note = await Note.create({ ...req.validated.body, owner: req.user._id });
    res.status(201).json({ note });
  } catch (error) { next(error); }
}

export async function listMyNotes(req, res, next) {
  try {
    res.json(await paginate(Note, { owner: req.user._id }, req.validated.query));
  } catch (error) { next(error); }
}

export async function getNote(req, res, next) {
  try {
    const note = await Note.findOne({ _id: req.validated.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ error: { message: 'Note not found' } });
    res.json({ note });
  } catch (error) { next(error); }
}

export async function updateNote(req, res, next) {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.validated.params.id, owner: req.user._id },
      req.validated.body,
      { new: true, runValidators: true },
    );
    if (!note) return res.status(404).json({ error: { message: 'Note not found' } });
    res.json({ note });
  } catch (error) { next(error); }
}

export async function deleteNote(req, res, next) {
  try {
    const note = await Note.findOneAndDelete({ _id: req.validated.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ error: { message: 'Note not found' } });
    res.status(204).end();
  } catch (error) { next(error); }
}
