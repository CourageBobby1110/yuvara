/**
 * One-time admin script: Reset a user's password
 *
 * Usage:
 *   npx ts-node -e "require('dotenv').config({ path: '.env' })" scripts/reset-user-password.ts
 *
 * Or with tsx:
 *   npx tsx scripts/reset-user-password.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const TARGET_EMAIL = "akinolarachael6@gmail.com";
const TEMP_PASSWORD = "Yuvara@Reset1!"; // Strong temporary password — tell the user to change this immediately
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(uri);

  const db = mongoose.connection.db!;
  const usersCollection = db.collection("users");

  // Find the user
  const user = await usersCollection.findOne({
    email: { $regex: new RegExp(`^${TARGET_EMAIL}$`, "i") },
  });

  if (!user) {
    console.error(`❌ No user found with email: ${TARGET_EMAIL}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name ?? "(no name)"} <${user.email}>`);

  // Hash the new temporary password
  const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 12);

  // Update the password
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { password: hashedPassword } }
  );

  console.log("✅ Password has been reset successfully.");
  console.log(`📧 Tell the user their temporary password is: ${TEMP_PASSWORD}`);
  console.log("⚠️  Ask them to change it immediately after logging in.");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB.");
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
