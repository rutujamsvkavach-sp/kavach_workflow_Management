import {
  Download,
  FileSpreadsheet,
  History,
  Image as ImageIcon,
  Link2,
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
import { uploadApi, recordsApi } from "../services/api";
import { getFileName, getFileUrl } from "../utils/files";

const DEPARTMENT_NAME = "LOCO TRIALS";
const TRIAL_CONDITIONS = ["HEAD ON", "REAR END", "MANUAL SOS", "UNUSUAL SOS"];
const DOCUMENT_TYPE_OPTIONS = [
  { value: "file", label: "Upload File" },
  { value: "image", label: "Upload Image" },
  { value: "link", label: "Use Link" },
];

const emptyForm = {
  trialCondition: "",
  locoDetails: "",
  trialDate: new Date().toISOString().slice(0, 10),
  driver: "",
  doneBy: "",
  remarks: "",
  documentType: "file",
  documentLink: "",
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
  const headers = ["Sr.No.", "Loco Details", "Trial Date", "Driver", "Done By", "Remarks"];
  const rows = records
    .map(
      (record) => `
        <tr>
          <td>${record.srNo}</td>
          <td>${record.locoDetails}</td>
          <td>${record.trialDate}</td>
          <td>${record.driver}</td>
          <td>${record.doneBy}</td>
          <td>${record.remarks}</td>
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

const isHttpUrl = (value) => /^https?:\/\//i.test(value.trim());

const truncateUrl = (value, limit = 34) => {
  if (!value || value.length <= limit) {
    return value || "";
  }

  return `${value.slice(0, limit - 3)}...`;
};

const hasImageAttachment = (files = []) =>
  files.some((file) => {
    const candidate = `${file?.mimeType || ""} ${getFileName(file)} ${getFileUrl(file)}`.toLowerCase();
    return candidate.includes("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(candidate);
  });

const getDocumentType = (record) => {
  const explicit = record?.locoMeta?.documentType || record?.documentType;
  if (explicit) {
    return explicit;
  }

  if ((record?.locoMeta?.documentLink || record?.documentLink) && !(record?.files || []).length) {
    return "link";
  }

  return hasImageAttachment(record?.files) ? "image" : "file";
};

const buildPayload = (form, srNo) => ({
  department: DEPARTMENT_NAME,
  title: form.locoDetails || `Loco Trial ${srNo}`,
  description: form.remarks || form.trialCondition || "Loco trial record",
  fileUrl: form.documentType === "link" ? [] : form.files,
  documentType: form.documentType,
  documentLink: form.documentType === "link" ? form.documentLink.trim() : "",
  locoMeta: {
    srNo,
    trialCondition: form.trialCondition,
    locoDetails: form.locoDetails,
    trialDate: form.trialDate,
    driver: form.driver,
    doneBy: form.doneBy,
    remarks: form.remarks,
    documentType: form.documentType,
    documentLink: form.documentType === "link" ? form.documentLink.trim() : "",
  },
});

const normalizeRecord = (record, index) => ({
  ...record,
  srNo: record.locoMeta?.srNo || index + 1,
  trialCondition: record.locoMeta?.trialCondition || "",
  locoDetails: record.locoMeta?.locoDetails || record.title || "",
  trialDate: record.locoMeta?.trialDate || "",
  driver: record.locoMeta?.driver || "",
  doneBy: record.locoMeta?.doneBy || "",
  remarks: record.locoMeta?.remarks || record.description || "",
  documentType: getDocumentType(record),
  documentLink: record.locoMeta?.documentLink || record.documentLink || "",
  files: record.files || [],
});

const LocoTrialModal = ({ open, onClose, onSubmit, record, nextSrNo }) => {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      setForm({
        trialCondition: record.trialCondition,
        locoDetails: record.locoDetails,
        trialDate: record.trialDate || new Date().toISOString().slice(0, 10),
        driver: record.driver,
        doneBy: record.doneBy,
        remarks: record.remarks,
        documentType: record.documentType || "file",
        documentLink: record.documentLink || "",
        files: record.files || [],
      });
      setErrors({});
      return;
    }

    setForm(emptyForm);
    setErrors({});
  }, [open, record]);

  if (!open) {
    return null;
  }

  const handleUpload = async (event) => {
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
      setErrors((current) => ({ ...current, documentSource: "" }));
      toast.success("Trial files uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload trial files.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDocumentTypeChange = (documentType) => {
    setForm((current) => ({
      ...current,
      documentType,
      files: documentType === "link" ? [] : current.files,
      documentLink: documentType === "link" ? current.documentLink : "",
    }));
    setErrors((current) => ({ ...current, documentSource: "", documentLink: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (form.documentType === "link") {
      if (!form.documentLink.trim()) {
        nextErrors.documentLink = "Please enter a document URL.";
      } else if (!isHttpUrl(form.documentLink)) {
        nextErrors.documentLink = "Please enter a valid URL starting with http:// or https://.";
      }
    } else if (!form.files.length) {
      nextErrors.documentSource = "Please upload at least one file or image.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(form, record?.srNo || nextSrNo);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-4xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Loco Trial Record</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record ? "Edit Trial Row" : "Add Trial Row"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-body">
              Trial Condition
              <select value={form.trialCondition} onChange={(event) => setForm((current) => ({ ...current, trialCondition: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="">Select Trial Condition</option>
                {TRIAL_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Loco Details
              <input type="text" value={form.locoDetails} onChange={(event) => setForm((current) => ({ ...current, locoDetails: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Trial Date
              <input type="date" value={form.trialDate} onChange={(event) => setForm((current) => ({ ...current, trialDate: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Driver
              <input type="text" value={form.driver} onChange={(event) => setForm((current) => ({ ...current, driver: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-body">
              Done By
              <input type="text" value={form.doneBy} onChange={(event) => setForm((current) => ({ ...current, doneBy: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Remarks
              <input type="text" value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
          </div>

          <div className="rounded-lg border border-border bg-slate-50 p-2">
            <div className="grid gap-2 md:grid-cols-3">
              {DOCUMENT_TYPE_OPTIONS.map((option) => {
                const active = form.documentType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleDocumentTypeChange(option.value)}
                    className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      active ? "bg-primary text-white shadow-sm" : "bg-white text-body hover:bg-slate-100"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {form.documentType === "link" ? (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <label className="space-y-2 text-sm font-medium text-body">
                Document URL
                <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <Link2 size={18} className="text-primary" />
                  <input
                    type="url"
                    value={form.documentLink}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((current) => ({ ...current, documentLink: value }));
                      setErrors((current) => ({ ...current, documentLink: "" }));
                    }}
                    placeholder="Paste Google Drive / OneDrive / Any File Link"
                    className="w-full border-none bg-transparent text-sm outline-none"
                  />
                </div>
              </label>
              {errors.documentLink ? <p className="mt-3 text-sm font-medium text-accent">{errors.documentLink}</p> : null}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                    {form.documentType === "image" ? <ImageIcon size={22} /> : <UploadCloud size={22} />}
                  </div>
                  <div>
                    <p className="font-semibold text-body">
                      {form.documentType === "image" ? "Upload trial image" : "Upload trial file"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {form.documentType === "image"
                        ? "Attach one or more images for this loco trial row."
                        : "Attach one or more files for this loco trial row."}
                    </p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover">
                  {uploading ? "Uploading..." : form.documentType === "image" ? "Select Images" : "Select Files"}
                  <input
                    type="file"
                    multiple
                    accept={form.documentType === "image" ? "image/*" : ".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp"}
                    className="hidden"
                    onChange={handleUpload}
                  />
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

              {errors.documentSource ? <p className="mt-3 text-sm font-medium text-accent">{errors.documentSource}</p> : null}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-body transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover">
              {record ? "Update Trial" : "Add Trial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LocoTrialsPage = () => {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [trialConditionFilter, setTrialConditionFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await recordsApi.getAll({ department: DEPARTMENT_NAME });
      setRecords(response.data.data.map(normalizeRecord));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load loco trial records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const matchesCondition = trialConditionFilter === "ALL" || record.trialCondition === trialConditionFilter;
        const matchesSearch =
          !normalizedSearch ||
          [record.locoDetails, record.trialDate, record.driver, record.doneBy, record.remarks, record.trialCondition]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        return matchesCondition && matchesSearch;
      })
      .map((record, index) => ({ ...record, srNo: index + 1 }));
  }, [records, search, trialConditionFilter]);

  const nextSrNo = useMemo(() => {
    const maxValue = records.reduce((max, record) => Math.max(max, Number(record.srNo) || 0), 0);
    return maxValue + 1;
  }, [records]);

  const handleSave = async (form, srNo) => {
    try {
      const payload = buildPayload(form, srNo);

      if (selectedRecord) {
        await recordsApi.update(selectedRecord.id, payload);
        toast.success("Loco trial updated.");
      } else {
        await recordsApi.create(payload);
        toast.success("Loco trial added.");
      }

      setModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save loco trial.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await recordsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Loco trial deleted.");
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete loco trial.");
    }
  };

  const handleExportCsv = () => {
    const headers = ["Sr.No.", "Loco Details", "Trial Date", "Driver", "Done By", "Remarks"];
    const rows = filteredRecords.map((record) =>
      [record.srNo, record.locoDetails, record.trialDate, record.driver, record.doneBy, record.remarks].map(csvEscape).join(",")
    );

    downloadBlob([headers.join(","), ...rows].join("\n"), "loco-trials.csv", "text/csv;charset=utf-8;");
  };

  const handleDownloadExcel = () => {
    downloadBlob(buildExcelTableMarkup(filteredRecords), "loco-trials.xls", "application/vnd.ms-excel;charset=utf-8;");
  };

  return (
    <AppShell searchValue="" onSearchChange={() => {}} searchPlaceholder="Use loco trial filters below." searchDisabled>
      <PageHeader
        eyebrow="Loco Trials"
        title="LOCO TRIALS"
        description="Track trial condition, loco details, date, driver, files, and remarks in a dedicated workflow page."
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
              Add Trial
            </button>
          </div>
        }
      />

      <div className="mb-5 rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 text-sm font-medium text-body">
            Trial Condition
            <select value={trialConditionFilter} onChange={(event) => setTrialConditionFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="ALL">All Trial Conditions</option>
              {TRIAL_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-body xl:col-span-2">
            Search
            <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search loco details, date, driver, done by, or remarks" className="w-full border-none bg-transparent text-sm outline-none" />
            </div>
          </label>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading loco trials..." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] divide-y divide-border">
              <thead className="bg-primary text-white">
                <tr>
                  {["Sr.No.", "Loco Details", "Trial Date", "Driver", "Done By", "File / Link", "Remarks", "Action"].map((label) => (
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
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.locoDetails}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.trialDate || "-"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.driver || "-"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.doneBy || "-"}</td>
                      <td className="px-4 py-4 align-top">
                        {record.documentType === "link" && record.documentLink ? (
                          <a href={record.documentLink} target="_blank" rel="noreferrer" title={record.documentLink} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                            <Link2 size={14} />
                            {truncateUrl(record.documentLink)}
                          </a>
                        ) : record.files.length ? (
                          <div className="space-y-2">
                            {record.files.map((file) => (
                              <a key={`${getFileUrl(file)}-${getFileName(file)}`} href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                                {record.documentType === "image" ? <ImageIcon size={14} /> : <Download size={14} />}
                                {record.documentType === "image" ? `Download ${getFileName(file)}` : getFileName(file)}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No document</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.remarks || "-"}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setSelectedRecord(record); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover">
                            <Pencil size={14} />
                            Edit
                          </button>
                          {record.documentLink ? (
                            <a href={record.documentLink} target="_blank" rel="noreferrer" title="Open document link" className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50">
                              <Link2 size={14} />
                              View Link
                            </a>
                          ) : null}
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
                      No loco trial rows available for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LocoTrialModal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedRecord(null); }} onSubmit={handleSave} record={selectedRecord} nextSrNo={nextSrNo} />

      {canDelete ? <ConfirmationModal open={Boolean(deleteTarget)} title="Delete loco trial row?" description="This moves the selected loco trial row to the admin restore bin." confirmLabel="Delete Trial" onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} /> : null}
    </AppShell>
  );
};

export default LocoTrialsPage;
