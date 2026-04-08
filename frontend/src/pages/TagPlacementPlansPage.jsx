import { Download, ExternalLink, FileImage, FileSpreadsheet, Link2, Pencil, Plus, Search, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import PageHeader from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { recordsApi, uploadApi } from "../services/api";
import { getFileName, getFileUrl } from "../utils/files";

const DEPARTMENT_NAME = "TAG PLACEMENT PLANS";
const PHASE_OPTIONS = ["PHASE 1", "PHASE 2"];
const DOCUMENT_TYPE_OPTIONS = [
  { value: "file", label: "Upload File" },
  { value: "image", label: "Upload Image" },
  { value: "link", label: "Use Link (URL)" },
];
const BLOCK_SECTIONS = ["DD-BRB", "DD-BRB", "BRB-MLM", "BRB-MLM", "MALTHAN- BHIGWAN", "MALTHAN- BHIGWAN", "BHIGWAN-JINTI ROAD", "BHIGWAN-JINTI ROAD", "JINTI ROAD-PAREWADI", "JINTI ROAD-PAREWADI", "PAREWADI-WASHIMBE", "PAREWADI-WASHIMBE", "WASHIMBE-POPHLAJ", "WASHIMBE-POPHLAJ", "POPHLAJ-JEUR", "POPHLAJ-JEUR", "JEUR-BHALAANI", "JEUR-BHALAANI", "BHALVANI-KEM", "BHALVANI-KEM", "KEM-DAVALAS", "KEM-DAVALAS", "DHAVALAS-KURDUWADI JN", "KURDUWADI JN-DAVALAS", "KURDUWADI JN-WADSINGE", "KURDUWADI JN-WADSINGE", "WADSINGE - MADHA", "WADSINGE - MADHA", "MADHA - VAKAV", "MADHA - VAKAV", "VAKAV - ANGAR", "VAKAV - ANGAR", "ANGAR - MALIKPETH", "ANGAR - MALIKPETH", "MALIKPETH - MOHOL", "MALIKPETH - MOHOL", "MOHOL - MUNDHEWADI", "MOHOL - MUNDHEWADI", "MUNDHEWADI - PAKNI", "MUNDHEWADI - PAKNI", "PAKNI - BALE", "PAKNI - BALE", "BALE - SOLAPUR ", "BALE - SOLAPUR ", "SUR - TKWD ", "SUR - TKWD ", "TKWD - HG", "TKWD - HG", "HOTGI - TILATI", "HOTGI - TILATI", "TILATI - AKALKOT", "TILATI - AKALKOT", "AKALKOT - NAGANSUR", "AKALKOT - NAGANSUR", "NAGANSUR - BOROTI", "NAGANSUR - BOROTI", "BOROTI - DUDHANI", "BOROTI - DUDHANI", "DUD-KUL", "DUD-KUL", "KUL-GDGN", "KUL-GDGN", "GDGN-GUR", "GDGN-GUR", "GUR-SVG", "GUR-SVG", "SVG-BBD-KLBG", "SVG-BBD-KLBG", "KLBG-HQR", "KLBG-HQR", "HQR - MR", "HQR - MR", "MR - SDB", "MR - SDB", "SDB - WD", "SDB - WD", "KWV-SEI", "SEI-BTW", "BTW-PJR", "PJR-UMD", "UMD-YSI", "YSI-DKY", "OSA-HGL", "DKY-OSA", "HGL-LUR", "KWV-MLB", "MLB-PVR", "PVR-SGLA", "SGLA-JTRD", "JTRD-DLGN", "DLGN-KVK", "KVK-SGRE", "SGRE-ARAG"];
const STATION_OPTIONS = ["LC-19 (DD-BRB)", "BORIBIAL", "BORIBIAL-MALTHAN", "MALTHAN", "MALTHAN-BHIGVAN", "BHIGVAN", "JINTI ROAD", "JINTI ROAD-KETUR", "KETUR", "WASHIMBE", "POPHLAJ", "JEUR-POPHLAJ", "JEUR", "BHALVANI", "KEM", "KEM-DHAVLAS", "DHAVALAS", "KURDUWADI ", "WADSHINGE", "LC-40 (WDS-MA)", "MADHA", "VAKAV", "ANGAR", "MALIKPETH ", "MOHOL", "MUNDHEWADI", "MVE-PAKNI", "PAKNI", "PAKNI-BALE", "BALE", "SOLAPUR ", "TIKEKERWADI", "HOTGI", "TILATI", "TILATI-AKALKOT", "AKALKOT", "NAGANSUR", "NAGANSUR-BOROTI", "BOROTI", "LC 74 (BOT-DUD)", "DUDHANI", "KULALI", "GAUDGAON", "GANGAPUR", "GUR-SVG", "SAVALGI", "SVG-BBD", "BABLAD", "LC-82", "KALABURGI", "TAJ SULTANPUR", "HIRENANDURU", "HQR-MR", "MARTUR", "MR-SDB", "SHAHABAD", "LC-91", "WADI", "MODLIMB", "LC-22 (MLB-PVR)", "PANDHARPUR", "LC-24 (PVR-SGLA)", "SANGOLA", "SGLA-JATH ROAD", "JTRD- DLGN", "DHALGAON", "KAVATHEMAHANKAL", "SALGARE", "ARAG", "LC-70 (ARAG-MRJ)", "SHENDRI", "LC-10 (SEI-BTW)", "BARSHI TOWN", "PANGRI", "PJR - UMD  (Near PJR)", "PJR - UMD  (Near UMD)", "OSMANABAD", "YSI - UMD", "YEDSHI", "LC-34 (YSI-DKY)", "DHOKI", "LC-39 (DKY-OSA)", "LC-47 (DKY-OSA)", "AUSA ROAD", "OSA-HGL", "HARANGUL", "LATUR", "LC-04 (LUR-LTRR)", "LC-06 (LUR-LTRR)", "LC-02 (LUR-LTRR)"];

const csvEscape = (value) => `"${String(value || "").replace(/"/g, '""')}"`;
const isHttpUrl = (value) => /^https?:\/\/.+/i.test(String(value || "").trim());
const isDriveLink = (value) => /drive\.google\.com|docs\.google\.com/i.test(String(value || ""));
const truncateUrl = (value, maxLength = 42) => {
  const url = String(value || "").trim();
  return !url || url.length <= maxLength ? url : `${url.slice(0, maxLength - 3)}...`;
};
const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const emptyForm = { phase: PHASE_OPTIONS[0], blockSection: BLOCK_SECTIONS[0], station: STATION_OPTIONS[0], documentType: "file", documentLink: "", documents: [], images: [] };

const normalizeRecord = (record, index) => {
  const meta = record.tagPlacementMeta || {};
  const documentType = meta.documentType || record.documentType || (meta.documentLink || record.documentLink ? "link" : meta.images?.length ? "image" : "file");
  return {
    ...record,
    srNo: meta.srNo || index + 1,
    phase: meta.phase || "",
    blockSection: meta.blockSection || "",
    station: meta.station || "",
    documentType,
    documentLink: meta.documentLink || record.documentLink || "",
    documents: documentType === "file" ? meta.documents || [] : [],
    images: documentType === "image" ? meta.images || [] : [],
  };
};

const buildPayload = (form, srNo) => {
  const documentLink = form.documentType === "link" ? form.documentLink.trim() : "";
  const documents = form.documentType === "file" ? form.documents : [];
  const images = form.documentType === "image" ? form.images : [];
  return {
    department: DEPARTMENT_NAME,
    title: `${form.phase} - ${form.blockSection}`,
    description: form.station || "Tag placement plan record",
    documentType: form.documentType,
    documentLink,
    fileUrl: [...documents, ...images],
    tagPlacementMeta: { srNo, phase: form.phase, blockSection: form.blockSection, station: form.station, documentType: form.documentType, documentLink, documents, images },
  };
};

const buildExcelTableMarkup = (records) => `
  <table>
    <thead><tr>${["Sr.No.", "Phase", "Block Section", "Station", "Document Link", "Documents", "Images"].map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>${records.map((record) => `<tr><td>${record.srNo}</td><td>${record.phase}</td><td>${record.blockSection}</td><td>${record.station}</td><td>${record.documentLink || ""}</td><td>${record.documents.map(getFileName).join(", ")}</td><td>${record.images.map(getFileName).join(", ")}</td></tr>`).join("")}</tbody>
  </table>
`;

const AttachmentList = ({ files, onRemove, icon: Icon }) =>
  files.length ? (
    <div className="mt-3 space-y-2">
      {files.map((file) => (
        <div key={`${getFileUrl(file)}-${getFileName(file)}`} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
          <a href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 truncate text-sm font-medium text-primary hover:underline">
            <Icon size={14} />
            {getFileName(file)}
          </a>
          <button type="button" onClick={onRemove(file)} className="text-sm font-semibold text-accent">Remove</button>
        </div>
      ))}
    </div>
  ) : null;

const TagPlacementModal = ({ open, onClose, onSubmit, record, nextSrNo }) => {
  const [form, setForm] = useState(emptyForm);
  const [uploadingType, setUploadingType] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(
      record
        ? { phase: record.phase || PHASE_OPTIONS[0], blockSection: record.blockSection || BLOCK_SECTIONS[0], station: record.station || STATION_OPTIONS[0], documentType: record.documentType || "file", documentLink: record.documentLink || "", documents: record.documents || [], images: record.images || [] }
        : emptyForm
    );
  }, [open, record]);

  if (!open) {
    return null;
  }

  const handleUpload = async (type, event) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }
    setUploadingType(type);
    try {
      const payload = new FormData();
      [...files].forEach((file) => payload.append("files", file));
      const response = await uploadApi.uploadFiles(payload);
      setForm((current) => ({ ...current, [type]: [...current[type], ...response.data.data] }));
      toast.success(type === "documents" ? "Files uploaded." : "Images uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload attachments.");
    } finally {
      setUploadingType("");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.documentType === "link") {
      if (!form.documentLink.trim()) {
        toast.error("Document link is required.");
        return;
      }
      if (!isHttpUrl(form.documentLink)) {
        toast.error("Enter a valid http/https document link.");
        return;
      }
    }
    await onSubmit(form, record?.srNo || nextSrNo);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-5xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Tag Placement Plans</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record ? "Edit Tag Placement Row" : "Add Tag Placement Row"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body"><X size={20} /></button>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-body">Phase<select value={form.phase} onChange={(event) => setForm((current) => ({ ...current, phase: event.target.value, blockSection: BLOCK_SECTIONS[0], station: STATION_OPTIONS[0] }))} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">{PHASE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="space-y-2 text-sm font-medium text-body">Block Section<select value={form.blockSection} onChange={(event) => setForm((current) => ({ ...current, blockSection: event.target.value }))} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">{BLOCK_SECTIONS.map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>
            <label className="space-y-2 text-sm font-medium text-body">Station<select value={form.station} onChange={(event) => setForm((current) => ({ ...current, station: event.target.value }))} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">{STATION_OPTIONS.map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>
          </div>
          <div className="space-y-3 rounded-lg border border-border bg-white p-4">
            <p className="text-sm font-medium text-body">Document Source</p>
            <div className="inline-flex rounded-full border border-primary/15 bg-primary/5 p-1">
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => setForm((current) => ({ ...current, documentType: option.value, documentLink: option.value === "link" ? current.documentLink : "", documents: option.value === "file" ? current.documents : [], images: option.value === "image" ? current.images : [] }))} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${form.documentType === option.value ? "bg-primary text-white shadow-sm" : "text-primary/80 hover:text-primary"}`}>
                  {option.label}
                </button>
              ))}
            </div>
            {form.documentType === "link" ? (
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                <label className="block space-y-2 text-sm font-medium text-body">Document URL<input type="url" value={form.documentLink} onChange={(event) => setForm((current) => ({ ...current, documentLink: event.target.value }))} placeholder="Paste Google Drive / OneDrive / Any File Link" className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
                {form.documentLink.trim() ? <div className="mt-3 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary"><Link2 size={12} />{truncateUrl(form.documentLink)}</span>{isDriveLink(form.documentLink) ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Drive Link</span> : null}</div> : null}
              </div>
            ) : form.documentType === "image" ? (
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="font-semibold text-body">Upload images</p><p className="text-sm text-slate-500">Attach tower tag placement images for the selected station.</p></div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover"><FileImage size={16} />{uploadingType === "images" ? "Uploading..." : "Select Images"}<input type="file" multiple accept="image/*" className="hidden" onChange={(event) => handleUpload("images", event)} /></label>
                </div>
                <AttachmentList files={form.images} icon={FileImage} onRemove={(file) => () => setForm((current) => ({ ...current, images: current.images.filter((item) => getFileUrl(item) !== getFileUrl(file)) }))} />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="font-semibold text-body">Upload files</p><p className="text-sm text-slate-500">Attach plan documents and signed files for this block section / station.</p></div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover"><UploadCloud size={16} />{uploadingType === "documents" ? "Uploading..." : "Select Files"}<input type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx,.dwg,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(event) => handleUpload("documents", event)} /></label>
                </div>
                <AttachmentList files={form.documents} icon={Download} onRemove={(file) => () => setForm((current) => ({ ...current, documents: current.documents.filter((item) => getFileUrl(item) !== getFileUrl(file)) }))} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-body transition hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover">{record ? "Update Row" : "Add Row"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TagPlacementPlansPage = () => {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [blockSectionFilter, setBlockSectionFilter] = useState("ALL");
  const [stationFilter, setStationFilter] = useState("ALL");
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
      toast.error(error.response?.data?.message || "Failed to load tag placement records.");
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
      .filter((record) => phaseFilter === "ALL" || record.phase === phaseFilter)
      .filter((record) => blockSectionFilter === "ALL" || record.blockSection === blockSectionFilter)
      .filter((record) => stationFilter === "ALL" || record.station === stationFilter)
      .filter((record) => !normalizedSearch || [record.phase, record.blockSection, record.station, record.documentType, record.documentLink, ...record.documents.map(getFileName), ...record.images.map(getFileName)].join(" ").toLowerCase().includes(normalizedSearch))
      .map((record, index) => ({ ...record, srNo: index + 1 }));
  }, [records, phaseFilter, blockSectionFilter, stationFilter, search]);

  const nextSrNo = useMemo(() => records.reduce((max, record) => Math.max(max, Number(record.srNo) || 0), 0) + 1, [records]);

  const handleSave = async (form, srNo) => {
    try {
      const payload = buildPayload(form, srNo);
      if (selectedRecord) {
        await recordsApi.update(selectedRecord.id, payload);
        toast.success("Tag placement row updated.");
      } else {
        await recordsApi.create(payload);
        toast.success("Tag placement row added.");
      }
      setModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save tag placement row.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await recordsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Tag placement row deleted.");
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete tag placement row.");
    }
  };

  const handleExportCsv = () => {
    const headers = ["Sr.No.", "Phase", "Block Section", "Station", "Document Link", "Documents", "Images"];
    const rows = filteredRecords.map((record) => [record.srNo, record.phase, record.blockSection, record.station, record.documentLink || "", record.documents.map(getFileName).join(" | "), record.images.map(getFileName).join(" | ")].map(csvEscape).join(","));
    downloadBlob([headers.join(","), ...rows].join("\n"), "tag-placement-plans.csv", "text/csv;charset=utf-8;");
  };

  const handleDownloadExcel = () => downloadBlob(buildExcelTableMarkup(filteredRecords), "tag-placement-plans.xls", "application/vnd.ms-excel;charset=utf-8;");

  return (
    <AppShell searchValue="" onSearchChange={() => {}} searchPlaceholder="Use tag placement filters below." searchDisabled>
      <PageHeader
        eyebrow="Tag Placement Workflow"
        title="TAG PLACEMENT PLANS"
        description="Filter by phase, block section, and station, then store files, images, or direct links for each tag placement row."
        action={<div className="flex flex-wrap gap-3"><button type="button" onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"><FileSpreadsheet size={16} />Export CSV</button><button type="button" onClick={handleDownloadExcel} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-50"><Download size={16} />Download Excel</button><button type="button" onClick={() => { setSelectedRecord(null); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover"><Plus size={18} />Add Row</button></div>}
      />
      <div className="grid gap-5 rounded-lg border border-border bg-card p-5 shadow-soft lg:grid-cols-4">
        <label className="space-y-2 text-sm font-medium text-body">Phase<select value={phaseFilter} onChange={(event) => { setPhaseFilter(event.target.value); setBlockSectionFilter("ALL"); setStationFilter("ALL"); }} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"><option value="ALL">All Phases</option>{PHASE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label className="space-y-2 text-sm font-medium text-body">Block Section<select value={blockSectionFilter} onChange={(event) => setBlockSectionFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" disabled={phaseFilter === "ALL"}><option value="ALL">All Block Sections</option>{BLOCK_SECTIONS.map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>
        <label className="space-y-2 text-sm font-medium text-body">Station<select value={stationFilter} onChange={(event) => setStationFilter(event.target.value)} className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" disabled={phaseFilter === "ALL"}><option value="ALL">All Stations</option>{STATION_OPTIONS.map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>
        <label className="space-y-2 text-sm font-medium text-body">Search<div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3"><Search size={16} className="text-slate-400" /><input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search phase, block section, station, files, images, or links" className="w-full border-none bg-transparent text-sm outline-none" /></div></label>
      </div>
      {loading ? <Spinner label="Loading tag placement rows..." /> : (
        <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-[1700px] divide-y divide-border">
              <thead className="bg-primary text-white">
                <tr>{["Sr.No.", "Phase", "Block Section", "Station", "Document Link", "Files", "Images", "Action"].map((label) => <th key={label} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">{label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.length ? filteredRecords.map((record) => (
                  <tr key={record.id} className="transition hover:bg-blue-50/60">
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{record.srNo}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{record.phase || "-"}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{record.blockSection || "-"}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{record.station || "-"}</td>
                    <td className="px-4 py-4 align-top">{record.documentType === "link" && record.documentLink ? <div className="space-y-1"><a href={record.documentLink} target="_blank" rel="noreferrer" title={record.documentLink} className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10"><ExternalLink size={14} /><span className="truncate">{truncateUrl(record.documentLink)}</span></a>{isDriveLink(record.documentLink) ? <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Drive Link</span> : null}</div> : <span className="text-sm text-slate-400">No link</span>}</td>
                    <td className="px-4 py-4 align-top"><div className="space-y-1">{record.documents.length ? record.documents.map((file) => <a key={`${getFileUrl(file)}-${getFileName(file)}`} href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Download size={14} />Download File</a>) : <span className="text-sm text-slate-400">No files</span>}</div></td>
                    <td className="px-4 py-4 align-top"><div className="space-y-1">{record.images.length ? record.images.map((file) => <a key={`${getFileUrl(file)}-${getFileName(file)}`} href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"><FileImage size={14} />Open Image</a>) : <span className="text-sm text-slate-400">No images</span>}</div></td>
                    <td className="px-4 py-4 align-top"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setSelectedRecord(record); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover"><Pencil size={14} />Edit</button>{record.documentType === "link" && record.documentLink ? <button type="button" onClick={() => window.open(record.documentLink, "_blank", "noopener,noreferrer")} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"><Link2 size={14} />View Link</button> : null}{canDelete ? <button type="button" onClick={() => setDeleteTarget(record)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"><Trash2 size={14} />Delete</button> : null}</div></td>
                  </tr>
                )) : <tr><td colSpan="8" className="px-4 py-16 text-center text-sm text-slate-500">No tag placement rows available for the current filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <TagPlacementModal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedRecord(null); }} onSubmit={handleSave} record={selectedRecord} nextSrNo={nextSrNo} />
      {canDelete ? <ConfirmationModal open={Boolean(deleteTarget)} title="Delete tag placement row?" description="This moves the selected tag placement row to the admin restore bin." confirmLabel="Delete Row" onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} /> : null}
    </AppShell>
  );
};

export default TagPlacementPlansPage;
