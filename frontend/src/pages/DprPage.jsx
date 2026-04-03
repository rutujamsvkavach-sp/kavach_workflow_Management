import { Download, FileSpreadsheet, Plus, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";
import { departments } from "../constants/departments";
import { useAuth } from "../context/AuthContext";
import { dprApi } from "../services/api";

const DPR_ROW_FIELDS = [
  { key: "department", label: "Department" },
  { key: "staff", label: "Staff" },
  { key: "actualResponsibility", label: "Actual Responsibility" },
  { key: "todaysResponsibility", label: "Today's Responsibility" },
  { key: "workDone", label: "Work Done" },
  { key: "inProgress", label: "In Progress" },
  { key: "deficiency", label: "Deficiency" },
];

const createEmptyRow = (reportDate) => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  reportDate,
  department: departments[0] || "DPR",
  staff: "",
  actualResponsibility: "",
  todaysResponsibility: "",
  workDone: "",
  inProgress: "",
  deficiency: "",
  isDraft: true,
});

const escapeCsvValue = (value) => `"${String(value || "").replace(/"/g, '""')}"`;

const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const normalizeForSearch = (value) => String(value || "").trim().toLowerCase();

const buildExportRows = (rows) =>
  rows.map((row) => [
    row.department,
    row.staff,
    row.actualResponsibility,
    row.todaysResponsibility,
    row.workDone,
    row.inProgress,
    row.deficiency,
  ]);

const buildExcelTableMarkup = (rows) => {
  const headerCells = DPR_ROW_FIELDS.map((field) => `<th>${field.label}</th>`).join("");
  const bodyRows = buildExportRows(rows)
    .map((row) => `<tr>${row.map((value) => `<td>${String(value || "")}</td>`).join("")}</tr>`)
    .join("");

  return `
    <table>
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `;
};

