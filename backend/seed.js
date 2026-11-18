import "dotenv/config";

import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import Category from "./models/Category.js";
import Resource from "./models/Resource.js";
import User from "./models/User.js";
import {
  demoCategories,
  demoResources,
  demoUsers,
} from "./seed-data.js";

const DEMO_PASSWORD = "demo1234";

async function upsertCategory(category) {
  const existing = await Category.findById(category._id);

  if (existing) {
    existing.name = category.name;
    existing.description = category.description;
    await existing.save();
    return "updated";
  }

  await Category.create(category);
  return "created";
}

async function upsertUser(seedUser) {
  const existing = await User.findById(seedUser._id).select("+password");

  if (existing) {
    existing.name = seedUser.name;
    existing.email = seedUser.email;
    existing.role = seedUser.role;
    existing.department = seedUser.department;
    existing.phone = seedUser.phone;
    existing.password = DEMO_PASSWORD;
    await existing.save();
    return "updated";
  }

  const emailOwner = await User.findOne({ email: seedUser.email });

  if (emailOwner) {
    throw new Error(
      `Cannot seed ${seedUser.email}: email already belongs to ${emailOwner._id}.`
    );
  }

  await User.create({ ...seedUser, password: DEMO_PASSWORD });
  return "created";
}

async function upsertResource(resource) {
  const { _id, ...fields } = resource;
  const existing = await Resource.findById(_id);

  if (existing) {
    existing.set(fields);
    await existing.save();
    return "updated";
  }

  await Resource.create(resource);
  return "created";
}

async function main() {
  await connectDB();

  const counts = { created: 0, updated: 0 };

  for (const category of demoCategories) {
    counts[await upsertCategory(category)] += 1;
  }

  for (const user of demoUsers) {
    counts[await upsertUser(user)] += 1;
  }

  for (const resource of demoResources) {
    counts[await upsertResource(resource)] += 1;
  }

  const [users, categories, resources] = await Promise.all([
    User.countDocuments(),
    Category.countDocuments(),
    Resource.countDocuments(),
  ]);

  console.log(
    `Seed complete: ${counts.created} created, ${counts.updated} updated.`
  );
  console.log(
    `Database totals: ${users} users, ${categories} categories, ${resources} resources.`
  );
  console.log("Demo accounts:");
  for (const user of demoUsers) {
    console.log(`- ${user.email} / ${DEMO_PASSWORD} (${user.role})`);
  }
}

main()
  .catch((error) => {
    if (error.code === 11000) {
      console.error(
        "Seed conflict: a unique field already belongs to a different record.",
        error.keyValue
      );
    } else {
      console.error(`Seed failed: ${error.message}`);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
