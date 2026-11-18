import express from "express";
import { checkAvailability } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, checkAvailability);

export default router;
