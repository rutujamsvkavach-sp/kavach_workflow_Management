import express from "express";

import {
  createDprEntry,
  deleteDprEntry,
  dprIdValidation,
  dprQueryValidation,
  dprValidation,
  getDprEntries,
  updateDprEntry,
} from "../controllers/dprController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", dprQueryValidation, validateRequest, getDprEntries);
router.post("/", dprValidation, validateRequest, createDprEntry);
router.put("/:id", dprIdValidation, dprValidation, validateRequest, updateDprEntry);
router.delete("/:id", dprIdValidation, validateRequest, deleteDprEntry);

export default router;
