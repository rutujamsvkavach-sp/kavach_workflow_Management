import { body, param, query } from "express-validator";
import DepartmentRecord from "../models/DepartmentRecord.js";

const getFileNameFromUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    return decodeURIComponent(segments.pop() || "Attachment");
  } catch (_error) {
    const segments = String(url).split("/").filter(Boolean);
    return decodeURIComponent(segments.pop() || "Attachment");
  }
};

const normalizeAttachment = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    return {
      name: getFileNameFromUrl(trimmedValue),
      url: trimmedValue,
      provider: "legacy",
    };
  }

  if (typeof value === "object") {
    const url = typeof value.url === "string" ? value.url.trim() : "";

    if (!url) {
      return null;
    }

    return {
      name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : getFileNameFromUrl(url),
      url,
      type: typeof value.type === "string" ? value.type : undefined,
      size: Number.isFinite(Number(value.size)) ? Number(value.size) : undefined,
      provider: typeof value.provider === "string" ? value.provider : undefined,
      downloadUrl: typeof value.downloadUrl === "string" ? value.downloadUrl : undefined,
    };
  }

  return null;
};

const normalizeAttachments = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeAttachment).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeAttachments(parsed);
    } catch (_error) {
      return value
        .split(",")
        .map((item) => normalizeAttachment(item))
        .filter(Boolean);
    }
  }

  return [normalizeAttachment(value)].filter(Boolean);
};

const normalizeVersionEntry = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const version = String(value.version || "").trim();

  if (!version) {
    return null;
  }

  return {
    version,
    files: normalizeAttachments(value.files || value.fileUrl),
    uploadedAt: value.uploadedAt ? new Date(value.uploadedAt) : new Date(),
    uploadedBy: typeof value.uploadedBy === "string" ? value.uploadedBy.trim() : "",
  };
};

const normalizeVersionHistory = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeVersionEntry).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      return normalizeVersionHistory(JSON.parse(value));
    } catch (_error) {
      return [];
    }
  }

  return [normalizeVersionEntry(value)].filter(Boolean);
};

const normalizeDesignMeta = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const srNo = Number(value.srNo);

  return {
    srNo: Number.isFinite(srNo) ? srNo : undefined,
    zone: String(value.zone || "").trim(),
    contractName: String(value.contractName || "").trim(),
    station: String(value.station || "").trim(),
    category: String(value.category || "").trim(),
    activity: String(value.activity || "").trim(),
    document: String(value.document || "").trim(),
    revision: String(value.revision || "").trim(),
    status: String(value.status || "").trim(),
  };
};

const normalizeWorkMeta = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  const accuracy = Number(value.accuracy);

  return {
    attendanceDate: String(value.attendanceDate || "").trim(),
    checkInTime: String(value.checkInTime || "").trim(),
    checkOutTime: String(value.checkOutTime || "").trim(),
    staffName: String(value.staffName || "").trim(),
    staffId: String(value.staffId || "").trim(),
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
    locationLabel: String(value.locationLabel || "").trim(),
    purpose: String(value.purpose || "").trim(),
    remarks: String(value.remarks || "").trim(),
  };
};

const normalizeLocoMeta = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const srNo = Number(value.srNo);

  return {
    srNo: Number.isFinite(srNo) ? srNo : undefined,
    trialCondition: String(value.trialCondition || "").trim(),
    locoDetails: String(value.locoDetails || "").trim(),
    trialDate: String(value.trialDate || "").trim(),
    driver: String(value.driver || "").trim(),
    doneBy: String(value.doneBy || "").trim(),
    remarks: String(value.remarks || "").trim(),
  };
};

const normalizeSiteImageMeta = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const srNo = Number(value.srNo);

  return {
    srNo: Number.isFinite(srNo) ? srNo : undefined,
    pssa: String(value.pssa || "").trim(),
    vendor: String(value.vendor || "").trim(),
    station: String(value.station || "").trim(),
    imageDate: String(value.imageDate || "").trim(),
  };
};

const normalizeTelecomMeta = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const srNo = Number(value.srNo);

  return {
    srNo: Number.isFinite(srNo) ? srNo : undefined,
    testDate: String(value.testDate || "").trim(),
    fiberLength: String(value.fiberLength || "").trim(),
    fiberDetails: String(value.fiberDetails || "").trim(),
    wavelength: String(value.wavelength || "").trim(),
    testBy: String(value.testBy || "").trim(),
    remark: String(value.remark || "").trim(),
  };
};

