import "dotenv/config";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import User from "../models/User.js";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000/api";
const TEST_PASSWORD = "demo1234";
const TEST_EMAIL = `profile.test.${Date.now()}@northbridge.edu`;

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Load backend/.env first.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  let userId;

  try {
    const user = await User.create({
      name: "Profile Test",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: "student",
      department: "Testing",
      phone: "+1 (415) 555-0100",
    });
    userId = user._id.toString();

    const login = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    assert.equal(
      login.response.status,
      200,
      `Login failed: ${login.response.status} ${JSON.stringify(login.payload)}`,
    );
    const token = login.payload?.data?.token;
    assert.ok(token, "Login response did not include a token");

    const update = await request("/auth/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Updated Profile",
        department: "Updated Department",
        phone: "+1 (415) 555-0199",
        email: "attacker@example.com",
        role: "admin",
        password: "should-not-change",
      }),
    });

    assert.equal(
      update.response.status,
      200,
      `Profile update failed: ${update.response.status} ${JSON.stringify(update.payload)}`,
    );

    const updatedUser = update.payload?.data?.user;
    assert.equal(updatedUser.name, "Updated Profile");
    assert.equal(updatedUser.department, "Updated Department");
    assert.equal(updatedUser.phone, "+1 (415) 555-0199");
    assert.equal(updatedUser.email, TEST_EMAIL, "Email must not change");
    assert.equal(updatedUser.role, "student", "Role must not change");

    const relogin = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    assert.equal(
      relogin.response.status,
      200,
      "The original password must still work",
    );

    const unauthorized = await request("/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "No Token" }),
    });
    assert.equal(
      unauthorized.response.status,
      401,
      "Profile update without a token must return 401",
    );

    const invalid = await request("/auth/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "A",
        department: "x".repeat(101),
        phone: "1".repeat(31),
      }),
    });
    assert.equal(
      invalid.response.status,
      400,
      "Invalid profile fields must return 400",
    );

    console.log("Profile update test passed");
  } finally {
    if (userId) {
      await User.findByIdAndDelete(userId).catch(() => {});
    }
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
