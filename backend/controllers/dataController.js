import { body, param, query } from "express-validator";
import { appendRow, deleteRowById, getAllRows, sheetNames, updateRowById } from "../services/googleSheets.js";
import { v4 as uuidv4 } from "uuid";

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
    const rows = await getAllRows(sheetNames.departments);

    const filtered = rows
      .map(({ _rowNumber, ...row }) => ({
        ...row,
        files: parseFiles(row.fileUrl),
      }))
      .filter((row) => {
        const departmentMatch = department ? row.department === department : true;
        const searchTerm = String(search || "").toLowerCase();
        const searchMatch = searchTerm
          ? [row.department, row.title, row.description, row.createdBy].some((field) =>
              String(field || "").toLowerCase().includes(searchTerm)
            )
          : true;

        if (req.user.role === "staff") {
          return departmentMatch && searchMatch && row.createdBy === req.user.name;
        }

        return departmentMatch && searchMatch;
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

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
    const record = {
      id: uuidv4(),
      department: req.body.department,
      title: req.body.title,
      description: req.body.description,
      fileUrl: toFileUrlString(req.body.fileUrl),
      createdBy: req.user.name,
      createdAt: new Date().toISOString(),
    };

    await appendRow(sheetNames.departments, record);

    res.status(201).json({
      success: true,
      message: "Record created successfully.",
      data: {
        id: record.id,
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
    const rows = await getAllRows(sheetNames.departments);
    const existing = rows.find((row) => row.id === req.params.id);

    if (!existing) {
      const error = new Error("Record not found.");
      error.statusCode = 404;
      throw error;
    }

    if (req.user.role !== "admin" && existing.createdBy !== req.user.name) {
      const error = new Error("You can only update records created by you.");
      error.statusCode = 403;
      throw error;
    }

    const updated = await updateRowById(sheetNames.departments, req.params.id, {
      department: req.body.department,
      title: req.body.title,
      description: req.body.description,
      fileUrl: toFileUrlString(req.body.fileUrl),
    });

    if (!updated) {
      const error = new Error("Record not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "Record updated successfully.",
      data: {
        id: updated.id,
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
    const deleted = await deleteRowById(sheetNames.departments, req.params.id);

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
