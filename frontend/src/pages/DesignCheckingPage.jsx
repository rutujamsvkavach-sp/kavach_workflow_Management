import {
  Download,
  FileSpreadsheet,
  History,
  Paperclip,
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
import { uploadApi, recordsApi } from "../services/api";
import { getFileName, getFileUrl } from "../utils/files";

const DEPARTMENT_NAME = "DESIGN CHECKING";
const ZONES = [
  "CENTRAL RAILWAY",
  "EAST CENTRAL RAILWAY",
  "EASTERN RAILWAY",
  "NORTH CENTRAL RAILWAY",
  "SOUTH CENTRAL RAILWAY",
  "SOUTH WESTERN RAILWAY",
  "WEST CENTRAL RAILWAY",
  "WESTERN RAILWAY",
];
const CONTRACTS = ["HBL", "IRCON", "MSV"];
const CATEGORIES = ["QA", "EXECUTION", "APPROVED"];

const emptyForm = {
  zone: "",
  contractName: "",
  station: "",
  category: "",
  activity: "",
  document: "",
  revision: "",
  status: "",
  files: [],
  versionHistory: [],
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

const buildRecordPayload = (form, srNo) => ({
  department: DEPARTMENT_NAME,
  title: form.document || form.activity || `${form.contractName || "Contract"} Design Document`,
  description: form.activity || form.document || "Design workflow entry",
  fileUrl: form.files,
  designMeta: {
    srNo,
    zone: form.zone,
    contractName: form.contractName,
    station: form.station,
    category: form.category,
    activity: form.activity,
    document: form.document,
    revision: form.revision,
    status: form.status,
  },
  versionHistory: form.versionHistory,
});

const normalizeRecord = (record, fallbackIndex) => ({
  ...record,
  srNo: record.designMeta?.srNo || fallbackIndex + 1,
  zone: record.designMeta?.zone || "",
  contractName: record.designMeta?.contractName || "",
  station: record.designMeta?.station || "",
  category: record.designMeta?.category || "",
  activity: record.designMeta?.activity || "",
  document: record.designMeta?.document || record.title || "",
  revision: record.designMeta?.revision || "",
  status: record.designMeta?.status || "",
  files: record.files || [],
  versionHistory: record.versionHistory || [],
});

const buildExcelTableMarkup = (records) => {
  const headers = ["Sr.No.", "Contract Name", "Activity", "Document", "Revision", "Status"];
  const rows = records
    .map(
      (record) => `
      <tr>
        <td>${record.srNo}</td>
        <td>${record.contractName}</td>
        <td>${record.activity}</td>
        <td>${record.document}</td>
        <td>${record.revision}</td>
        <td>${record.status}</td>
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

const VersionHistoryModal = ({ record, onClose }) => {
  if (!record) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-2xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Version History</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record.document || "Design record"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {record.versionHistory.length ? (
            record.versionHistory.map((version) => (
              <div key={`${version.version}-${version.uploadedAt}`} className="rounded-lg border border-border bg-white p-4">
                <div>
                  <p className="font-semibold text-body">Version {version.version}</p>
                  <p className="text-sm text-slate-500">
                    Uploaded by {version.uploadedBy || "System"} on {new Date(version.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {version.files.map((file) => (
                    <a
                      key={`${getFileUrl(file)}-${getFileName(file)}`}
                      href={getFileUrl(file)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <Download size={14} />
                      {getFileName(file)}
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-white p-6 text-sm text-slate-500">No previous versions available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const DesignRecordModal = ({ open, onClose, onSubmit, record, nextSrNo, stationOptions }) => {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      setForm({
        zone: record.zone,
        contractName: record.contractName,
        station: record.station,
        category: record.category,
        activity: record.activity,
        document: record.document,
        revision: record.revision,
        status: record.status,
        files: record.files || [],
        versionHistory: record.versionHistory || [],
      });
      return;
    }

    setForm(emptyForm);
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
      const uploaded = response.data.data;

      setForm((current) => {
        const shouldArchiveCurrent =
          record &&
          current.revision.trim() &&
          current.files.length &&
          uploaded.length &&
          JSON.stringify(current.files.map(getFileUrl)) !== JSON.stringify(uploaded.map(getFileUrl));

        const nextHistory = shouldArchiveCurrent
          ? [
              {
                version: current.revision,
                files: current.files,
                uploadedAt: new Date().toISOString(),
                uploadedBy: "Record update",
              },
              ...current.versionHistory,
            ]
          : current.versionHistory;

        return {
          ...current,
          files: uploaded,
          versionHistory: nextHistory,
        };
      });

      toast.success("Design files uploaded successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload files.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form, record?.srNo || nextSrNo);
  };

  const activeStationOptions = form.zone
    ? Array.from(new Set(stationOptions.filter((item) => item.zone === form.zone).map((item) => item.station))).sort((a, b) => a.localeCompare(b))
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-5xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Design Record</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record ? "Edit Design Record" : "Create Design Record"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-body">
              Zone
              <select
                value={form.zone}
                onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value, station: "" }))}
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Select Zone</option>
                {ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Contract Name
              <select
                value={form.contractName}
                onChange={(event) => setForm((current) => ({ ...current, contractName: event.target.value }))}
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Select Contract</option>
                {CONTRACTS.map((contract) => (
                  <option key={contract} value={contract}>
                    {contract}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Station
              <input
                list="design-station-options"
                value={form.station}
                onChange={(event) => setForm((current) => ({ ...current, station: event.target.value }))}
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder={form.zone ? "Type or select station" : "Select zone first"}
              />
              <datalist id="design-station-options">
                {activeStationOptions.map((station) => (
                  <option key={station} value={station} />
                ))}
              </datalist>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Category
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-body">
              Activity
              <input type="text" value={form.activity} onChange={(event) => setForm((current) => ({ ...current, activity: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Document
              <input type="text" value={form.document} onChange={(event) => setForm((current) => ({ ...current, document: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Revision
              <input type="text" value={form.revision} onChange={(event) => setForm((current) => ({ ...current, revision: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="e.g. 2.0.1" />
            </label>
            <label className="space-y-2 text-sm font-medium text-body">
              Status
              <input type="text" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} required className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </label>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <UploadCloud size={22} />
                </div>
                <div>
                  <p className="font-semibold text-body">Upload design document version</p>
                  <p className="text-sm text-slate-500">Uploading a new file replaces the active file and keeps the old one in version history.</p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover">
                {uploading ? "Uploading..." : "Select Files"}
                <input type="file" multiple accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            {form.files.length ? (
              <div className="mt-4 space-y-2">
                {form.files.map((file) => (
                  <div key={`${getFileUrl(file)}-${getFileName(file)}`} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Paperclip size={16} className="text-primary" />
                      <a href={getFileUrl(file)} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-primary hover:underline">
                        {getFileName(file)}
                      </a>
                    </div>
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
              {record ? "Save Changes" : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DesignCheckingPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [contractFilter, setContractFilter] = useState("ALL");
  const [stationFilter, setStationFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadRecords = async () => {
    setLoading(true);

    try {
      const response = await recordsApi.getAll({ department: DEPARTMENT_NAME });
      setRecords(response.data.data.map(normalizeRecord));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load design records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const stationOptions = useMemo(
    () =>
      records
        .filter((record) => record.zone && record.station)
        .map((record) => ({ zone: record.zone, station: record.station })),
    [records]
  );

  const availableStations = useMemo(() => {
    const source = zoneFilter === "ALL" ? stationOptions : stationOptions.filter((item) => item.zone === zoneFilter);
    return Array.from(new Set(source.map((item) => item.station))).sort((a, b) => a.localeCompare(b));
  }, [stationOptions, zoneFilter]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesZone = zoneFilter === "ALL" || record.zone === zoneFilter;
      const matchesContract = contractFilter === "ALL" || record.contractName === contractFilter;
      const matchesStation = stationFilter === "ALL" || record.station === stationFilter;
      const matchesCategory = categoryFilter === "ALL" || record.category === categoryFilter;
      const matchesText =
        !normalizedSearch ||
        [
          record.contractName,
          record.activity,
          record.document,
          record.revision,
          record.status,
          record.zone,
          record.station,
          record.category,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesZone && matchesContract && matchesStation && matchesCategory && matchesText;
    });
  }, [records, search, zoneFilter, contractFilter, stationFilter, categoryFilter]);

  const nextSrNo = useMemo(() => {
    const maxValue = records.reduce((max, record) => Math.max(max, Number(record.srNo) || 0), 0);
    return maxValue + 1;
  }, [records]);

  const handleSave = async (form, srNo) => {
    try {
      const payload = buildRecordPayload(form, srNo);

      if (selectedRecord) {
        await recordsApi.update(selectedRecord.id, payload);
        toast.success("Design record updated.");
      } else {
        await recordsApi.create(payload);
        toast.success("Design record created.");
      }

      setModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save design record.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await recordsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Design record deleted.");
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete design record.");
    }
  };

  const handleExportCsv = () => {
    const headers = ["Sr.No.", "Contract Name", "Activity", "Document", "Revision", "Status"];
    const rows = filteredRecords.map((record) =>
      [record.srNo, record.contractName, record.activity, record.document, record.revision, record.status].map(csvEscape).join(",")
    );

    downloadBlob([headers.join(","), ...rows].join("\n"), "design-checking.csv", "text/csv;charset=utf-8;");
  };

  const handleDownloadExcel = () => {
    downloadBlob(buildExcelTableMarkup(filteredRecords), "design-checking.xls", "application/vnd.ms-excel;charset=utf-8;");
  };

  return (
    <AppShell searchValue="" onSearchChange={() => {}} searchPlaceholder="Use the design filters below." searchDisabled>
      <PageHeader
        eyebrow="Design Workflow"
        title="DESIGN CHECKING"
        description="Manage design approvals and revisions with zone, contract, station, and category filtering. Version history is preserved per document."
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
            <button
              type="button"
              onClick={() => {
                setSelectedRecord(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover"
            >
              <Plus size={18} />
              Add Design Record
            </button>
          </div>
        }
      />

      <div className="mb-5 rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 text-sm font-medium text-body">
            All Zones
            <select value={zoneFilter} onChange={(event) => { setZoneFilter(event.target.value); setStationFilter("ALL"); }} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="ALL">All Zones</option>
              {ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-body">
            All Contracts
            <select value={contractFilter} onChange={(event) => setContractFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="ALL">All Contracts</option>
              {CONTRACTS.map((contract) => <option key={contract} value={contract}>{contract}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-body">
            All Stations
            <select value={stationFilter} onChange={(event) => setStationFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="ALL">All Stations</option>
              {availableStations.map((station) => <option key={station} value={station}>{station}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-body">
            All Categories
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-body">
            Search
            <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search design records" className="w-full border-none bg-transparent text-sm outline-none" />
            </div>
          </label>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading design records..." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] divide-y divide-border">
              <thead className="bg-primary text-white">
                <tr>
                  {["Sr.No.", "Contract Name", "Activity", "Document", "Revision", "Status", "Action"].map((label) => (
                    <th key={label} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.length ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="transition hover:bg-blue-50/60">
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.srNo}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.contractName}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.activity}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <p className="font-semibold text-body">{record.document}</p>
                          {record.files.length ? record.files.map((file) => (
                            <a key={`${getFileUrl(file)}-${getFileName(file)}`} href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                              <Download size={14} />
                              {getFileName(file)}
                            </a>
                          )) : <span className="text-sm text-slate-400">No active document</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.revision}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.status}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setSelectedRecord(record); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover">
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button type="button" onClick={() => setHistoryRecord(record)} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10" title="Version History">
                            <History size={14} />
                            History
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(record)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-16 text-center text-sm text-slate-500">No design records available for the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DesignRecordModal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedRecord(null); }} onSubmit={handleSave} record={selectedRecord} nextSrNo={nextSrNo} stationOptions={stationOptions} />
      <VersionHistoryModal record={historyRecord} onClose={() => setHistoryRecord(null)} />
      <ConfirmationModal open={Boolean(deleteTarget)} title="Delete design record?" description="This removes the selected design workflow entry and its version history from the application database." confirmLabel="Delete Record" onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </AppShell>
  );
};

export default DesignCheckingPage;
