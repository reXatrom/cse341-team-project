
import { MongoClient } from 'mongodb';

let database;
let client;
let connectionPromise;
let resolveMongoClient;

const mongoClientPromise = new Promise((resolve) => {
  resolveMongoClient = resolve;
});

const connectToDb = async (options = {}) => {
  if (database) {
    return database;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const connectionString =
    options.connectionString || process.env.MONGODB_URI;

  const databaseName =
    options.databaseName || process.env.MONGODB_DB_NAME || 'practice';

  if (!connectionString) {
    throw new Error('MONGODB_URI is required.');
  }

  connectionPromise = (async () => {
    client = new MongoClient(connectionString);
    await client.connect();

    database = client.db(databaseName);

    resolveMongoClient(client);

    return database;
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    client = undefined;
    database = undefined;
    connectionPromise = undefined;
    throw error;
  }
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }

  return database;
};

const getMongoClientPromise = () => mongoClientPromise;

const closeDb = async () => {
  if (client) {
    await client.close();

    client = undefined;
    database = undefined;
    connectionPromise = undefined;
  }
};

export {
  closeDb,
  connectToDb,
  getDb,
  getMongoClientPromise
};
