/**
 * Database connection utility
 * 
 * This module provides a cached connection to the MongoDB database.
 * It ensures that only one connection is created per Node.js instance.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({
  path: path.join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env"),
});

// Get MongoDB URI from environment variables
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB_NAME || 'artivism';

if (!mongoUri) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env"
  );
}

// Use global MongoDB cached connection
let cachedMongoObject = global.mongoose;
if (!cachedMongoObject) {
  cachedMongoObject = global.mongoose = { connection: null, promise: null };
}

/**
 * Connect to MongoDB with connection pooling
 * @returns {Promise<mongoose>} Mongoose connection
 */
async function connectToDB() {
  if (cachedMongoObject.connection) {
    return cachedMongoObject.connection;
  }

  if (!cachedMongoObject.promise) {
    const opts = { 
      bufferCommands: false,
      dbName: dbName
    };
    try {
      cachedMongoObject.promise = mongoose
        .connect(mongoUri, opts)
        .then((mongoose) => {
          return mongoose;
        });
      cachedMongoObject.connection = await cachedMongoObject.promise;
      return cachedMongoObject.connection;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
}

export default connectToDB;
