import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in env");
  process.exit(1);
}

const runMigration = async () => {
  try {
    console.log("🛰️ Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🚀 Updating events from 'pending' status to 'upcoming'...");
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("DB connection not established");
    }
    const collection = db.collection('events');
    const result = await collection.updateMany({ status: 'pending' }, { $set: { status: 'upcoming' } });
    console.log(`✅ Success! Updated ${result.modifiedCount} events to 'upcoming' status.`);
  } catch (err: any) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runMigration();
