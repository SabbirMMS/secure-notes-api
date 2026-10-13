import bcrypt from 'bcryptjs';
import { Note } from '../models/Note.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { paginate } from '../utils/pagination.js';
import { publicUser } from '../utils/publicUser.js';

export async function listAllNotes(req, res, next) {
  try {
    const filter = req.validated.query.owner ? { owner: req.validated.query.owner } : {};
    res.json(await paginate(Note, filter, req.validated.query));
  } catch (error) { next(error); }
}

export async function createUser(req, res, next) {
  try {
    const { password, ...fields } = req.validated.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ ...fields, passwordHash });
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: { message: 'Email already in use' } });
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const filter = req.validated.query.email ? { email: req.validated.query.email } : {};
    res.json(await paginate(User, filter, req.validated.query));
  } catch (error) { next(error); }
}

export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.validated.params.id);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
}

export async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.validated.params.id);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

    const { password, ...fields } = req.validated.body;
    if (user._id.equals(req.user._id) && fields.role === 'user') {
      return res.status(403).json({ error: { message: 'Cannot demote yourself' } });
    }

    Object.assign(user, fields);
    if (password) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: { message: 'Email already in use' } });
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = req.validated.params.id;
    if (req.user._id.equals(id)) {
      return res.status(403).json({ error: { message: 'Cannot delete yourself' } });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

    await Promise.all([Note.deleteMany({ owner: id }), Post.deleteMany({ author: id })]);
    await User.deleteOne({ _id: id });
    res.status(204).end();
  } catch (error) { next(error); }
}
