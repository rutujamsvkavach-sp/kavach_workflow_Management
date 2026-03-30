import bcrypt from "bcryptjs";
import { body } from "express-validator";

import { appendRow, findRowByColumn, getAllRows, sheetNames, updateRowById } from "../services/googleSheets.js";
import { generateToken } from "../utils/auth.js";
import { v4 as uuidv4 } from "uuid";

export const registerValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must include an uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must include a lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must include a number."),
  body("role").optional().isIn(["admin", "staff"]).withMessage("Role must be admin or staff."),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

export const approvalValidation = [
  body("approved").isBoolean().withMessage("Approved must be true or false."),
  body("role").optional().isIn(["admin", "staff"]).withMessage("Role must be admin or staff."),
];

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "staff", adminSecret } = req.body;
    const existing = await findRowByColumn(sheetNames.users, "email", email);

    if (existing) {
      const error = new Error("A user with this email already exists.");
      error.statusCode = 409;
      throw error;
    }

    if (role === "admin" && process.env.ADMIN_REGISTRATION_SECRET && adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
      const error = new Error("Admin registration is not authorized.");
      error.statusCode = 403;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role,
      approved: "true",
    };

    await appendRow(sheetNames.users, user);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token: generateToken(user),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approved: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findRowByColumn(sheetNames.users, "email", email);

    if (!user) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    if (String(user.approved).toLowerCase() !== "true") {
      const error = new Error("Your account is pending approval.");
      error.statusCode = 403;
      throw error;
    }

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        token: generateToken(user),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approved: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (_req, res, next) => {
  try {
    const users = await getAllRows(sheetNames.users);
    res.json({
      success: true,
      data: users.map(({ password, _rowNumber, ...user }) => ({
        ...user,
        approved: String(user.approved).toLowerCase() === "true",
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserApproval = async (req, res, next) => {
  try {
    const updated = await updateRowById(sheetNames.users, req.params.id, {
      approved: String(req.body.approved),
      role: req.body.role,
    });

    if (!updated) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "User updated successfully.",
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        approved: String(updated.approved).toLowerCase() === "true",
      },
    });
  } catch (error) {
    next(error);
  }
};
