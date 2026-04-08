import {
  CalendarDays,
  Camera,
  Download,
  FileImage,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
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

const DEPARTMENT_NAME = "SITE WORK IMAGES";
const VENDORS = ["HBL", "IRCON"];
const STATIONS = [
  "LC-19 (DD-BRB)",
  "BORIBIAL",
  "BORIBIAL-MALTHAN",
  "MALTHAN",
  "MALTHAN-BHIGVAN",
  "BHIGVAN",
  "JINTI ROAD",
  "JINTI ROAD-KETUR",
  "KETUR",
  "WASHIMBE",
  "POPHLAJ",
  "JEUR-POPHLAJ",
  "JEUR",
  "BHALVANI",
  "KEM",
  "KEM-DHAVLAS",
  "DHAVALAS",
  "KURDUWADI",
  "WADSHINGE",
  "LC-40 (WDS-MA)",
  "MADHA",
  "VAKAV",
  "ANGAR",
  "MALIKPETH",
  "MOHOL",
  "MUNDHEWADI",
  "MVE-PAKNI",
  "PAKNI",
  "PAKNI-BALE",
  "BALE",
  "SOLAPUR",
  "TIKEKERWADI",
  "HOTGI",
  "TILATI",
  "TILATI-AKALKOT",
  "AKALKOT",
  "NAGANSUR",
  "NAGANSUR-BOROTI",
  "BOROTI",
  "LC 74 (BOT-DUD)",
  "DUDHANI",
  "KULALI",
  "GAUDGAON",
  "GANGAPUR",
  "GUR-SVG",
  "SAVALGI",
  "SVG-BBD",
  "BABLAD",
  "LC-82",
  "KALABURGI",
  "TAJ SULTANPUR",
  "HIRENANDURU",
  "HQR-MR",
  "MARTUR",
  "MR-SDB",
  "SHAHABAD",
  "LC-91",
  "WADI",
  "MODLIMB",
  "LC-22 (MLB-PVR)",
  "PANDHARPUR",
  "LC-24 (PVR-SGLA)",
  "SANGOLA",
  "SGLA-JATH ROAD",
  "JTRD- DLGN",
  "DHALGAON",
  "KAVATHEMAHANKAL",
  "SALGARE",
  "ARAG",
  "LC-70 (ARAG-MRJ)",
  "SHENDRI",
  "LC-10 (SEI-BTW)",
  "BARSHI TOWN",
  "PANGRI",
  "PJR - UMD  (Near PJR)",
  "PJR - UMD  (Near UMD)",
  "OSMANABAD",
  "YSI - UMD",
  "YEDSHI",
  "LC-34 (YSI-DKY)",
  "DHOKI",
  "LC-39 (DKY-OSA)",
  "LC-47 (DKY-OSA)",
  "AUSA ROAD",
  "OSA-HGL",
  "HARANGUL",
  "LATUR",
  "LC-04 (LUR-LTRR)",
  "LC-06 (LUR-LTRR)",
  "LC-02 (LUR-LTRR)",
];
const DOCUMENT_TYPE_OPTIONS = [
  { value: "image", label: "Upload Image" },
  { value: "file", label: "Upload File" },
  { value: "link", label: "Use Link" },
];

const emptyForm = {
  pssa: "",
  vendor: "",
  station: "",
  imageDate: new Date().toISOString().slice(0, 10),
  documentType: "image",
  documentLink: "",
  files: [],
};

const isHttpUrl = (value) => /^https?:\/\/.+/i.test(String(value || "").trim());
const truncateUrl = (value, maxLength = 42) => {
  const url = String(value || "").trim();
  if (!url || url.length <= maxLength) {
    return url;
  }
  return `${url.slice(0, maxLength - 3)}...`;
};
const getDocumentType = (record) => {
  if (record?.siteImageMeta?.documentType === "link" || record?.documentType === "link") {
    return "link";
  }
  if (record?.siteImageMeta?.documentType === "file" || record?.documentType === "file") {
    return "file";
  }
  if ((record?.siteImageMeta?.documentLink || record?.documentLink) && !(record?.files || []).length) {
    return "link";
  }
  return "image";
};

const normalizeRecord = (record, index) => ({
  ...record,
  srNo: record.siteImageMeta?.srNo || index + 1,
  pssa: record.siteImageMeta?.pssa || "",
  vendor: record.siteImageMeta?.vendor || "",
  station: record.siteImageMeta?.station || "",
  imageDate: record.siteImageMeta?.imageDate || "",
  documentType: getDocumentType(record),
  documentLink: record.siteImageMeta?.documentLink || record.documentLink || "",
  files: record.files || [],
});

const buildPayload = (form, srNo) => ({
  department: DEPARTMENT_NAME,
  title: `${form.station || "Station"} Site Images`,
  description: `${form.pssa || "PSSA"} ${form.vendor || "Vendor"} site image record`,
  documentType: form.documentType,
  documentLink: form.documentType === "link" ? form.documentLink.trim() : "",
  fileUrl: form.documentType === "link" ? [] : form.files,
  siteImageMeta: {
    srNo,
    pssa: form.pssa,
    vendor: form.vendor,
    station: form.station,
    imageDate: form.imageDate,
    documentType: form.documentType,
    documentLink: form.documentType === "link" ? form.documentLink.trim() : "",
  },
});

const SiteImageModal = ({ open, onClose, onSubmit, record, nextSrNo }) => {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});

    if (record) {
      setForm({
        pssa: record.pssa || "",
        vendor: record.vendor || "",
        station: record.station || "",
        imageDate: record.imageDate || new Date().toISOString().slice(0, 10),
        documentType: record.documentType || "image",
        documentLink: record.documentLink || "",
        files: record.files || [],
      });
      return;
    }

    setForm(emptyForm);
  }, [open, record]);

  if (!open) {
    return null;
  }

  const handleUpload = async (event) => {
    if (form.documentType === "link") {
      return;
    }

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
        files: [...current.files, ...response.data.data],
      }));
      setErrors((current) => ({ ...current, documentSource: "" }));
      toast.success(`${form.documentType === "image" ? "Images" : "Files"} uploaded.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload attachments.");
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
    setErrors({});
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
      nextErrors.documentSource = `Please upload at least one ${form.documentType === "image" ? "image" : "file"}.`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast.error("Please complete the document source before saving.");
      return;
    }

    await onSubmit(form, record?.srNo || nextSrNo);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-4xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Site Work Images</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record ? "Edit Image Row" : "Add Image Row"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-body">
              PSSA
              <input
                type="text"
                value={form.pssa}
                onChange={(event) => setForm((current) => ({ ...current, pssa: event.target.value }))}
                required
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Enter PSSA"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Vendor
              <select
                value={form.vendor}
                onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))}
                required
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Select Vendor</option>
                {VENDORS.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Station
              <select
                value={form.station}
                onChange={(event) => setForm((current) => ({ ...current, station: event.target.value }))}
                required
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Select Station</option>
                {STATIONS.map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Calendar Date
              <input
                type="date"
                value={form.imageDate}
                onChange={(event) => setForm((current) => ({ ...current, imageDate: event.target.value }))}
                required
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="mb-4 flex flex-wrap gap-3">
              {DOCUMENT_TYPE_OPTIONS.map((option) => {
                const isActive = form.documentType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleDocumentTypeChange(option.value)}
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive ? "bg-primary text-white shadow-sm" : "border border-border bg-white text-slate-600 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {form.documentType === "link" ? (
              <div className="rounded-lg border border-primary/20 bg-white p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
                    <Link2 size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-body">Use image or file link</p>
                    <p className="text-sm text-slate-500">Paste a Google Drive, OneDrive, or any hosted image/file URL.</p>
                  </div>
                </div>
                <label className="space-y-2 text-sm font-medium text-body">
                  Document URL
                  <input
                    type="url"
                    value={form.documentLink}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, documentLink: event.target.value }));
                      setErrors((current) => ({ ...current, documentLink: "" }));
                    }}
                    placeholder="Paste Google Drive / OneDrive / Any File Link"
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                      {form.documentType === "image" ? <Camera size={22} /> : <Download size={22} />}
                    </div>
                    <div>
                      <p className="font-semibold text-body">{form.documentType === "image" ? "Upload images" : "Upload files"}</p>
                      <p className="text-sm text-slate-500">
                        {form.documentType === "image"
                          ? "Attach site work images for this station and date."
                          : "Attach files or other supporting documents for this station and date."}
                      </p>
                    </div>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover">
                    {uploading ? "Uploading..." : form.documentType === "image" ? "Select Images" : "Select Files"}
                    <input
                      type="file"
                      multiple
                      accept={form.documentType === "image" ? "image/*" : ".pdf,.xls,.xlsx,.doc,.docx,.png,.jpg,.jpeg,.webp"}
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
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              files: current.files.filter((item) => getFileUrl(item) !== getFileUrl(file)),
                            }))
                          }
                          className="text-sm font-semibold text-accent"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}

            {errors.documentSource ? <p className="mt-3 text-sm font-medium text-accent">{errors.documentSource}</p> : null}
            {errors.documentLink ? <p className="mt-3 text-sm font-medium text-accent">{errors.documentLink}</p> : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-body transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover">
              {record ? "Update Images" : "Add Images"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SiteWorkImagesPage = () => {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pssaFilter, setPssaFilter] = useState("ALL");
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [stationFilter, setStationFilter] = useState("ALL");
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
      toast.error(error.response?.data?.message || "Failed to load site work images.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const pssaOptions = useMemo(
    () => [...new Set(records.map((record) => record.pssa).filter(Boolean))].sort((left, right) => left.localeCompare(right)),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return records
      .filter((record) => {
        const matchesPssa = pssaFilter === "ALL" || record.pssa === pssaFilter;
        const matchesVendor = vendorFilter === "ALL" || record.vendor === vendorFilter;
        const matchesStation = stationFilter === "ALL" || record.station === stationFilter;
        const matchesDate = !selectedDate || record.imageDate === selectedDate;
        const matchesSearch =
          !normalizedSearch ||
          [record.pssa, record.vendor, record.station, record.imageDate, record.documentLink]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);
        return matchesPssa && matchesVendor && matchesStation && matchesDate && matchesSearch;
      })
      .map((record, index) => ({ ...record, srNo: index + 1 }));
  }, [records, pssaFilter, vendorFilter, stationFilter, selectedDate, search]);

  const nextSrNo = useMemo(() => records.reduce((max, record) => Math.max(max, Number(record.srNo) || 0), 0) + 1, [records]);

  const handleSave = async (form, srNo) => {
    try {
      const payload = buildPayload(form, srNo);
      if (selectedRecord) {
        await recordsApi.update(selectedRecord.id, payload);
        toast.success("Site work images updated.");
      } else {
        await recordsApi.create(payload);
        toast.success("Site work images added.");
      }
      setModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save site work images.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await recordsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Site work image row deleted.");
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete site work image row.");
    }
  };

  return (
    <AppShell searchValue="" onSearchChange={() => {}} searchPlaceholder="Use the image filters below." searchDisabled>
      <PageHeader
        eyebrow="Field Image Tracking"
        title="SITE WORK IMAGES"
        description="Filter by PSSA, vendor, station, and calendar date, then manage uploaded images, files, or saved links for site work documentation."
        action={
          <button
            type="button"
            onClick={() => {
              setSelectedRecord(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover"
          >
            <Plus size={18} />
            Add Images
          </button>
        }
      />

      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-body">
              By PSSA
              <select value={pssaFilter} onChange={(event) => setPssaFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="ALL">All PSSA</option>
                {pssaOptions.map((pssa) => (
                  <option key={pssa} value={pssa}>
                    {pssa}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              By Vendor
              <select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="ALL">All Vendors</option>
                {VENDORS.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Station
              <select value={stationFilter} onChange={(event) => setStationFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option value="ALL">All Stations</option>
                {STATIONS.map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Calendar
              <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3">
                <CalendarDays size={16} className="text-slate-400" />
                <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full border-none bg-transparent text-sm outline-none" />
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
          <label className="space-y-2 text-sm font-medium text-body">
            Search
            <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by PSSA, vendor, station, date, or link" className="w-full border-none bg-transparent text-sm outline-none" />
            </div>
          </label>
        </div>

        {loading ? (
          <Spinner label="Loading site work images..." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-[1160px] divide-y divide-border">
                <thead className="bg-primary text-white">
                  <tr>
                    {["Sr.No.", "PSSA", "Vendor", "Station", "Date", "Images / Link", "Action"].map((label) => (
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
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.pssa || "-"}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.vendor || "-"}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.station || "-"}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600">{record.imageDate || "-"}</td>
                        <td className="px-4 py-4 align-top">
                          {record.documentType === "link" && record.documentLink ? (
                            <div className="space-y-2">
                              <a href={record.documentLink} target="_blank" rel="noreferrer" title="Open Document Link" className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                                <Link2 size={14} />
                                Open Link
                              </a>
                              <p className="truncate text-xs text-slate-500" title={record.documentLink}>
                                {truncateUrl(record.documentLink)}
                              </p>
                            </div>
                          ) : record.files.length ? (
                            <div className="space-y-2">
                              {record.files.map((file) => (
                                <a key={`${getFileUrl(file)}-${getFileName(file)}`} href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                                  {record.documentType === "image" ? <Camera size={14} /> : <FileImage size={14} />}
                                  {getFileName(file)}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">No document source</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => { setSelectedRecord(record); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover">
                              <Pencil size={14} />
                              Edit
                            </button>
                            {record.documentLink ? (
                              <a href={record.documentLink} target="_blank" rel="noreferrer" title="Open Document Link" className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10">
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
                      <td colSpan="7" className="px-4 py-16 text-center text-sm text-slate-500">
                        No site work image rows available for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SiteImageModal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedRecord(null); }} onSubmit={handleSave} record={selectedRecord} nextSrNo={nextSrNo} />

      {canDelete ? <ConfirmationModal open={Boolean(deleteTarget)} title="Delete site work image row?" description="This moves the selected site image row to the admin restore bin." confirmLabel="Delete Row" onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} /> : null}
    </AppShell>
  );
};

export default SiteWorkImagesPage;
