import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
    },
    provider: {
      type: String,
      trim: true,
    },
    downloadUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const versionHistorySchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      trim: true,
    },
    files: {
      type: [attachmentSchema],
      default: [],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const designMetaSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
    },
    zone: {
      type: String,
      trim: true,
    },
    contractName: {
      type: String,
      trim: true,
    },
    station: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    activity: {
      type: String,
      trim: true,
    },
    document: {
      type: String,
      trim: true,
    },
    revision: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

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
      type: [attachmentSchema],
      default: [],
    },
    designMeta: {
      type: designMetaSchema,
      default: undefined,
    },
    versionHistory: {
      type: [versionHistorySchema],
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
