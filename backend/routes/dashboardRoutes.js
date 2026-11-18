import express from "express";
import {
  getAdminDashboard,
  getUserDashboard,
} from "../controllers/dashboardController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/user", getUserDashboard);
router.get("/admin", authorize("manager", "admin"), getAdminDashboard);

export default router;
