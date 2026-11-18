import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { httpError } from "../utils/httpError.js";

// Public signup must never allow someone to create a manager or admin account.
const SELF_REGISTER_ROLES = ["student", "employee", "faculty"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function readText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function register(req, res, next) {
  try {
    const name = readText(req.body.name);
    const email = readText(req.body.email).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const confirmPassword =
      typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";
    const phone = readText(req.body.phone);
    const department = readText(req.body.department);
    const role = req.body.role || "student";

    if (!name || !email || !password) {
      throw httpError("Name, email and password are required", 400);
    }

    if (!EMAIL_PATTERN.test(email)) {
      throw httpError("Please provide a valid email address", 400);
    }

    if (password.length < 8) {
      throw httpError("Password must be at least 8 characters", 400);
    }

    // Confirm password is optional for API clients, but must match when sent.
    if (confirmPassword && confirmPassword !== password) {
      throw httpError("Passwords do not match", 400);
    }

    if (!SELF_REGISTER_ROLES.includes(role)) {
      throw httpError("Role must be student, employee or faculty", 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw httpError("An account with this email already exists", 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      department,
      role,
    });

    const token = createToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { user, token },
    });
  } catch (error) {
    // A duplicate key can still happen if two signups race past the check above.
    if (error.code === 11000) {
      return next(httpError("An account with this email already exists", 409));
    }

    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const email = readText(req.body.email).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      throw httpError("Email and password are required", 400);
    }

    // The password field is hidden by default, so select it only for login.
    const user = await User.findOne({ email }).select("+password");

    // Use the same message for an unknown email and a wrong password.
    if (!user || !(await user.matchPassword(password))) {
      throw httpError("Invalid email or password", 401);
    }

    const token = createToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
}

export function getMe(req, res) {
  res.json({
    success: true,
    message: "Current user profile",
    data: { user: req.user },
  });
}

export async function changePassword(req, res, next) {
  try {
    const currentPassword =
      typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword =
      typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    const confirmPassword =
      typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";

    if (!currentPassword || !newPassword) {
      throw httpError("Current password and new password are required", 400);
    }

    if (newPassword.length < 8) {
      throw httpError("New password must be at least 8 characters", 400);
    }

    if (confirmPassword && confirmPassword !== newPassword) {
      throw httpError("Passwords do not match", 400);
    }

    if (currentPassword === newPassword) {
      throw httpError(
        "New password must be different from the current password",
        400
      );
    }

    // The password field is hidden by default, so select it only here.
    const user = await User.findById(req.user._id).select("+password");

    if (!user || !(await user.matchPassword(currentPassword))) {
      throw httpError("Current password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const name = readText(req.body.name);
    const department = readText(req.body.department);
    const phone = readText(req.body.phone);

    if (name.length < 2 || name.length > 80) {
      throw httpError("Name must be between 2 and 80 characters", 400);
    }

    if (department.length > 100) {
      throw httpError("Department must be 100 characters or fewer", 400);
    }

    if (phone.length > 30) {
      throw httpError("Phone must be 30 characters or fewer", 400);
    }

    req.user.name = name;
    req.user.department = department;
    req.user.phone = phone;
    await req.user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
}
