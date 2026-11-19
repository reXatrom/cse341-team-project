
import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import {
  closeMongoose,
  connectMongoose
} from '../src/db/mongoose.js';
import { initializeDatabase } from '../src/db/initialize.js';

// Identify automated test execution.
process.env.NODE_ENV = 'test';

// Keep automated tests isolated from the shared team database.
const connectionString = inject('MONGODB_TEST_URI');
const databaseName = 'kizuna-rail-test';

process.env.MONGODB_DB_NAME = databaseName;
process.env.SESSION_SECRET =
  'test-only-session-secret-do-not-use-in-production';

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName
  });

  await connectMongoose({
    connectionString,
    databaseName
  });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeMongoose();
  await closeDb();
});
