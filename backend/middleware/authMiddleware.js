import jwt from "jsonwebtoken";

import { findRowByColumn, sheetNames } from "../services/googleSheets.js";

export const authenticate = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : null;

    if (!token) {
      const error = new Error("Authentication token is required.");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findRowByColumn(sheetNames.users, "id", decoded.userId);

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 401;
      throw error;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
    };

    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
};

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const error = new Error("You do not have permission to access this resource.");
    error.statusCode = 403;
    return next(error);
  }

  return next();
};