const normalizeAccountsMeta = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const srNo = Number(value.srNo);

  return {
    srNo: Number.isFinite(srNo) ? srNo : undefined,
    contractName: String(value.contractName || "").trim(),
    account: String(value.account || "").trim(),
    category: String(value.category || "").trim(),
    activity: String(value.activity || "").trim(),
    document: String(value.document || "").trim(),
    revision: String(value.revision || "").trim(),
    status: String(value.status || "").trim(),
  };
};

const normalizeCivilFieldValue = (value) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text ? { text, files: [] } : undefined;
  }

  if (typeof value !== "object") {
    return undefined;
  }

  const text = String(value.text || "").trim();
  const files = normalizeAttachments(value.files || value.fileUrl);

  if (!text && !files.length) {
    return undefined;
  }

  return {
    text,
    files,
  };
};

const normalizeCivilMeta = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const srNo = Number(value.srNo);

  return {
    srNo: Number.isFinite(srNo) ? srNo : undefined,
    section: normalizeCivilFieldValue(value.section),
    stationLcGate: normalizeCivilFieldValue(value.stationLcGate),
    tentativeGadRailway: normalizeCivilFieldValue(value.tentativeGadRailway),
    siteSurveyReportByAgency: normalizeCivilFieldValue(value.siteSurveyReportByAgency),
    towerId: normalizeCivilFieldValue(value.towerId),
    completionGadOfTowerByAgency: normalizeCivilFieldValue(value.completionGadOfTowerByAgency),
    cableRoutePlanSignedCopy: normalizeCivilFieldValue(value.cableRoutePlanSignedCopy),
    soilTestBoreLog: normalizeCivilFieldValue(value.soilTestBoreLog),
    soilTestLabReport: normalizeCivilFieldValue(value.soilTestLabReport),
    excavation: normalizeCivilFieldValue(value.excavation),
    pcc: normalizeCivilFieldValue(value.pcc),
    firstStageInspection: normalizeCivilFieldValue(value.firstStageInspection),
    rccFirstLift: normalizeCivilFieldValue(value.rccFirstLift),
    secondStageInspection: normalizeCivilFieldValue(value.secondStageInspection),
    secondLiftFoundationCipFixing: normalizeCivilFieldValue(value.secondLiftFoundationCipFixing),
    thirdStageInspection: normalizeCivilFieldValue(value.thirdStageInspection),
    erectionOfTower: normalizeCivilFieldValue(value.erectionOfTower),
    erectedTowerJpg: normalizeCivilFieldValue(value.erectedTowerJpg),
    fourthStageInspection: normalizeCivilFieldValue(value.fourthStageInspection),
    cableLayingTowerToRelayRoom: normalizeCivilFieldValue(value.cableLayingTowerToRelayRoom),
    earthing: normalizeCivilFieldValue(value.earthing),
  };
};

const mapRecordResponse = (row) => ({
  id: String(row._id),
  department: row.department,
  title: row.title,
  description: row.description,
  fileUrl: row.fileUrl,
  files: normalizeAttachments(row.fileUrl),
  designMeta: row.designMeta,
  workMeta: row.workMeta,
  locoMeta: row.locoMeta,
  siteImageMeta: row.siteImageMeta,
  telecomMeta: row.telecomMeta,
  accountsMeta: row.accountsMeta,
  civilMeta: row.civilMeta,
  versionHistory: normalizeVersionHistory(row.versionHistory),
  anonymous: Boolean(row.anonymous),
  createdBy: row.anonymous ? "Anonymous" : row.createdBy,
  createdAt: row.createdAt,
});

export const dataValidation = [
  body("department").trim().notEmpty().withMessage("Department is required."),
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("description").trim().notEmpty().withMessage("Description is required."),
  body("anonymous").optional().isBoolean().withMessage("Anonymous must be true or false."),
  body("designMeta").optional().isObject().withMessage("Design metadata must be a valid object."),
  body("workMeta").optional().isObject().withMessage("Work metadata must be a valid object."),
  body("locoMeta").optional().isObject().withMessage("Loco metadata must be a valid object."),
  body("siteImageMeta").optional().isObject().withMessage("Site image metadata must be a valid object."),
  body("telecomMeta").optional().isObject().withMessage("Telecom metadata must be a valid object."),
  body("accountsMeta").optional().isObject().withMessage("Accounts metadata must be a valid object."),
  body("civilMeta").optional().isObject().withMessage("Civil metadata must be a valid object."),
  body("versionHistory").optional(),
];

