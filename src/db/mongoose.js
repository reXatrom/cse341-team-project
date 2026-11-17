
import mongoose from 'mongoose';

export async function connectMongoose(options = {}) {
  // Use explicitly supplied settings when provided by the test setup.
  // Otherwise, use the application's environment settings.
  const connectionString = Object.hasOwn(options, 'connectionString')
    ? options.connectionString
    : process.env.MONGODB_URI;

  const databaseName = options.databaseName
    || process.env.MONGODB_DB_NAME
    || 'practice';

  if (!connectionString) {
    throw new Error('A MongoDB connection string is required for Mongoose.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(connectionString, {
    dbName: databaseName
  });

  console.log('Mongoose connected successfully.');

  return mongoose.connection;
}

export async function closeMongoose() {
  await mongoose.disconnect();
}
