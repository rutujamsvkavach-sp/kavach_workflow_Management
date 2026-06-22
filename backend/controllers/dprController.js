import { body, param, query } from "express-validator";
import { resolveUserDepartments } from "../constants/departments.js";
import DprEntry from "../models/DprEntry.js";

const normalizeDate = (value) => {
  const input = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return "";
  }

  return input;
};

const mapEntry = (entry) => ({
  id: String(entry._id),
  reportDate: entry.reportDate,
  department: entry.department,
  staff: entry.staff,
  actualResponsibility: entry.actualResponsibility,
  todaysResponsibility: entry.todaysResponsibility,
  workDone: entry.workDone,
  inProgress: entry.inProgress,
  deficiency: entry.deficiency,
  updatedByName: entry.updatedByName,
  updatedAt: entry.updatedAt,
  createdAt: entry.createdAt,
  deletedAt: entry.deletedAt,
  deletedByName: entry.deletedByName || "",
});

const assertDepartmentAccess = (user, requestedDepartment) => {
  if (user.role !== "staff") {
    return;
  }

  const assignedDepartments = resolveUserDepartments(user);

  if (!assignedDepartments.length) {
    const error = new Error("Your account has not been assigned to any department. Please contact an administrator.");
    error.statusCode = 403;
    throw error;
  }

  if (requestedDepartment && !assignedDepartments.includes(requestedDepartment)) {
    const error = new Error("You can only access your assigned departments.");
    error.statusCode = 403;
    throw error;
  }
};

export const dprQueryValidation = [query("date").notEmpty().withMessage("Date is required.").isISO8601().withMessage("Date must be valid.")];
export const dprRangeQueryValidation = [
  query("startDate").notEmpty().withMessage("Start date is required.").isISO8601().withMessage("Start date must be valid."),
  query("endDate").notEmpty().withMessage("End date is required.").isISO8601().withMessage("End date must be valid."),
];

export const dprValidation = [
  body("reportDate").notEmpty().withMessage("Report date is required.").isISO8601().withMessage("Report date must be valid."),
  body("department").trim().notEmpty().withMessage("Department is required."),
  body("staff").trim().notEmpty().withMessage("Staff is required."),
  body("actualResponsibility").optional({ values: "falsy" }).isString(),
  body("todaysResponsibility").optional({ values: "falsy" }).isString(),
  body("workDone").optional({ values: "falsy" }).isString(),
  body("inProgress").optional({ values: "falsy" }).isString(),
  body("deficiency").optional({ values: "falsy" }).isString(),
];

export const dprIdValidation = [param("id").trim().notEmpty().withMessage("DPR entry id is required.")];

export const getDprEntries = async (req, res, next) => {
  try {
    const reportDate = normalizeDate(req.query.date);
    const queryFilter = { reportDate, deletedAt: null };

    if (req.user.role === "staff") {
      assertDepartmentAccess(req.user);
      queryFilter.department = { $in: resolveUserDepartments(req.user) };
    }

    const rows = await DprEntry.find(queryFilter).sort({ department: 1, updatedAt: -1 }).lean();

    res.json({
      success: true,
      data: rows.map(mapEntry),
    });
  } catch (error) {
    next(error);
  }
};

export const getDprEntriesByRange = async (req, res, next) => {
  try {
    const startDate = normalizeDate(req.query.startDate);
    const endDate = normalizeDate(req.query.endDate);

    const queryFilter = {
      reportDate: {
        $gte: startDate,
        $lte: endDate,
      },
      deletedAt: null,
    };

    if (req.user.role === "staff") {
      assertDepartmentAccess(req.user);
      queryFilter.department = { $in: resolveUserDepartments(req.user) };
    }

    const rows = await DprEntry.find(queryFilter)
      .sort({ reportDate: -1, department: 1, updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: rows.map(mapEntry),
    });
  } catch (error) {
    next(error);
  }
};

export const createDprEntry = async (req, res, next) => {
  try {
    assertDepartmentAccess(req.user, req.body.department);

    const entry = await DprEntry.create({
      reportDate: normalizeDate(req.body.reportDate),
      department: req.body.department,
      staff: req.body.staff,
      actualResponsibility: req.body.actualResponsibility || "",
      todaysResponsibility: req.body.todaysResponsibility || "",
      workDone: req.body.workDone || "",
      inProgress: req.body.inProgress || "",
      deficiency: req.body.deficiency || "",
      updatedByName: req.user.name,
      updatedByUserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "DPR row created successfully.",
      data: mapEntry(entry),
    });
  } catch (error) {
    next(error);
  }
};

export const updateDprEntry = async (req, res, next) => {
  try {
    const existing = await DprEntry.findById(req.params.id).lean();

    if (!existing) {
      const error = new Error("DPR row not found.");
      error.statusCode = 404;
      throw error;
    }

    assertDepartmentAccess(req.user, existing.department);
    assertDepartmentAccess(req.user, req.body.department);

    const updated = await DprEntry.findByIdAndUpdate(
      req.params.id,
      {
        reportDate: normalizeDate(req.body.reportDate),
        department: req.body.department,
        staff: req.body.staff,
        actualResponsibility: req.body.actualResponsibility || "",
        todaysResponsibility: req.body.todaysResponsibility || "",
        workDone: req.body.workDone || "",
        inProgress: req.body.inProgress || "",
        deficiency: req.body.deficiency || "",
        updatedByName: req.user.name,
        updatedByUserId: req.user.id,
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      const error = new Error("DPR row not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "DPR row updated successfully.",
      data: mapEntry(updated),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDprEntry = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      const error = new Error("Only admins can delete DPR rows.");
      error.statusCode = 403;
      throw error;
    }

    const deleted = await DprEntry.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      {
        deletedAt: new Date(),
        deletedByUserId: req.user.id,
        deletedByName: req.user.name,
      },
      { new: true }
    ).lean();

    if (!deleted) {
      const error = new Error("DPR row not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "DPR row deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const getDeletedDprEntries = async (_req, res, next) => {
  try {
    const rows = await DprEntry.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 }).lean();

    res.json({
      success: true,
      data: rows.map(mapEntry),
    });
  } catch (error) {
    next(error);
  }
};

export const restoreDprEntry = async (req, res, next) => {
  try {
    const restored = await DprEntry.findOneAndUpdate(
      { _id: req.params.id, deletedAt: { $ne: null } },
      {
        deletedAt: null,
        deletedByUserId: null,
        deletedByName: "",
      },
      { new: true }
    ).lean();

    if (!restored) {
      const error = new Error("Deleted DPR row not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "DPR row restored successfully.",
      data: mapEntry(restored),
    });
  } catch (error) {
    next(error);
  }
};
