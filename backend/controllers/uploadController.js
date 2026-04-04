import { isCloudinaryConfigured, uploadBufferToCloudinary } from "../services/cloudinary.js";
import { isGcsConfigured, uploadBufferToGcs } from "../services/googleCloudStorage.js";
import { isGoogleDriveConfigured, uploadBufferToGoogleDrive } from "../services/googleDrive.js";

const getResourceType = (mimeType) => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  return "raw";
};

export const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      const error = new Error("At least one file is required.");
      error.statusCode = 400;
      throw error;
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const files = isGcsConfigured()
      ? await Promise.all(
          req.files.map((file) =>
            uploadBufferToGcs(file.buffer, {
              fileName: file.originalname,
              mimeType: file.mimetype,
            })
          )
        )
      : isCloudinaryConfigured()
      ? await Promise.all(
          req.files.map(async (file) => {
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
        )
      : isGoogleDriveConfigured()
        ? await Promise.all(
            req.files.map((file) =>
              uploadBufferToGoogleDrive(file.buffer, {
                fileName: file.originalname,
                mimeType: file.mimetype,
              })
            )
          )
        : req.files.map((file) => ({
            name: file.originalname,
            url: `${baseUrl}/uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size,
            provider: "local",
          }));

    res.status(201).json({
      success: true,
      message: "Files uploaded successfully.",
      data: files,
    });
  } catch (error) {
    next(error);
  }
};