export const dataIdValidation = [param("id").trim().notEmpty().withMessage("Record id is required.")];

export const dataQueryValidation = [
  query("department").optional().trim(),
  query("search").optional().trim(),
];

export const getData = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const queryFilter = {};

    if (department) {
      queryFilter.department = department;
    }

    if (search) {
      queryFilter.$or = [
        { department: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { createdBy: { $regex: search, $options: "i" } },
        { "designMeta.zone": { $regex: search, $options: "i" } },
        { "designMeta.contractName": { $regex: search, $options: "i" } },
        { "designMeta.station": { $regex: search, $options: "i" } },
        { "designMeta.category": { $regex: search, $options: "i" } },
        { "designMeta.activity": { $regex: search, $options: "i" } },
        { "designMeta.document": { $regex: search, $options: "i" } },
        { "designMeta.revision": { $regex: search, $options: "i" } },
        { "designMeta.status": { $regex: search, $options: "i" } },
        { "workMeta.attendanceDate": { $regex: search, $options: "i" } },
        { "workMeta.checkInTime": { $regex: search, $options: "i" } },
        { "workMeta.checkOutTime": { $regex: search, $options: "i" } },
        { "workMeta.staffName": { $regex: search, $options: "i" } },
        { "workMeta.staffId": { $regex: search, $options: "i" } },
        { "workMeta.locationLabel": { $regex: search, $options: "i" } },
        { "workMeta.remarks": { $regex: search, $options: "i" } },
        { "locoMeta.trialCondition": { $regex: search, $options: "i" } },
        { "locoMeta.locoDetails": { $regex: search, $options: "i" } },
        { "locoMeta.trialDate": { $regex: search, $options: "i" } },
        { "locoMeta.driver": { $regex: search, $options: "i" } },
        { "locoMeta.doneBy": { $regex: search, $options: "i" } },
        { "locoMeta.remarks": { $regex: search, $options: "i" } },
        { "siteImageMeta.pssa": { $regex: search, $options: "i" } },
        { "siteImageMeta.vendor": { $regex: search, $options: "i" } },
        { "siteImageMeta.station": { $regex: search, $options: "i" } },
        { "siteImageMeta.imageDate": { $regex: search, $options: "i" } },
        { "telecomMeta.testDate": { $regex: search, $options: "i" } },
        { "telecomMeta.fiberLength": { $regex: search, $options: "i" } },
        { "telecomMeta.fiberDetails": { $regex: search, $options: "i" } },
        { "telecomMeta.wavelength": { $regex: search, $options: "i" } },
        { "telecomMeta.testBy": { $regex: search, $options: "i" } },
        { "telecomMeta.remark": { $regex: search, $options: "i" } },
        { "accountsMeta.contractName": { $regex: search, $options: "i" } },
        { "accountsMeta.account": { $regex: search, $options: "i" } },
        { "accountsMeta.category": { $regex: search, $options: "i" } },
        { "accountsMeta.activity": { $regex: search, $options: "i" } },
        { "accountsMeta.document": { $regex: search, $options: "i" } },
        { "accountsMeta.revision": { $regex: search, $options: "i" } },
        { "accountsMeta.status": { $regex: search, $options: "i" } },
        { "civilMeta.section.text": { $regex: search, $options: "i" } },
        { "civilMeta.stationLcGate.text": { $regex: search, $options: "i" } },
        { "civilMeta.tentativeGadRailway.text": { $regex: search, $options: "i" } },
        { "civilMeta.siteSurveyReportByAgency.text": { $regex: search, $options: "i" } },
        { "civilMeta.towerId.text": { $regex: search, $options: "i" } },
        { "civilMeta.completionGadOfTowerByAgency.text": { $regex: search, $options: "i" } },
        { "civilMeta.cableRoutePlanSignedCopy.text": { $regex: search, $options: "i" } },
        { "civilMeta.soilTestBoreLog.text": { $regex: search, $options: "i" } },
        { "civilMeta.soilTestLabReport.text": { $regex: search, $options: "i" } },
        { "civilMeta.excavation.text": { $regex: search, $options: "i" } },
        { "civilMeta.pcc.text": { $regex: search, $options: "i" } },
        { "civilMeta.firstStageInspection.text": { $regex: search, $options: "i" } },
        { "civilMeta.rccFirstLift.text": { $regex: search, $options: "i" } },
        { "civilMeta.secondStageInspection.text": { $regex: search, $options: "i" } },
        { "civilMeta.secondLiftFoundationCipFixing.text": { $regex: search, $options: "i" } },
        { "civilMeta.thirdStageInspection.text": { $regex: search, $options: "i" } },
        { "civilMeta.erectionOfTower.text": { $regex: search, $options: "i" } },
        { "civilMeta.erectedTowerJpg.text": { $regex: search, $options: "i" } },
        { "civilMeta.fourthStageInspection.text": { $regex: search, $options: "i" } },
        { "civilMeta.cableLayingTowerToRelayRoom.text": { $regex: search, $options: "i" } },
        { "civilMeta.earthing.text": { $regex: search, $options: "i" } },
      ];
    }

    if (req.user.role === "staff") {
      queryFilter.createdByUserId = req.user.id;
    }

    const rows = await DepartmentRecord.find(queryFilter).sort({ createdAt: -1 }).lean();
    const filtered = rows.map((row) => mapRecordResponse(row));

    res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    next(error);
  }
};

