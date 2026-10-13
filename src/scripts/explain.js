import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { Note } from '../models/Note.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';

function visit(value, fn) {
  if (!value || typeof value !== 'object') return;
  fn(value);
  for (const child of Object.values(value)) visit(child, fn);
}

function printExplain(label, result) {
  let winningPlan;
  let stats;
  const indexes = new Set();

  visit(result, (part) => {
    if (!winningPlan && part.queryPlanner?.winningPlan) winningPlan = part.queryPlanner.winningPlan;
    if (!stats && part.executionStats) stats = part.executionStats;
  });

  visit(winningPlan, (part) => {
    if (part.indexName) indexes.add(part.indexName);
  });
  visit(result, (part) => {
    if (Array.isArray(part.indexesUsed)) part.indexesUsed.forEach((name) => indexes.add(name));
  });

  const stage = winningPlan?.stage ?? winningPlan?.queryPlan?.stage ?? stats?.executionStages?.stage ?? 'unknown';
  const pipelineStages = result.stages ?? [];
  const cursorDocs = pipelineStages.reduce((sum, part) => sum + (part.$cursor?.executionStats?.totalDocsExamined ?? 0), 0);
  const lookupDocs = pipelineStages.reduce((sum, part) => sum + (part.$lookup?.totalDocsExamined ?? 0), 0);
  const totalDocsExamined = pipelineStages.length ? cursorDocs + lookupDocs : stats?.totalDocsExamined ?? 0;
  const nReturned = pipelineStages.at(-1)?.nReturned ?? stats?.nReturned ?? 0;

  console.log(`${label}: stage=${stage}, index=${[...indexes].join(', ') || 'none'}, totalDocsExamined=${totalDocsExamined}, nReturned=${nReturned}`);
}

async function explain(label, query) {
  printExplain(label, await query.explain('executionStats'));
}

try {
  await connectDb();

  const anyUser = await User.findOne().select('_id email interests');
  const [userWithBoth] = await User.aggregate([
    { $lookup: { from: 'notes', localField: '_id', foreignField: 'owner', pipeline: [{ $limit: 1 }], as: 'notes' } },
    { $lookup: { from: 'posts', localField: '_id', foreignField: 'author', pipeline: [{ $limit: 1 }], as: 'posts' } },
    { $match: { 'notes.0': { $exists: true }, 'posts.0': { $exists: true } } },
    { $limit: 1 },
  ]);
  const userWithInterest = await User.findOne({ 'interests.0': { $exists: true } }).select('interests');
  const userId = userWithBoth?._id ?? anyUser?._id ?? new mongoose.Types.ObjectId();
  const interest = userWithInterest?.interests?.[0] ?? '__no_matching_interest__';
  const email = anyUser?.email ?? 'nobody@example.com';

  if (!anyUser) console.log('No users found; using an unused ObjectId for filtered queries.');

  await explain('notes by owner', Note.find({ owner: userId }).sort({ _id: -1 }).limit(10));
  await explain('admin notes', Note.find({}).sort({ _id: -1 }).limit(10));
  await explain('users list', User.find({}).sort({ _id: -1 }).limit(10));
  await explain('user by email', User.findOne({ email }));
  await explain('posts by author', Post.find({ author: userId }).sort({ _id: -1 }).limit(10));

  const groupStages = [
    { $unwind: '$interests' },
    { $group: { _id: '$interests', users: { $push: { _id: '$_id', name: '$name' } }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $facet: { data: [{ $skip: 0 }, { $limit: 10 }], total: [{ $count: 'count' }] } },
  ];
  await explain('interests groups', User.aggregate(groupStages));
  await explain('interests groups filtered', User.aggregate([
    { $match: { interests: interest } },
    { $unwind: '$interests' },
    { $match: { interests: interest } },
    ...groupStages.slice(1),
  ]));

  await explain('user posts lookup', User.aggregate([
    { $match: { _id: userId } },
    { $lookup: {
      from: 'posts',
      localField: '_id',
      foreignField: 'author',
      pipeline: [{ $sort: { _id: -1 } }, { $skip: 0 }, { $limit: 11 }],
      as: 'posts',
    } },
    { $project: { name: 1, interests: 1, posts: 1 } },
  ]));
} catch (error) {
  console.error('Explain failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
