import mongoose from 'mongoose';
import { User } from '../models/User.js';

export async function groupUsersByInterests(req, res, next) {
  try {
    const { interest, page, limit } = req.validated.query;
    const pipeline = [];

    // Uses the interests index to narrow users before unwinding.
    if (interest) pipeline.push({ $match: { interests: interest } });
    // Creates one input document for each user interest.
    pipeline.push({ $unwind: '$interests' });
    // Keeps only the requested interest after unwinding.
    if (interest) pipeline.push({ $match: { interests: interest } });
    // Counts users and collects only safe user fields per interest.
    pipeline.push({ $group: {
      _id: '$interests',
      users: { $push: { _id: '$_id', name: '$name' } },
      count: { $sum: 1 },
    } });
    // Places the largest groups first.
    pipeline.push({ $sort: { count: -1 } });
    // Gets the page and total group count in this one aggregation.
    pipeline.push({ $facet: {
      data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      total: [{ $count: 'count' }],
    } });

    const [result] = await User.aggregate(pipeline);
    const total = result.total[0]?.count ?? 0;
    res.json({ data: result.data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function postsByUser(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.validated.params.id);
    const { page, limit } = req.validated.query;

    const [user] = await User.aggregate([
      // Finds the requested user with the default _id index.
      { $match: { _id: userId } },
      // Uses the author index to fetch one newest-first page plus a lookahead post.
      { $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'author',
        pipeline: [
          { $sort: { _id: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit + 1 },
        ],
        as: 'posts',
      } },
      // Removes email, password data, and other private user fields.
      { $project: { name: 1, interests: 1, posts: 1 } },
    ]);

    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    const hasMore = user.posts.length > limit;
    const posts = user.posts.slice(0, limit);
    res.json({
      data: { user: { _id: user._id, name: user.name, interests: user.interests }, posts },
      pagination: { page, limit, total: null, totalPages: null, hasMore },
    });
  } catch (error) { next(error); }
}
