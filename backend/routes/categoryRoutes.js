import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listCategories);
router.get("/:id", getCategory);
router.post("/", protect, authorize("manager", "admin"), createCategory);
router.put("/:id", protect, authorize("manager", "admin"), updateCategory);
router.delete("/:id", protect, authorize("manager", "admin"), deleteCategory);

export default router;
