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
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
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
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
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

const workMetaSchema = new mongoose.Schema(
  {
    attendanceDate: {
      type: String,
      trim: true,
    },
    checkInTime: {
      type: String,
      trim: true,
    },
    checkOutTime: {
      type: String,
      trim: true,
    },
    staffName: {
      type: String,
      trim: true,
    },
    staffId: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    accuracy: {
      type: Number,
    },
    locationLabel: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const locoMetaSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
    },
    trialCondition: {
      type: String,
      trim: true,
    },
    locoDetails: {
      type: String,
      trim: true,
    },
    trialDate: {
      type: String,
      trim: true,
    },
    driver: {
      type: String,
      trim: true,
    },
    doneBy: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const siteImageMetaSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
    },
    pssa: {
      type: String,
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    station: {
      type: String,
      trim: true,
    },
    imageDate: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const telecomMetaSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
    },
    testDate: {
      type: String,
      trim: true,
    },
    fiberLength: {
      type: String,
      trim: true,
    },
    fiberDetails: {
      type: String,
      trim: true,
    },
    wavelength: {
      type: String,
      trim: true,
    },
    testBy: {
      type: String,
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const accountsMetaSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
    },
    contractName: {
      type: String,
      trim: true,
    },
    account: {
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
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const civilFieldValueSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
    },
    files: {
      type: [attachmentSchema],
      default: [],
    },
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const civilMetaSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
    },
    section: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    stationLcGate: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    tentativeGadRailway: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    siteSurveyReportByAgency: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    towerId: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    completionGadOfTowerByAgency: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    cableRoutePlanSignedCopy: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    soilTestBoreLog: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    soilTestLabReport: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    excavation: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    pcc: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    firstStageInspection: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    rccFirstLift: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    secondStageInspection: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    secondLiftFoundationCipFixing: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    thirdStageInspection: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    erectionOfTower: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    erectedTowerJpg: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    fourthStageInspection: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    cableLayingTowerToRelayRoom: {
      type: civilFieldValueSchema,
      default: undefined,
    },
    earthing: {
      type: civilFieldValueSchema,
      default: undefined,
    },
  },
  { _id: false }
);

const tagPlacementMetaSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
    },
    phase: {
      type: String,
      trim: true,
    },
    blockSection: {
      type: String,
      trim: true,
    },
    station: {
      type: String,
      trim: true,
    },
    documents: {
      type: [attachmentSchema],
      default: [],
    },
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    documentLink: {
      type: String,
      trim: true,
    },
    images: {
      type: [attachmentSchema],
      default: [],
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
    documentLink: {
      type: String,
      trim: true,
      default: "",
    },
    documentType: {
      type: String,
      enum: ["file", "image", "link"],
      trim: true,
      default: "file",
    },
    fileUrl: {
      type: [attachmentSchema],
      default: [],
    },
    designMeta: {
      type: designMetaSchema,
      default: undefined,
    },
    workMeta: {
      type: workMetaSchema,
      default: undefined,
    },
    locoMeta: {
      type: locoMetaSchema,
      default: undefined,
    },
    siteImageMeta: {
      type: siteImageMetaSchema,
      default: undefined,
    },
    telecomMeta: {
      type: telecomMetaSchema,
      default: undefined,
    },
    accountsMeta: {
      type: accountsMetaSchema,
      default: undefined,
    },
    civilMeta: {
      type: civilMetaSchema,
      default: undefined,
    },
    tagPlacementMeta: {
      type: tagPlacementMetaSchema,
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

export default mongoose.model("DepartmentRecord", departmentRecordSchema);
