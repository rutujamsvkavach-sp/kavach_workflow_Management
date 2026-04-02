import {
  Download,
  FileSpreadsheet,
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
import { recordsApi, uploadApi } from "../services/api";
import { getFileName, getFileUrl } from "../utils/files";

const DEPARTMENT_NAME = "CIVIL";
const FIELD_DEFINITIONS = [
  { key: "section", label: "Section" },
  { key: "stationLcGate", label: "Station / LC Gate" },
  { key: "tentativeGadRailway", label: "Tentitive GAD (Railway)" },
  { key: "siteSurveyReportByAgency", label: "Site Survey Report by Agency" },
  { key: "towerId", label: "Tower ID" },
  { key: "completionGadOfTowerByAgency", label: "Completion GAD of Tower (by Agency)" },
  { key: "cableRoutePlanSignedCopy", label: "Cable route plan (Signed copy)" },
  { key: "soilTestBoreLog", label: "Soil Test (Bore Log)" },
  { key: "soilTestLabReport", label: "Soil Test (Lab Report)" },
  { key: "excavation", label: "Excavation" },
  { key: "pcc", label: "PCC" },
  { key: "firstStageInspection", label: "1st Stage Inspection" },
  { key: "rccFirstLift", label: "RCC 1st Lift" },
  { key: "secondStageInspection", label: "2nd stage Inspection" },
  { key: "secondLiftFoundationCipFixing", label: "2nd Lift / Foundation & CIP fixing" },
  { key: "thirdStageInspection", label: "3rd stage Inspection" },
  { key: "erectionOfTower", label: "Erection of Tower" },
  { key: "erectedTowerJpg", label: "Erected Tower Jpg" },
  { key: "fourthStageInspection", label: "4th stage Inspection" },
  { key: "cableLayingTowerToRelayRoom", label: "Cable laying from Tower to Relay room" },
  { key: "earthing", label: "Earthing" },
];

const createEmptyFieldValue = () => ({ text: "", files: [] });

const createEmptyForm = () => ({
  ...FIELD_DEFINITIONS.reduce((accumulator, field) => {
    accumulator[field.key] = createEmptyFieldValue();
    return accumulator;
  }, {}),
});

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

const normalizeFieldValue = (value) => ({
  text: value?.text || "",
  files: value?.files || [],
});

const normalizeRecord = (record, index) => {
  const civilMeta = record.civilMeta || {};
  const normalizedFields = FIELD_DEFINITIONS.reduce((accumulator, field) => {
    accumulator[field.key] = normalizeFieldValue(civilMeta[field.key]);
    return accumulator;
  }, {});

  return {
    ...record,
    srNo: civilMeta.srNo || index + 1,
    civilMeta: normalizedFields,
  };
};

const buildPayload = (form, srNo) => ({
  department: DEPARTMENT_NAME,
  title: form.section.text || `Civil Row ${srNo}`,
  description: form.stationLcGate.text || "Civil workflow record",
  civilMeta: {
    srNo,
    ...FIELD_DEFINITIONS.reduce((accumulator, field) => {
      accumulator[field.key] = {
        text: form[field.key].text,
        files: form[field.key].files,
      };
      return accumulator;
    }, {}),
  },
});

const buildExcelTableMarkup = (records) => {
  const headers = ["Sr No", ...FIELD_DEFINITIONS.map((field) => field.label)];
  const rows = records
    .map(
      (record) => `
        <tr>
          <td>${record.srNo}</td>
          ${FIELD_DEFINITIONS.map((field) => `<td>${record.civilMeta[field.key]?.text || ""}</td>`).join("")}
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

const CivilModal = ({ open, onClose, onSubmit, record, nextSrNo }) => {
  const [form, setForm] = useState(createEmptyForm());
  const [uploadingField, setUploadingField] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      const nextForm = createEmptyForm();
      FIELD_DEFINITIONS.forEach((field) => {
        nextForm[field.key] = normalizeFieldValue(record.civilMeta[field.key]);
      });
      setForm(nextForm);
      return;
    }

    setForm(createEmptyForm());
  }, [open, record]);

  if (!open) {
    return null;
  }

  const handleFieldUpload = async (fieldKey, event) => {
    const files = event.target.files;

    if (!files?.length) {
      return;
    }

    setUploadingField(fieldKey);

    try {
      const payload = new FormData();
      [...files].forEach((file) => payload.append("files", file));
      const response = await uploadApi.uploadFiles(payload);
      setForm((current) => ({
        ...current,
        [fieldKey]: {
          ...current[fieldKey],
          files: [...current[fieldKey].files, ...response.data.data],
        },
      }));
      toast.success("Files uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload files.");
    } finally {
      setUploadingField("");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form, record?.srNo || nextSrNo);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-6xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Civil Workflow</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record ? "Edit Civil Row" : "Add Civil Row"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {FIELD_DEFINITIONS.map((field) => (
              <div key={field.key} className="rounded-lg border border-border bg-white p-4">
                <label className="block space-y-2 text-sm font-medium text-body">
                  {field.label}
                  <textarea
                    rows={3}
                    value={form[field.key].text}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: {
                          ...current[field.key],
                          text: event.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder={`Add text for ${field.label}`}
                  />
                </label>

                <div className="mt-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-body">Upload file / image</p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover">
                      <UploadCloud size={14} />
                      {uploadingField === field.key ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(event) => handleFieldUpload(field.key, event)}
                      />
                    </label>
                  </div>

                  {form[field.key].files.length ? (
                    <div className="mt-3 space-y-2">
                      {form[field.key].files.map((file) => (
                        <div key={`${getFileUrl(file)}-${getFileName(file)}`} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                          <a href={getFileUrl(file)} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-primary hover:underline">
                            {getFileName(file)}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                [field.key]: {
                                  ...current[field.key],
                                  files: current[field.key].files.filter((item) => getFileUrl(item) !== getFileUrl(file)),
                                },
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
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-body transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover">
              {record ? "Update Row" : "Add Row"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CivilPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
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
      toast.error(error.response?.data?.message || "Failed to load civil records.");
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
        if (!normalizedSearch) {
          return true;
        }

        return FIELD_DEFINITIONS.some((field) => {
          const value = record.civilMeta[field.key];
          const fileNames = (value?.files || []).map(getFileName).join(" ");
          return `${value?.text || ""} ${fileNames}`.toLowerCase().includes(normalizedSearch);
        });
      })
      .map((record, index) => ({ ...record, srNo: index + 1 }));
  }, [records, search]);

  const nextSrNo = useMemo(() => {
    const maxValue = records.reduce((max, record) => Math.max(max, Number(record.srNo) || 0), 0);
    return maxValue + 1;
  }, [records]);

  const handleSave = async (form, srNo) => {
    try {
      const payload = buildPayload(form, srNo);

      if (selectedRecord) {
        await recordsApi.update(selectedRecord.id, payload);
        toast.success("Civil row updated.");
      } else {
        await recordsApi.create(payload);
        toast.success("Civil row added.");
      }

      setModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save civil row.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await recordsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Civil row deleted.");
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete civil row.");
    }
  };

  const handleExportCsv = () => {
    const headers = ["Sr No", ...FIELD_DEFINITIONS.map((field) => field.label)];
    const rows = filteredRecords.map((record) =>
      [record.srNo, ...FIELD_DEFINITIONS.map((field) => record.civilMeta[field.key]?.text || "")]
        .map(csvEscape)
        .join(",")
    );

    downloadBlob([headers.join(","), ...rows].join("\n"), "civil-records.csv", "text/csv;charset=utf-8;");
  };

  const handleDownloadExcel = () => {
    downloadBlob(buildExcelTableMarkup(filteredRecords), "civil-records.xls", "application/vnd.ms-excel;charset=utf-8;");
  };

  return (
    <AppShell searchValue="" onSearchChange={() => {}} searchPlaceholder="Use civil search below." searchDisabled>
      <PageHeader
        eyebrow="Civil Workflow"
        title="CIVIL"
        description="Manage civil progress rows with text, file uploads, image uploads, search, export, and download support."
        action={
          <div className="flex flex-wrap gap-3">
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
              onClick={() => {
                setSelectedRecord(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover"
            >
              <Plus size={18} />
              Add Row
            </button>
          </div>
        }
      />

      <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <label className="space-y-2 text-sm font-medium text-body">
          Search
          <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search section, station, tower, inspection, files, or remarks"
              className="w-full border-none bg-transparent text-sm outline-none"
            />
          </div>
        </label>
      </div>

      {loading ? (
        <Spinner label="Loading civil rows..." />
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-[3400px] divide-y divide-border">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">Sr No</th>
                  {FIELD_DEFINITIONS.map((field) => (
                    <th key={field.key} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.length ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="transition hover:bg-blue-50/60">
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{record.srNo}</td>
                      {FIELD_DEFINITIONS.map((field) => {
                        const value = record.civilMeta[field.key];
                        return (
                          <td key={field.key} className="px-4 py-4 align-top">
                            <div className="space-y-2 text-sm text-slate-600">
                              <p>{value?.text || "-"}</p>
                              {value?.files?.length ? (
                                <div className="space-y-1">
                                  {value.files.map((file) => (
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
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(record);
                              setModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(record)}
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={FIELD_DEFINITIONS.length + 2} className="px-4 py-16 text-center text-sm text-slate-500">
                      No civil rows available for the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CivilModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleSave}
        record={selectedRecord}
        nextSrNo={nextSrNo}
      />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete civil row?"
        description="This will permanently remove the selected civil row."
        confirmLabel="Delete Row"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
};

export default CivilPage;
