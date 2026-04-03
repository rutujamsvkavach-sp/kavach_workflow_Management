import express from "express";

import {
  createDprEntry,
  deleteDprEntry,
  dprIdValidation,
  getDeletedDprEntries,
  dprQueryValidation,
  dprRangeQueryValidation,
  dprValidation,
  getDprEntries,
  getDprEntriesByRange,
  restoreDprEntry,
  updateDprEntry,
} from "../controllers/dprController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/range", dprRangeQueryValidation, validateRequest, getDprEntriesByRange);
router.get("/deleted", authorizeRoles("admin"), getDeletedDprEntries);
router.get("/", dprQueryValidation, validateRequest, getDprEntries);
router.post("/", dprValidation, validateRequest, createDprEntry);
router.put("/:id", dprIdValidation, dprValidation, validateRequest, updateDprEntry);
router.put("/:id/restore", dprIdValidation, validateRequest, authorizeRoles("admin"), restoreDprEntry);
router.delete("/:id", dprIdValidation, validateRequest, authorizeRoles("admin"), deleteDprEntry);

export default router;
