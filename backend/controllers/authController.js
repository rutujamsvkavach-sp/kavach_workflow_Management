import bcrypt from "bcryptjs";
import { body } from "express-validator";
import User from "../models/User.js";
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
    const staffId = await generateUniqueStaffId(name);
    const user = await User.create({
      name,
      email: normalizedEmail,
      staffId,
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
          staffId: user.staffId,
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

    const staffId = await ensureStaffId(user);

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        token: generateToken(user),
        user: {
          id: String(user._id),
          staffId,
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
    const users = await User.find().sort({ createdAt: -1 });
    await Promise.all(users.map((user) => ensureStaffId(user)));

    res.json({
      success: true,
      data: users.map((user) => {
        const { password, _id, ...safeUser } = user.toObject();
        return {
          id: String(_id),
          ...safeUser,
        };
      }),
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
        staffId: updated.staffId,
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
