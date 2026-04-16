import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.model.js";
import env from "../src/config/env.js";

dotenv.config();

/**
 * Seed script to create test users
 * Run with: npm run seed:users
 */

const testUsers = [

  {
    firstname: "John",
    lastname: "Student",
    username: "john.student",
    email: "student@example.com",
    password: "Student123!",
    role: "user",
    isVerified: true,
    isActive: true,
  },
  {
    firstname: "Jane",
    lastname: "Teacher",
    username: "jane.teacher",
    email: "teacher@example.com",
    password: "Teacher123!",
    role: "user",
    isVerified: true,
    isActive: true,
  },
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing users (optional - comment out to keep existing users)
    // await User.deleteMany({});
    // console.log("Cleared existing users");

    // Create test users
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await User.create(userData);
      console.log(`✓ Created user: ${user.email}`);
    }

    console.log("\n✓ Seed completed successfully!");
    console.log("\nTest credentials:");
    testUsers.forEach((user) => {
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role}\n`);
    });
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedUsers();
