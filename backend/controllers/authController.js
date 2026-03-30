import bcrypt from "bcryptjs";
import { body } from "express-validator";
import User from "../models/User.js";
import { generateToken } from "../utils/auth.js";

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
    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();

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
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      approved: true,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token: generateToken(user),
        user: {
          id: String(user._id),
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
    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

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

    if (!user.approved) {
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
          id: String(user._id),
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
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: users.map(({ password, _id, ...user }) => ({
        id: String(_id),
        ...user,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserApproval = async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        approved: req.body.approved,
        ...(req.body.role ? { role: req.body.role } : {}),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "User updated successfully.",
      data: {
        id: String(updated._id),
        name: updated.name,
        email: updated.email,
        role: updated.role,
        approved: updated.approved,
      },
    });
  } catch (error) {
    next(error);
  }
};
