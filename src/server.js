import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

try {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
} catch (error) {
  console.error('Failed to start API:', error);
  process.exit(1);
}