const DprPage = () => {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchValue, setSearchValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState("");
  const [deletingRowId, setDeletingRowId] = useState("");

  const loadRows = async (date) => {
    setLoading(true);

    try {
      const response = await dprApi.getAll(date);
      setRows(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load DPR data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows(selectedDate);
  }, [selectedDate]);

  const sortedRows = useMemo(() => {
    const normalizedSearch = normalizeForSearch(searchValue);
    const filteredRows = normalizedSearch
      ? rows.filter((row) =>
          [
            row.department,
            row.staff,
            row.actualResponsibility,
            row.todaysResponsibility,
            row.workDone,
            row.inProgress,
            row.deficiency,
          ]
            .map(normalizeForSearch)
            .some((value) => value.includes(normalizedSearch))
        )
      : rows;

    return [...filteredRows].sort((first, second) => {
        const departmentCompare = first.department.localeCompare(second.department);

        if (departmentCompare !== 0) {
          return departmentCompare;
        }

        return first.staff.localeCompare(second.staff);
      });
  }, [rows, searchValue]);

  const handleChange = (rowId, field, value) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
              reportDate: selectedDate,
            }
          : row
      )
    );
  };

  const handleAddRow = () => {
    setRows((current) => [createEmptyRow(selectedDate), ...current]);
  };

  const handleSaveRow = async (row) => {
    if (!row.department.trim() || !row.staff.trim()) {
      toast.error("Department and staff are required.");
      return;
    }

    setSavingRowId(row.id);

    try {
      const payload = {
        reportDate: selectedDate,
        department: row.department,
        staff: row.staff,
        actualResponsibility: row.actualResponsibility,
        todaysResponsibility: row.todaysResponsibility,
        workDone: row.workDone,
        inProgress: row.inProgress,
        deficiency: row.deficiency,
      };

      const response = row.isDraft ? await dprApi.create(payload) : await dprApi.update(row.id, payload);
      const savedRow = response.data.data;

      setRows((current) => current.map((item) => (item.id === row.id ? savedRow : item)));
      toast.success(row.isDraft ? "DPR row added." : "DPR row updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save DPR row.");
    } finally {
      setSavingRowId("");
    }
  };

  const handleDeleteRow = async (row) => {
    if (row.isDraft) {
      setRows((current) => current.filter((item) => item.id !== row.id));
      return;
    }

    setDeletingRowId(row.id);

    try {
      await dprApi.remove(row.id);
      setRows((current) => current.filter((item) => item.id !== row.id));
      toast.success("DPR row deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete DPR row.");
    } finally {
      setDeletingRowId("");
    }
  };

  const handleExportCsv = () => {
    const header = DPR_ROW_FIELDS.map((field) => field.label).join(",");
    const dataRows = buildExportRows(sortedRows).map((row) => row.map(escapeCsvValue).join(","));

    downloadBlob([header, ...dataRows].join("\n"), `dpr-${selectedDate}.csv`, "text/csv;charset=utf-8;");
  };

  const handleDownloadExcel = () => {
    downloadBlob(buildExcelTableMarkup(sortedRows), `dpr-${selectedDate}.xls`, "application/vnd.ms-excel;charset=utf-8;");
  };

  const handleDownloadTemplate = () => {
    const header = DPR_ROW_FIELDS.map((field) => field.label).join(",");
    downloadBlob(`${header}\n`, "dpr-template.csv", "text/csv;charset=utf-8;");
  };

  return (
    <AppShell
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search DPR by department, staff, work done, deficiency..."
    >
      <PageHeader
        eyebrow="Daily Progress Report"
        title="DPR Daily Responsibility Sheet"
        description="Change the calendar date to load that day's DPR rows. Any signed-in user can add and update entries for the selected day. Delete and restore are admin-only."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-body transition hover:bg-slate-50"
            >
              <Download size={16} />
              Download Template
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-50"
            >
              <Download size={16} />
              Download Excel
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover"
            >
              <Plus size={18} />
              Add Row
            </button>
          </div>
        }
      />

      <div className="mb-5 rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Calendar Filter</p>
            <h2 className="mt-2 text-2xl font-semibold text-body">Selected Date: {selectedDate}</h2>
            <p className="mt-2 text-sm text-slate-500">Switch the date to view and maintain the DPR entries for that specific day.</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <label className="space-y-2 text-sm font-medium text-body">
              Report Date
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full min-w-[220px] rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-500">
              <Search size={16} />
              <span>{sortedRows.length} rows shown</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading DPR rows..." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] divide-y divide-border">
              <thead className="bg-primary text-white">
                <tr>
                  {DPR_ROW_FIELDS.map((field) => (
                    <th key={field.key} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedRows.length ? (
                  sortedRows.map((row) => (
                    <tr key={row.id} className="align-top transition hover:bg-blue-50/50">
                      <td className="px-4 py-4">
                        <select
                          value={row.department}
                          onChange={(event) => handleChange(row.id, "department", event.target.value)}
                          className="w-48 rounded-lg border border-border px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        >
                          {departments.map((department) => (
                            <option key={department} value={department}>
                              {department}
                            </option>
                          ))}
                        </select>
                      </td>
                      {DPR_ROW_FIELDS.slice(1).map((field) => (
                        <td key={field.key} className="px-4 py-4">
                          <textarea
                            rows={3}
                            value={row[field.key] || ""}
                            onChange={(event) => handleChange(row.id, field.key, event.target.value)}
                            className="min-w-[220px] rounded-lg border border-border px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-4">
                        <div className="flex min-w-[180px] flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(row)}
                            disabled={savingRowId === row.id}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Save size={14} />
                            {savingRowId === row.id ? "Saving..." : "Save"}
                          </button>
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row)}
                              disabled={deletingRowId === row.id}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Trash2 size={14} />
                              {deletingRowId === row.id ? "Deleting..." : "Delete"}
                            </button>
                          ) : null}
                          {!row.isDraft ? (
                            <p className="text-xs leading-5 text-slate-500">Last updated by {row.updatedByName}</p>
                          ) : (
                            <p className="text-xs leading-5 text-slate-400">New row for {selectedDate}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={DPR_ROW_FIELDS.length + 1} className="px-4 py-16 text-center text-sm text-slate-500">
                      No DPR rows found for {selectedDate}. Add the first row to start that day's report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default DprPage;
