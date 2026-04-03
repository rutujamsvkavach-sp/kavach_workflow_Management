import {
  Camera,
  Download,
  FileSpreadsheet,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import PageHeader from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { recordsApi, uploadApi } from "../services/api";
import { getFileName, getFileUrl } from "../utils/files";

const DEPARTMENT_NAME = "WORKS";

const emptyForm = {
  attendanceDate: new Date().toISOString().slice(0, 10),
  checkInTime: "",
  checkOutTime: "",
  locationLabel: "",
  latitude: "",
  longitude: "",
  accuracy: "",
  purpose: "",
  files: [],
};

const csvEscape = (value) => `"${String(value || "").replace(/"/g, '""')}"`;

const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const buildExcelTableMarkup = (records) => {
  const headers = ["Sr.No.", "Staff Name", "GPS Location", "In Time", "Out Time", "Purpose"];
  const rows = records
    .map(
      (record) => `
        <tr>
          <td>${record.srNo}</td>
          <td>${record.staffName}</td>
          <td>${record.gpsLocation}</td>
          <td>${record.checkInTime}</td>
          <td>${record.checkOutTime}</td>
          <td>${record.purpose}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table>
      <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const buildPayload = (form, user) => ({
  department: DEPARTMENT_NAME,
  title: `${user.name} Attendance`,
  description: form.purpose || `${user.name} daily attendance`,
  fileUrl: form.files,
  workMeta: {
    attendanceDate: form.attendanceDate,
    checkInTime: form.checkInTime,
    checkOutTime: form.checkOutTime,
    staffName: user.name,
    staffId: user.staffId,
    latitude: form.latitude ? Number(form.latitude) : undefined,
    longitude: form.longitude ? Number(form.longitude) : undefined,
    accuracy: form.accuracy ? Number(form.accuracy) : undefined,
    locationLabel: form.locationLabel,
    purpose: form.purpose,
  },
});

const normalizeRecord = (record, index) => {
  const latitude = record.workMeta?.latitude;
  const longitude = record.workMeta?.longitude;
  const accuracy = record.workMeta?.accuracy;
  const label = record.workMeta?.locationLabel || "";
  const gpsLocation = latitude && longitude ? `${latitude}, ${longitude}${accuracy ? ` (${accuracy}m)` : ""}` : label || "-";

  return {
    ...record,
    srNo: index + 1,
    attendanceDate: record.workMeta?.attendanceDate || "",
    checkInTime: record.workMeta?.checkInTime || "",
    checkOutTime: record.workMeta?.checkOutTime || "",
    staffName: record.workMeta?.staffName || record.createdBy || "",
    staffId: record.workMeta?.staffId || "",
    latitude,
    longitude,
    accuracy,
    locationLabel: label,
    gpsLocation,
    purpose: record.workMeta?.purpose || record.description || "",
    files: record.files || [],
  };
};

const AttendanceModal = ({ open, onClose, onSubmit, record, user }) => {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      setForm({
        attendanceDate: record.attendanceDate || new Date().toISOString().slice(0, 10),
        checkInTime: record.checkInTime || "",
        checkOutTime: record.checkOutTime || "",
        locationLabel: record.locationLabel || "",
        latitude: record.latitude ?? "",
        longitude: record.longitude ?? "",
        accuracy: record.accuracy ?? "",
        purpose: record.purpose || "",
        files: record.files || [],
      });
      return;
    }

    setForm({
      ...emptyForm,
      checkInTime: new Date().toTimeString().slice(0, 5),
    });
  }, [open, record]);

  if (!open) {
    return null;
  }

  const handleSelfieUpload = async (event) => {
    const files = event.target.files;

    if (!files?.length) {
      return;
    }

    setUploading(true);

    try {
      const payload = new FormData();
      [...files].forEach((file) => payload.append("files", file));
      const response = await uploadApi.uploadFiles(payload);
      setForm((current) => ({
        ...current,
        files: response.data.data,
      }));
      toast.success("Selfie uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload selfie.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }

    setCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy),
        }));
        setCapturingLocation(false);
        toast.success("GPS location captured.");
      },
      (error) => {
        setCapturingLocation(false);
        toast.error(error.message || "Unable to capture GPS location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-4xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Staff Attendance</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record ? "Edit Attendance Row" : "Add Attendance Row"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-body">
              Attendance Date
              <input type="date" value={form.attendanceDate} onChange={(event) => setForm((current) => ({ ...current, attendanceDate: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Staff Name
              <input type="text" value={user.name} disabled className="w-full rounded-lg border border-border bg-slate-50 px-4 py-3 text-slate-500" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              In Time
              <input type="time" value={form.checkInTime} onChange={(event) => setForm((current) => ({ ...current, checkInTime: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Out Time
              <input type="time" value={form.checkOutTime} onChange={(event) => setForm((current) => ({ ...current, checkOutTime: event.target.value }))} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-body">
              GPS / Location Label
              <input type="text" value={form.locationLabel} onChange={(event) => setForm((current) => ({ ...current, locationLabel: event.target.value }))} placeholder="Site name, station, or landmark" className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <div className="space-y-2 text-sm font-medium text-body">
              Capture GPS
              <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                <button type="button" onClick={captureLocation} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-hover">
                  <MapPinned size={16} />
                  {capturingLocation ? "Capturing..." : "Capture GPS"}
                </button>
                <span className="text-sm text-slate-500">
                  {form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}${form.accuracy ? ` (${form.accuracy}m)` : ""}` : "No GPS captured yet"}
                </span>
              </div>
            </div>
          </div>

          <label className="block space-y-2 text-sm font-medium text-body">
            Purpose
            <textarea rows={4} value={form.purpose} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Enter today’s attendance purpose or work objective" className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </label>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <Camera size={22} />
                </div>
                <div>
                  <p className="font-semibold text-body">Upload Selfie</p>
                  <p className="text-sm text-slate-500">Attach selfie images for attendance proof.</p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover">
                {uploading ? "Uploading..." : "Select Selfie"}
                <input type="file" multiple accept="image/*" capture="user" className="hidden" onChange={handleSelfieUpload} />
              </label>
            </div>

            {form.files.length ? (
              <div className="mt-4 space-y-2">
                {form.files.map((file) => (
                  <div key={`${getFileUrl(file)}-${getFileName(file)}`} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                    <a href={getFileUrl(file)} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-primary hover:underline">
                      {getFileName(file)}
                    </a>
                    <button type="button" onClick={() => setForm((current) => ({ ...current, files: current.files.filter((item) => getFileUrl(item) !== getFileUrl(file)) }))} className="text-sm font-semibold text-accent">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-body transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover">
              {record ? "Update Attendance" : "Add Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WorksAttendancePage = () => {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await recordsApi.getAll({ department: DEPARTMENT_NAME });
      setRecords(response.data.data.map(normalizeRecord));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const dateFilteredRecords = useMemo(
    () => records.filter((record) => !selectedDate || record.attendanceDate === selectedDate),
    [records, selectedDate]
  );

  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return dateFilteredRecords
      .filter((record) => {
        if (!normalized) {
          return true;
        }

        return [record.staffName, record.gpsLocation, record.checkInTime, record.checkOutTime, record.purpose]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .map((record, index) => ({ ...record, srNo: index + 1 }));
  }, [dateFilteredRecords, search]);

  const handleSave = async (form) => {
    try {
      const payload = buildPayload(form, user);

      if (selectedRecord) {
        await recordsApi.update(selectedRecord.id, payload);
        toast.success("Attendance updated.");
      } else {
        await recordsApi.create(payload);
        toast.success("Attendance added.");
      }

      setModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save attendance.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await recordsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Attendance deleted.");
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete attendance.");
    }
  };

  const handleExportCsv = () => {
    const headers = ["Sr.No.", "Staff Name", "GPS Location", "In Time", "Out Time", "Purpose"];
    const rows = filteredRecords.map((record) =>
      [record.srNo, record.staffName, record.gpsLocation, record.checkInTime, record.checkOutTime, record.purpose].map(csvEscape).join(",")
    );

    downloadBlob([headers.join(","), ...rows].join("\n"), `works-attendance-${selectedDate || "all"}.csv`, "text/csv;charset=utf-8;");
  };

  const handleDownloadExcel = () => {
    downloadBlob(
      buildExcelTableMarkup(filteredRecords),
      `works-attendance-${selectedDate || "all"}.xls`,
      "application/vnd.ms-excel;charset=utf-8;"
    );
  };

  return (
    <AppShell searchValue="" onSearchChange={() => {}} searchPlaceholder="Use the attendance tools below." searchDisabled>
      <PageHeader
        eyebrow="Works Attendance"
        title="WORKS"
        description="Manage staff daily attendance with calendar filtering, GPS location, in and out timing, purpose tracking, selfie proof, and export tools."
        action={
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10">
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
            <button type="button" onClick={handleDownloadExcel} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-50">
              <Download size={16} />
              Download Excel
            </button>
            <button type="button" onClick={() => { setSelectedRecord(null); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover">
              <Plus size={18} />
              Add Attendance
            </button>
          </div>
        }
      />

      {loading ? (
        <Spinner label="Loading works attendance..." />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Selected Day</p>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="mt-3 w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Attendance Rows</p>
              <p className="mt-3 font-display text-4xl text-body">{dateFilteredRecords.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Visible Rows</p>
              <p className="mt-3 font-display text-4xl text-body">{filteredRecords.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Selfies</p>
              <p className="mt-3 font-display text-4xl text-body">{dateFilteredRecords.reduce((sum, record) => sum + (record.files?.length || 0), 0)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <label className="space-y-2 text-sm font-medium text-body">
              Search
              <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3">
                <Search size={16} className="text-slate-400" />
                <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by staff name, GPS location, in time, out time, or purpose" className="w-full border-none bg-transparent text-sm outline-none" />
              </div>
            </label>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-[1280px] divide-y divide-border">
                <thead className="bg-primary text-white">
                  <tr>
                    {["Sr.No.", "Staff Name", "GPS Location", "In Time", "Out Time", "Purpose", "Selfie", "Action"].map((label) => (
                      <th key={label} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.length ? (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="transition hover:bg-blue-50/60">
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.srNo}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.staffName}</td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-2 text-sm text-slate-600">
                            <MapPinned size={16} className="mt-0.5 text-primary" />
                            <div>
                              <p>{record.gpsLocation}</p>
                              {record.locationLabel && record.gpsLocation !== record.locationLabel ? <p className="text-xs text-slate-500">{record.locationLabel}</p> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.checkInTime || "-"}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.checkOutTime || "-"}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.purpose || "-"}</td>
                        <td className="px-4 py-4 align-top">
                          {record.files.length ? (
                            <div className="space-y-2">
                              {record.files.map((file) => (
                                <a key={`${getFileUrl(file)}-${getFileName(file)}`} href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                                  <Camera size={14} />
                                  {getFileName(file)}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">No selfie</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => { setSelectedRecord(record); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover">
                              <Pencil size={14} />
                              Edit
                            </button>
                            {canDelete ? (
                              <button type="button" onClick={() => setDeleteTarget(record)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
                                <Trash2 size={14} />
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-16 text-center text-sm text-slate-500">
                        No attendance rows available for the selected date and search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AttendanceModal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedRecord(null); }} onSubmit={handleSave} record={selectedRecord} user={user} />

      {canDelete ? <ConfirmationModal open={Boolean(deleteTarget)} title="Delete attendance row?" description="This moves the selected works attendance row to the admin restore bin." confirmLabel="Delete Attendance" onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} /> : null}
    </AppShell>
  );
};

export default WorksAttendancePage;
