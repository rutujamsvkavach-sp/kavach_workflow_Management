import bcrypt from "bcryptjs";
import crypto from "crypto";
import { body, param } from "express-validator";
import { departments } from "../constants/departments.js";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/mailService.js";
import { generateToken } from "../utils/auth.js";

const buildStaffIdBase = (name) => {
  const cleaned = String(name || "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const combined = cleaned.join("").slice(0, 6);

  if (combined) {
    return combined.padEnd(3, "X");
  }

  return "USER";
};

const generateUniqueStaffId = async (name) => {
  const base = buildStaffIdBase(name);
  const existing = await User.countDocuments({
    staffId: { $regex: `^${base}-`, $options: "i" },
  });

  return `${base}-${String(existing + 1).padStart(4, "0")}`;
};

const ensureStaffId = async (user) => {
  if (user.staffId) {
    return user.staffId;
  }

  const staffId = await generateUniqueStaffId(user.name);
  user.staffId = staffId;
  await user.save();
  return staffId;
};

const mapUser = (user) => ({
  id: String(user._id || user.id),
  staffId: user.staffId,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || "",
  approved: Boolean(user.approved),
});

const getPasswordResetUrl = (token) => {
  const configuredUrl = String(process.env.PASSWORD_RESET_URL || "").trim();
  const clientUrl = configuredUrl || String(process.env.CLIENT_URLS || "http://localhost:5173").split(",")[0].trim();

  return `${clientUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
};

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

export const forgotPasswordValidation = [body("email").isEmail().withMessage("Valid email is required.").normalizeEmail()];

export const resetPasswordValidation = [
  body("token").trim().isLength({ min: 20 }).withMessage("Reset token is invalid."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must include an uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must include a lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must include a number."),
];

export const approvalValidation = [
  body("approved").isBoolean().withMessage("Approved must be true or false."),
  body("role").optional().isIn(["admin", "staff"]).withMessage("Role must be admin or staff."),
  body("department")
    .optional()
    .custom((value) => value === "" || departments.includes(value))
    .withMessage("Department must be a valid department."),
];

export const userIdValidation = [param("id").isMongoId().withMessage("User id is invalid.")];

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
    const staffId = await generateUniqueStaffId(name);
    const user = await User.create({
      name,
      email: normalizedEmail,
      staffId,
      password: hashedPassword,
      role,
      department: "",
      approved: true,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token: generateToken(user),
        user: mapUser(user),
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

    const staffId = await ensureStaffId(user);

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        token: generateToken(user),
        user: mapUser({ ...user.toObject(), staffId }),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    await Promise.all(users.map((user) => ensureStaffId(user)));

    res.json({
      success: true,
      data: users.map(mapUser),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserApproval = async (req, res, next) => {
  try {
    const update = {
      approved: req.body.approved,
      ...(req.body.role ? { role: req.body.role } : {}),
      ...(Object.hasOwn(req.body, "department") ? { department: req.body.department } : {}),
    };

    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();

    if (!updated) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "User updated successfully.",
      data: mapUser(updated),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStaffUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== "staff") {
      const error = new Error("Only staff accounts can be permanently removed.");
      error.statusCode = 403;
      throw error;
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "Staff account permanently removed. Existing workflow records were preserved.",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const normalizedEmail = String(req.body.email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.json({ success: true, message: "If an account exists for this email, a reset link has been sent." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail({
        recipient: user.email,
        resetUrl: getPasswordResetUrl(token),
      });
    } catch (emailError) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw emailError;
    }

    res.json({ success: true, message: "If an account exists for this email, a reset link has been sent." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const passwordResetTokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
    const user = await User.findOne({
      passwordResetTokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpires");

    if (!user) {
      const error = new Error("This password reset link is invalid or has expired.");
      error.statusCode = 400;
      throw error;
    }

    user.password = await bcrypt.hash(req.body.password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    next(error);
  }
};
