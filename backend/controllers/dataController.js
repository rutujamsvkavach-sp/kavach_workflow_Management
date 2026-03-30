import { body, param, query } from "express-validator";
import DepartmentRecord from "../models/DepartmentRecord.js";

const toFileUrlString = (value) => {
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter(Boolean));
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify([]);
};

const parseFiles = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch (_error) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
};

export const dataValidation = [
  body("department").trim().notEmpty().withMessage("Department is required."),
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("description").trim().notEmpty().withMessage("Description is required."),
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
      ];
    }

    if (req.user.role === "staff") {
      queryFilter.createdByUserId = req.user.id;
    }

    const rows = await DepartmentRecord.find(queryFilter).sort({ createdAt: -1 }).lean();
    const filtered = rows.map((row) => ({
      id: String(row._id),
      department: row.department,
      title: row.title,
      description: row.description,
      fileUrl: row.fileUrl,
      files: parseFiles(row.fileUrl),
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    }));

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
      fileUrl: Array.isArray(req.body.fileUrl) ? req.body.fileUrl.filter(Boolean) : parseFiles(req.body.fileUrl),
      createdBy: req.user.name,
      createdByUserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Record created successfully.",
      data: {
        id: String(record._id),
        department: record.department,
        title: record.title,
        description: record.description,
        fileUrl: record.fileUrl,
        files: parseFiles(record.fileUrl),
        createdBy: record.createdBy,
        createdAt: record.createdAt,
      },
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
        fileUrl: Array.isArray(req.body.fileUrl) ? req.body.fileUrl.filter(Boolean) : parseFiles(req.body.fileUrl),
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
      data: {
        id: String(updated._id),
        department: updated.department,
        title: updated.title,
        description: updated.description,
        fileUrl: updated.fileUrl,
        files: parseFiles(updated.fileUrl),
        createdBy: updated.createdBy,
        createdAt: updated.createdAt,
      },
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
