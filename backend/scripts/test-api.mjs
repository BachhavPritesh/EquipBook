import "dotenv/config";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import Resource from "../models/Resource.js";
import User from "../models/User.js";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000/api";
const PASSWORD = "TestPass123";
const NEW_PASSWORD = "TestPass456";
const RUN_ID = Date.now();

const STUDENT_EMAIL = `student.${RUN_ID}@test.equipbook.local`;
const SECOND_EMAIL = `student2.${RUN_ID}@test.equipbook.local`;
const ADMIN_EMAIL = `admin.${RUN_ID}@test.equipbook.local`;

function dateKey(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  return { status: response.status, payload };
}

function expectStatus(result, status, label) {
  assert.equal(
    result.status,
    status,
    `${label}: expected ${status}, got ${result.status} ${JSON.stringify(
      result.payload
    )}`
  );
}

function expectSuccess(result, status, label) {
  expectStatus(result, status, label);
  assert.equal(result.payload?.success, true, `${label}: success was not true`);
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Run this script from backend/.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const created = {
    userIds: [],
    categoryId: null,
    resourceId: null,
  };

  try {
    console.log("1. Health check");
    const health = await request("/health");
    expectSuccess(health, 200, "health");
    assert.equal(health.payload.data.database, "connected");

    console.log("2. Create a test admin account directly");
    const adminUser = await User.create({
      name: "Test Admin",
      email: ADMIN_EMAIL,
      password: PASSWORD,
      role: "admin",
      department: "Testing",
    });
    created.userIds.push(adminUser._id);

    console.log("3. Admin login");
    const adminLogin = await request("/auth/login", {
      method: "POST",
      body: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    expectSuccess(adminLogin, 200, "admin login");
    const adminToken = adminLogin.payload.data.token;
    assert.ok(adminToken, "Admin login did not return a token");
    assert.equal(adminLogin.payload.data.user.password, undefined);

    console.log("4. Student registration");
    const registration = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Test Student",
        email: STUDENT_EMAIL,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        role: "student",
        department: "Testing",
        phone: "+1 555 0100",
      },
    });
    expectSuccess(registration, 201, "student registration");
    const studentId = registration.payload.data.user.id;
    const studentToken = registration.payload.data.token;
    created.userIds.push(studentId);
    assert.equal(registration.payload.data.user.role, "student");
    assert.equal(registration.payload.data.user.password, undefined);

    console.log("5. Second student registration");
    const secondRegistration = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Second Student",
        email: SECOND_EMAIL,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        role: "student",
      },
    });
    expectSuccess(secondRegistration, 201, "second student registration");
    const secondId = secondRegistration.payload.data.user.id;
    const secondToken = secondRegistration.payload.data.token;
    created.userIds.push(secondId);

    console.log("6. Current user and profile update");
    const me = await request("/auth/me", { token: studentToken });
    expectSuccess(me, 200, "get me");
    assert.equal(me.payload.data.user.email, STUDENT_EMAIL);

    const profileUpdate = await request("/auth/me", {
      method: "PUT",
      token: studentToken,
      body: {
        name: "Updated Student",
        department: "Updated Department",
        phone: "+1 555 0199",
        email: ADMIN_EMAIL,
        role: "admin",
        password: "should-not-change",
      },
    });
    expectSuccess(profileUpdate, 200, "profile update");
    assert.equal(profileUpdate.payload.data.user.name, "Updated Student");
    assert.equal(profileUpdate.payload.data.user.email, STUDENT_EMAIL);
    assert.equal(profileUpdate.payload.data.user.role, "student");

    console.log("7. Password change");
    const passwordChange = await request("/auth/password", {
      method: "PUT",
      token: studentToken,
      body: {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      },
    });
    expectSuccess(passwordChange, 200, "password change");

    const oldPasswordLogin = await request("/auth/login", {
      method: "POST",
      body: { email: STUDENT_EMAIL, password: PASSWORD },
    });
    expectStatus(oldPasswordLogin, 401, "old password login");

    const newPasswordLogin = await request("/auth/login", {
      method: "POST",
      body: { email: STUDENT_EMAIL, password: NEW_PASSWORD },
    });
    expectSuccess(newPasswordLogin, 200, "new password login");
    const refreshedStudentToken = newPasswordLogin.payload.data.token;

    console.log("8. User management permissions");
    const deniedUserList = await request("/users", { token: refreshedStudentToken });
    expectStatus(deniedUserList, 403, "student user list");

    const userList = await request(`/users?search=${RUN_ID}`, {
      token: adminToken,
    });
    expectSuccess(userList, 200, "admin user list");
    assert.ok(
      userList.payload.data.users.some((user) => user.id === studentId),
      "Admin user list did not include the test student"
    );

    const userDetails = await request(`/users/${studentId}`, {
      token: adminToken,
    });
    expectSuccess(userDetails, 200, "admin user details");
    assert.equal(userDetails.payload.data.user.email, STUDENT_EMAIL);

    const roleUpdate = await request(`/users/${secondId}/role`, {
      method: "PUT",
      token: adminToken,
      body: { role: "employee" },
    });
    expectSuccess(roleUpdate, 200, "admin role update");
    assert.equal(roleUpdate.payload.data.user.role, "employee");

    console.log("9. Category permissions and creation");
    const deniedCategory = await request("/categories", {
      method: "POST",
      token: refreshedStudentToken,
      body: {
        name: `Denied Category ${RUN_ID}`,
        description: "This request should be rejected by the role guard.",
      },
    });
    expectStatus(deniedCategory, 403, "student category create");

    const categoryCreate = await request("/categories", {
      method: "POST",
      token: adminToken,
      body: {
        name: `Test Category ${RUN_ID}`,
        description: "A temporary category created by the API integration test.",
      },
    });
    expectSuccess(categoryCreate, 201, "admin category create");
    const categoryId = categoryCreate.payload.data.category.id;
    created.categoryId = categoryId;

    console.log("10. Resource permissions and creation");
    const resourceBody = {
      name: `Test Projector ${RUN_ID}`,
      description:
        "A temporary projector resource created by the API integration test.",
      categoryId,
      location: "Test Lab",
      image: "https://example.com/test-projector.jpg",
      totalQuantity: 5,
      availableQuantity: 5,
      status: "available",
      instructions: "Return the projector with all cables after use.",
      requirements: ["Student ID"],
    };

    const deniedResource = await request("/resources", {
      method: "POST",
      token: refreshedStudentToken,
      body: resourceBody,
    });
    expectStatus(deniedResource, 403, "student resource create");

    const resourceCreate = await request("/resources", {
      method: "POST",
      token: adminToken,
      body: resourceBody,
    });
    expectSuccess(resourceCreate, 201, "admin resource create");
    const resourceId = resourceCreate.payload.data.resource.id;
    created.resourceId = resourceId;
    assert.ok(resourceCreate.payload.data.resource.assetTag);

    const search = await request(`/resources?search=${RUN_ID}`);
    expectSuccess(search, 200, "resource search");
    assert.ok(
      search.payload.data.resources.some((resource) => resource.id === resourceId)
    );

    const filter = await request(`/resources?categoryId=${categoryId}&status=available`);
    expectSuccess(filter, 200, "resource filter");
    assert.ok(
      filter.payload.data.resources.some((resource) => resource.id === resourceId)
    );

    const resourceDetails = await request(`/resources/${resourceId}`);
    expectSuccess(resourceDetails, 200, "resource details");

    const windowA = {
      startDate: dateKey(30),
      endDate: dateKey(30),
      startTime: "09:00",
      endTime: "17:00",
    };

    console.log("11. Availability before bookings");
    const availabilityBefore = await request(
      `/availability?resourceId=${resourceId}&startDate=${windowA.startDate}&endDate=${windowA.endDate}&startTime=${windowA.startTime}&endTime=${windowA.endTime}&quantity=3`,
      { token: refreshedStudentToken }
    );
    expectSuccess(availabilityBefore, 200, "availability before");
    assert.equal(availabilityBefore.payload.data.availableQuantity, 5);
    assert.equal(availabilityBefore.payload.data.canBook, true);

    console.log("12. Create and read bookings");
    const bookingCreate = await request("/bookings", {
      method: "POST",
      token: refreshedStudentToken,
      body: {
        resourceId,
        purpose: "Testing the complete booking workflow.",
        ...windowA,
        quantity: 3,
        notes: "Please prepare the HDMI cable.",
      },
    });
    expectSuccess(bookingCreate, 201, "booking create");
    const bookingA = bookingCreate.payload.data.booking;
    assert.equal(bookingA.status, "pending");
    assert.equal(bookingA.userId, studentId);
    assert.equal(bookingA.resourceId, resourceId);
    assert.match(bookingA.bookingReference, /^EQ-\d{4}-\d{4}$/);

    const ownBookings = await request("/bookings", {
      token: refreshedStudentToken,
    });
    expectSuccess(ownBookings, 200, "own bookings");
    assert.ok(ownBookings.payload.data.bookings.some((b) => b.id === bookingA.id));

    const forbiddenBooking = await request(`/bookings/${bookingA.id}`, {
      token: secondToken,
    });
    expectStatus(forbiddenBooking, 403, "other user booking details");

    const adminBookings = await request("/bookings", { token: adminToken });
    expectSuccess(adminBookings, 200, "admin bookings");
    assert.ok(
      adminBookings.payload.data.bookings.some((b) => b.id === bookingA.id)
    );

    console.log("13. Approve and re-check availability");
    const approval = await request(`/bookings/${bookingA.id}/approve`, {
      method: "PUT",
      token: adminToken,
      body: { adminNotes: "Approved for the integration test." },
    });
    expectSuccess(approval, 200, "booking approve");
    assert.equal(approval.payload.data.booking.status, "approved");

    const availabilityAfter = await request(
      `/availability?resourceId=${resourceId}&startDate=${windowA.startDate}&endDate=${windowA.endDate}&startTime=${windowA.startTime}&endTime=${windowA.endTime}&quantity=3`,
      { token: refreshedStudentToken }
    );
    expectSuccess(availabilityAfter, 200, "availability after");
    assert.equal(availabilityAfter.payload.data.availableQuantity, 2);
    assert.equal(availabilityAfter.payload.data.canBook, false);

    const tooLarge = await request("/bookings", {
      method: "POST",
      token: secondToken,
      body: {
        resourceId,
        purpose: "Requesting more units than the overlap allows.",
        ...windowA,
        quantity: 3,
      },
    });
    expectStatus(tooLarge, 409, "overlapping overbook");

    const bookingB = await request("/bookings", {
      method: "POST",
      token: secondToken,
      body: {
        resourceId,
        purpose: "Requesting the remaining units for the same window.",
        ...windowA,
        quantity: 2,
      },
    });
    expectSuccess(bookingB, 201, "second booking create");
    const bookingBId = bookingB.payload.data.booking.id;

    const secondApproval = await request(`/bookings/${bookingBId}/approve`, {
      method: "PUT",
      token: adminToken,
      body: {},
    });
    expectSuccess(secondApproval, 200, "second booking approve");

    const noUnits = await request(
      `/availability?resourceId=${resourceId}&startDate=${windowA.startDate}&endDate=${windowA.endDate}&startTime=${windowA.startTime}&endTime=${windowA.endTime}&quantity=1`,
      { token: refreshedStudentToken }
    );
    expectSuccess(noUnits, 200, "zero availability");
    assert.equal(noUnits.payload.data.availableQuantity, 0);
    assert.equal(noUnits.payload.data.canBook, false);

    console.log("14. Cancellation rules");
    const windowC = {
      startDate: dateKey(40),
      endDate: dateKey(40),
      startTime: "10:00",
      endTime: "12:00",
    };
    const bookingC = await request("/bookings", {
      method: "POST",
      token: refreshedStudentToken,
      body: {
        resourceId,
        purpose: "A booking that will be cancelled by its owner.",
        ...windowC,
        quantity: 1,
      },
    });
    expectSuccess(bookingC, 201, "cancellable booking create");
    const bookingCId = bookingC.payload.data.booking.id;

    const cancel = await request(`/bookings/${bookingCId}/cancel`, {
      method: "PUT",
      token: refreshedStudentToken,
    });
    expectSuccess(cancel, 200, "booking cancel");
    assert.equal(cancel.payload.data.booking.status, "cancelled");

    const cancelAgain = await request(`/bookings/${bookingCId}/cancel`, {
      method: "PUT",
      token: refreshedStudentToken,
    });
    expectStatus(cancelAgain, 409, "double cancel");

    console.log("15. Staff cannot approve their own booking");
    const windowD = {
      startDate: dateKey(45),
      endDate: dateKey(45),
      startTime: "13:00",
      endTime: "15:00",
    };
    const adminBooking = await request("/bookings", {
      method: "POST",
      token: adminToken,
      body: {
        resourceId,
        purpose: "A booking created by the admin for self-approval testing.",
        ...windowD,
        quantity: 1,
      },
    });
    expectSuccess(adminBooking, 201, "admin booking create");
    const adminBookingId = adminBooking.payload.data.booking.id;

    const selfApproval = await request(`/bookings/${adminBookingId}/approve`, {
      method: "PUT",
      token: adminToken,
      body: {},
    });
    expectStatus(selfApproval, 403, "self approval");

    const adminCancel = await request(`/bookings/${adminBookingId}/cancel`, {
      method: "PUT",
      token: adminToken,
    });
    expectSuccess(adminCancel, 200, "admin cancel own booking");

    console.log("16. Rejection and admin notes");
    const windowE = {
      startDate: dateKey(50),
      endDate: dateKey(50),
      startTime: "08:00",
      endTime: "10:00",
    };
    const bookingE = await request("/bookings", {
      method: "POST",
      token: secondToken,
      body: {
        resourceId,
        purpose: "A request that will be rejected by the admin.",
        ...windowE,
        quantity: 1,
      },
    });
    expectSuccess(bookingE, 201, "rejectable booking create");
    const bookingEId = bookingE.payload.data.booking.id;

    const rejectWithoutReason = await request(`/bookings/${bookingEId}/reject`, {
      method: "PUT",
      token: adminToken,
      body: {},
    });
    expectStatus(rejectWithoutReason, 400, "reject without reason");

    const reject = await request(`/bookings/${bookingEId}/reject`, {
      method: "PUT",
      token: adminToken,
      body: { adminNotes: "The request does not match the lab schedule." },
    });
    expectSuccess(reject, 200, "booking reject");
    assert.equal(reject.payload.data.booking.status, "rejected");

    const notesUpdate = await request(`/bookings/${bookingA.id}/notes`, {
      method: "PUT",
      token: adminToken,
      body: { adminNotes: "Updated integration-test note." },
    });
    expectSuccess(notesUpdate, 200, "booking notes update");
    assert.equal(
      notesUpdate.payload.data.booking.adminNotes,
      "Updated integration-test note."
    );

    console.log("17. Dashboards");
    const userDashboard = await request("/dashboard/user", {
      token: refreshedStudentToken,
    });
    expectSuccess(userDashboard, 200, "user dashboard");
    assert.equal(userDashboard.payload.data.stats.totalBookings, 2);
    assert.equal(userDashboard.payload.data.stats.approvedBookings, 1);
    assert.equal(userDashboard.payload.data.stats.cancelledBookings, 1);
    assert.equal(userDashboard.payload.data.stats.rejectedOrCancelled, 1);

    const deniedAdminDashboard = await request("/dashboard/admin", {
      token: refreshedStudentToken,
    });
    expectStatus(deniedAdminDashboard, 403, "student admin dashboard");

    const adminDashboard = await request("/dashboard/admin", {
      token: adminToken,
    });
    expectSuccess(adminDashboard, 200, "admin dashboard");
    assert.ok(adminDashboard.payload.data.stats.totalUsers >= 3);
    assert.ok(adminDashboard.payload.data.stats.totalBookings >= 5);
    assert.ok(adminDashboard.payload.data.resourceSummary.totalResources >= 1);
    assert.ok(Array.isArray(adminDashboard.payload.data.recentBookings));

    console.log("All API integration tests passed.");
  } finally {
    if (created.resourceId || created.userIds.length > 0) {
      await Booking.deleteMany({
        $or: [
          { user: { $in: created.userIds } },
          ...(created.resourceId ? [{ resource: created.resourceId }] : []),
        ],
      }).catch(() => {});
    }

    if (created.resourceId) {
      await Resource.findByIdAndDelete(created.resourceId).catch(() => {});
    }

    if (created.categoryId) {
      await Category.findByIdAndDelete(created.categoryId).catch(() => {});
    }

    if (created.userIds.length > 0) {
      await User.deleteMany({ _id: { $in: created.userIds } }).catch(() => {});
    }

    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
