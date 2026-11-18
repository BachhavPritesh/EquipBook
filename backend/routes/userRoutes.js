import express from "express";
import {
  getUser,
  listUsers,
  updateUserRole,
} from "../controllers/userController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("manager", "admin"), listUsers);
router.get("/:id", authorize("manager", "admin"), getUser);
router.put("/:id/role", authorize("admin"), updateUserRole);

export default router;
