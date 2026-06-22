import express from "express";

import {
  approvalValidation,
  deleteStaffUser,
  getUsers,
  login,
  loginValidation,
  register,
  registerValidation,
  updateUserApproval,
  userIdValidation,
} from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.post("/register", registerValidation, validateRequest, register);
router.post("/login", loginValidation, validateRequest, login);
router.get("/users", authenticate, authorizeRoles("admin"), getUsers);
router.put("/users/:id/approval", authenticate, authorizeRoles("admin"), approvalValidation, validateRequest, updateUserApproval);
router.delete("/users/:id", authenticate, authorizeRoles("admin"), userIdValidation, validateRequest, deleteStaffUser);

export default router;
