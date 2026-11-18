import express from "express";
import {
  createResource,
  deleteResource,
  getResource,
  listResources,
  updateResource,
} from "../controllers/resourceController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listResources);
router.get("/:id", getResource);
router.post("/", protect, authorize("manager", "admin"), createResource);
router.put("/:id", protect, authorize("manager", "admin"), updateResource);
router.delete("/:id", protect, authorize("manager", "admin"), deleteResource);

export default router;
