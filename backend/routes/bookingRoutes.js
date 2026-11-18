import express from "express";
import {
  approveBooking,
  cancelBooking,
  createBooking,
  getBooking,
  listBookings,
  rejectBooking,
  updateBookingNotes,
} from "../controllers/bookingController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createBooking);
router.get("/", listBookings);
router.get("/:id", getBooking);
router.put("/:id/cancel", cancelBooking);
router.put("/:id/approve", authorize("manager", "admin"), approveBooking);
router.put("/:id/reject", authorize("manager", "admin"), rejectBooking);
router.put("/:id/notes", authorize("manager", "admin"), updateBookingNotes);

export default router;
