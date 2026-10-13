import { Post } from '../models/Post.js';
import { paginate } from '../utils/pagination.js';

export async function createPost(req, res, next) {
  try {
    const post = await Post.create({ ...req.validated.body, author: req.user._id });
    res.status(201).json({ post });
  } catch (error) { next(error); }
}

export async function listPosts(req, res, next) {
  try {
    res.json(await paginate(Post, {}, req.validated.query));
  } catch (error) { next(error); }
}

export async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.validated.params.id);
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });
    if (req.user.role !== 'admin' && !post.author.equals(req.user._id)) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }
    await post.deleteOne();
    res.status(204).end();
  } catch (error) { next(error); }
}
