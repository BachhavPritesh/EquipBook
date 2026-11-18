import "dotenv/config"; // Load .env before any other file reads process.env.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import userRoutes from "./routes/userRoutes.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to backend/.env");
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Add security-related HTTP headers. CSP is disabled because this API only returns JSON.
app.use(helmet({ contentSecurityPolicy: false }));

// Allow requests from the Next.js frontend.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);

// Parse JSON request bodies.
app.use(express.json({ limit: "1mb" }));

// Allow 300 requests per IP every 15 minutes.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api", apiLimiter);

// Health check: confirms that the API and database connection are working.
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.json({
    success: true,
    message: "EquipBook API is running",
    data: {
      database: databaseConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
  });
});

// Authentication routes: register, login and the current user profile.
app.use("/api/auth", authRoutes);

// User management routes for staff.
app.use("/api/users", userRoutes);

// Catalogue routes: categories and the resources inside them.
app.use("/api/categories", categoryRoutes);
app.use("/api/resources", resourceRoutes);

// Booking routes, availability checks and dashboard data.
app.use("/api/bookings", bookingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Unknown routes go through this handler.
app.use(notFound);

// The global error handler must be last.
app.use(errorHandler);

// Connect to the database first, then start accepting requests.
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`EquipBook API running at http://localhost:${PORT}`);
  });
}

startServer();
