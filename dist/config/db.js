"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.getDB = getDB;
exports.getCollection = getCollection;
exports.closeDB = closeDB;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
}
const dbName = process.env.DB_NAME || "fuad_portfolio";
let client = null;
let db = null;
async function connectDB() {
    if (db && client) {
        return db;
    }
    try {
        client = new mongodb_1.MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log(`[database] Connected successfully to MongoDB: "${dbName}"`);
        return db;
    }
    catch (error) {
        console.error("[database] Failed to connect to MongoDB:", error);
        throw error;
    }
}
function getDB() {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
}
function getCollection(name) {
    return getDB().collection(name);
}
async function closeDB() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log("[database] MongoDB connection closed");
    }
}
