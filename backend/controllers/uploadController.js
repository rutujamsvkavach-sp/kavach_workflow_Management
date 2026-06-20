import { isCloudinaryConfigured, uploadBufferToCloudinary } from "../services/cloudinary.js";
import { isGoogleDriveConfigured, uploadBufferToGoogleDrive } from "../services/googleDrive.js";

const getResourceType = (mimeType) => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  return "raw";
};

const getUploadProvider = () => (process.env.UPLOAD_PROVIDER || "auto").trim().toLowerCase();

const uploadToCloudinary = async (files) =>
  Promise.all(
    files.map(async (file) => {
      const result = await uploadBufferToCloudinary(
        file.buffer,
        process.env.CLOUDINARY_FOLDER || "kavach",
        getResourceType(file.mimetype)
      );

      return {
        name: file.originalname,
        url: result.secure_url,
        type: file.mimetype,
        size: file.size,
        provider: "cloudinary",
      };
    })
  );

const uploadToGoogleDrive = async (files) =>
  Promise.all(
    files.map((file) =>
      uploadBufferToGoogleDrive(file.buffer, {
        fileName: file.originalname,
        mimeType: file.mimetype,
      })
    )
  );

const assertProviderIsConfigured = (provider, configured) => {
  if (configured) {
    return;
  }

  const error = new Error(`${provider} uploads are not configured.`);
  error.statusCode = 500;
  throw error;
};

export const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      const error = new Error("At least one file is required.");
      error.statusCode = 400;
      throw error;
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const provider = getUploadProvider();
    let files;

    if (provider === "cloudinary") {
      assertProviderIsConfigured("Cloudinary", isCloudinaryConfigured());
      files = await uploadToCloudinary(req.files);
    } else if (provider === "google-drive") {
      assertProviderIsConfigured("Google Drive", isGoogleDriveConfigured());
      files = await uploadToGoogleDrive(req.files);
    } else if (provider === "local") {
      files = req.files.map((file) => ({
        name: file.originalname,
        url: `${baseUrl}/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size,
        provider: "local",
      }));
    } else if (isCloudinaryConfigured()) {
      files = await uploadToCloudinary(req.files);
    } else if (isGoogleDriveConfigured()) {
      files = await uploadToGoogleDrive(req.files);
    } else {
      files = req.files.map((file) => ({
        name: file.originalname,
        url: `${baseUrl}/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size,
        provider: "local",
      }));
    }

    res.status(201).json({
      success: true,
      message: "Files uploaded successfully.",
      data: files,
    });
  } catch (error) {
    next(error);
  }
};
