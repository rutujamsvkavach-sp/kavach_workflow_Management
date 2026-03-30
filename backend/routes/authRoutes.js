import express from "express";

import {
  approvalValidation,
  getUsers,
  login,
  loginValidation,
  register,
  registerValidation,
  updateUserApproval,
} from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.post("/register", registerValidation, validateRequest, register);
router.post("/login", loginValidation, validateRequest, login);
router.get("/users", authenticate, authorizeRoles("admin"), getUsers);
router.put("/users/:id/approval", authenticate, authorizeRoles("admin"), approvalValidation, validateRequest, updateUserApproval);

export default router;
