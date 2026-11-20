import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const dbName = process.env.DB_NAME || "fuad_portfolio";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db && client) {
    return db;
  }

  try {
    client = new MongoClient(uri!);
    await client.connect();
    db = client.db(dbName);
    console.log(`[database] Connected successfully to MongoDB: "${dbName}"`);
    return db;
  } catch (error) {
    console.error("[database] Failed to connect to MongoDB:", error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
}

export function getCollection<T extends Record<string, any>>(name: string): Collection<T> {
  return getDB().collection<T>(name);
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("[database] MongoDB connection closed");
  }
}
