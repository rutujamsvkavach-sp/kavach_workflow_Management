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

const mapRecordResponse = (row) => ({
  id: String(row._id),
  department: row.department,
  title: row.title,
  description: row.description,
  fileUrl: row.fileUrl,
  files: normalizeAttachments(row.fileUrl),
  designMeta: row.designMeta,
  workMeta: row.workMeta,
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
