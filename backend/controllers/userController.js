import User, { USER_ROLES } from "../models/User.js";
import { httpError } from "../utils/httpError.js";

function readText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Staff can browse registered users. Passwords are hidden by the User model.
export async function listUsers(req, res, next) {
  try {
    const search = readText(req.query.search);
    const role = readText(req.query.role);
    const query = {};

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: pattern },
        { email: pattern },
        { department: pattern },
        { phone: pattern },
      ];
    }

    if (role && role !== "all") {
      if (!USER_ROLES.includes(role)) {
        throw httpError("Invalid role filter", 400);
      }

      query.role = role;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Users loaded successfully",
      data: { count: users.length, users },
    });
  } catch (error) {
    next(error);
  }
}

// Staff can inspect a single user.
export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw httpError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User loaded successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

// Only admins can change roles. Managers can still view users.
export async function updateUserRole(req, res, next) {
  try {
    const role = readText(req.body.role);

    if (!USER_ROLES.includes(role)) {
      throw httpError(`Role must be one of: ${USER_ROLES.join(", ")}`, 400);
    }

    if (req.params.id === req.user._id.toString()) {
      throw httpError("You cannot change your own role", 403);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      throw httpError("User not found", 404);
    }

    // Keep at least one admin account so the project cannot lock itself out.
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });

      if (adminCount <= 1) {
        throw httpError("At least one admin account must remain", 409);
      }
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: "User role updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
