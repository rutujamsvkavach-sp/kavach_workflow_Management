import express from "express";

import {
  createData,
  dataIdValidation,
  dataQueryValidation,
  dataValidation,
  deleteData,
  getData,
  restoreData,
  updateData,
} from "../controllers/dataController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", dataQueryValidation, validateRequest, getData);
router.post("/", dataValidation, validateRequest, createData);
router.put("/:id", dataIdValidation, dataValidation, validateRequest, updateData);
router.put("/:id/restore", dataIdValidation, validateRequest, authorizeRoles("admin"), restoreData);
router.delete("/:id", dataIdValidation, validateRequest, authorizeRoles("admin"), deleteData);

export default router;
