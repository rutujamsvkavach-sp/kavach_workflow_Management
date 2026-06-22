import express from "express";

import { uploadFiles } from "../controllers/uploadController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", authenticate, authorizeRoles("admin", "staff"), upload.array("files", 5), uploadFiles);

export default router;
