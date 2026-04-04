import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { isGcsConfigured } from "../services/googleCloudStorage.js";
import { isGoogleDriveConfigured } from "../services/googleDrive.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_.]/g, "");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const upload = multer({
  storage: process.env.CLOUDINARY_CLOUD_NAME || isGcsConfigured() || isGoogleDriveConfigured() ? multer.memoryStorage() : diskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Unsupported file type. Please upload PDF, Excel, JPG, PNG, or WEBP files."));
  },
});
