import { body, param, query } from "express-validator";
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
});

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
    const rows = await DprEntry.find({ reportDate }).sort({ department: 1, updatedAt: -1 }).lean();

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

    const rows = await DprEntry.find({
      reportDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
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
    const deleted = await DprEntry.findByIdAndDelete(req.params.id).lean();

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
