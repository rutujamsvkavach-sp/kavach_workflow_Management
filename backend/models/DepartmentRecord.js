import mongoose from "mongoose";

const departmentRecordSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: [String],
      default: [],
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("DepartmentRecord", departmentRecordSchema);