export const createData = async (req, res, next) => {
  try {
    const record = await DepartmentRecord.create({
      department: req.body.department,
      title: req.body.title,
      description: req.body.description,
      fileUrl: normalizeAttachments(req.body.fileUrl),
      designMeta: normalizeDesignMeta(req.body.designMeta),
      workMeta: normalizeWorkMeta(req.body.workMeta),
      locoMeta: normalizeLocoMeta(req.body.locoMeta),
      siteImageMeta: normalizeSiteImageMeta(req.body.siteImageMeta),
      telecomMeta: normalizeTelecomMeta(req.body.telecomMeta),
      accountsMeta: normalizeAccountsMeta(req.body.accountsMeta),
      civilMeta: normalizeCivilMeta(req.body.civilMeta),
      versionHistory: normalizeVersionHistory(req.body.versionHistory),
      anonymous: Boolean(req.body.anonymous),
      createdBy: req.user.name,
      createdByUserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Record created successfully.",
      data: mapRecordResponse(record),
    });
  } catch (error) {
    next(error);
  }
};

export const updateData = async (req, res, next) => {
  try {
    const existing = await DepartmentRecord.findById(req.params.id).lean();

    if (!existing) {
      const error = new Error("Record not found.");
      error.statusCode = 404;
      throw error;
    }

    if (req.user.role !== "admin" && String(existing.createdByUserId) !== req.user.id) {
      const error = new Error("You can only update records created by you.");
      error.statusCode = 403;
      throw error;
    }

    const updated = await DepartmentRecord.findByIdAndUpdate(
      req.params.id,
      {
        department: req.body.department,
        title: req.body.title,
        description: req.body.description,
        fileUrl: normalizeAttachments(req.body.fileUrl),
        designMeta: normalizeDesignMeta(req.body.designMeta),
        workMeta: normalizeWorkMeta(req.body.workMeta),
        locoMeta: normalizeLocoMeta(req.body.locoMeta),
        siteImageMeta: normalizeSiteImageMeta(req.body.siteImageMeta),
        telecomMeta: normalizeTelecomMeta(req.body.telecomMeta),
        accountsMeta: normalizeAccountsMeta(req.body.accountsMeta),
        civilMeta: normalizeCivilMeta(req.body.civilMeta),
        versionHistory: normalizeVersionHistory(req.body.versionHistory),
        anonymous: Boolean(req.body.anonymous),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      const error = new Error("Record not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "Record updated successfully.",
      data: mapRecordResponse(updated),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteData = async (req, res, next) => {
  try {
    const deleted = await DepartmentRecord.findByIdAndDelete(req.params.id).lean();

    if (!deleted) {
      const error = new Error("Record not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "Record deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
