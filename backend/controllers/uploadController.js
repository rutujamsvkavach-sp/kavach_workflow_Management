import { isCloudinaryConfigured, uploadBufferToCloudinary } from "../services/cloudinary.js";

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
    const files = isCloudinaryConfigured()
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
            };
          })
        )
      : req.files.map((file) => ({
          name: file.originalname,
          url: `${baseUrl}/uploads/${file.filename}`,
          type: file.mimetype,
          size: file.size,
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
