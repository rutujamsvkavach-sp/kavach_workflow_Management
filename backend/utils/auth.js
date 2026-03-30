import jwt from "jsonwebtoken";

export const generateToken = (user) =>
  jwt.sign(
    {
      userId: String(user._id || user.id),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    }
  );
