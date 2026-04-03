import mongoose from "mongoose";

const dprEntrySchema = new mongoose.Schema(
  {
    reportDate: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    staff: {
      type: String,
      required: true,
      trim: true,
    },
    actualResponsibility: {
      type: String,
      default: "",
      trim: true,
    },
    todaysResponsibility: {
      type: String,
      default: "",
      trim: true,
    },
    workDone: {
      type: String,
      default: "",
      trim: true,
    },
    inProgress: {
      type: String,
      default: "",
      trim: true,
    },
    deficiency: {
      type: String,
      default: "",
      trim: true,
    },
    updatedByName: {
      type: String,
      required: true,
      trim: true,
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

dprEntrySchema.index({ reportDate: 1, department: 1, staff: 1 });

export default mongoose.model("DprEntry", dprEntrySchema);
