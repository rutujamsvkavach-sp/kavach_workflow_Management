import mongoose from "mongoose";
import { departments } from "../constants/departments.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    staffId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "staff", "viewer"],
      default: "staff",
    },
    department: {
      type: String,
      enum: ["", ...departments],
      default: "",
      trim: true,
    },
    departments: {
      type: [String],
      enum: departments,
      default: [],
    },
    approved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
