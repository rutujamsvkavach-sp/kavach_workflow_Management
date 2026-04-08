import {
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
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
import { recordsApi, uploadApi } from "../services/api";
import { getFileName, getFileUrl } from "../utils/files";

const DEPARTMENT_NAME = "CIVIL";
const DOCUMENT_TYPE_OPTIONS = [
  { value: "file", label: "Upload File" },
  { value: "image", label: "Upload Image" },
  { value: "link", label: "Use Link (URL)" },
];
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

const createEmptyFieldValue = () => ({
  text: "",
  files: [],
  documentType: "file",
  documentLink: "",
});

const createEmptyForm = () => ({
  ...FIELD_DEFINITIONS.reduce((accumulator, field) => {
    accumulator[field.key] = createEmptyFieldValue();
    return accumulator;
  }, {}),
});

const csvEscape = (value) => `"${String(value || "").replace(/"/g, '""')}"`;
const isHttpUrl = (value) => /^https?:\/\/.+/i.test(String(value || "").trim());
const isDriveLink = (value) => /drive\.google\.com|docs\.google\.com/i.test(String(value || ""));
const truncateUrl = (value, maxLength = 42) => {
  const url = String(value || "").trim();

  if (!url || url.length <= maxLength) {
    return url;
  }

  return `${url.slice(0, maxLength - 3)}...`;
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

const normalizeFieldValue = (value) => {
  const files = value?.files || [];
  const documentLink = value?.documentLink || "";
  const documentType = value?.documentType || (documentLink ? "link" : "file");

  return {
    text: value?.text || "",
    files: documentType === "link" ? [] : files,
    documentType,
    documentLink,
  };
};

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
  documentType: "file",
  documentLink: "",
  civilMeta: {
    srNo,
    ...FIELD_DEFINITIONS.reduce((accumulator, field) => {
      accumulator[field.key] = {
        text: form[field.key].text,
        files: form[field.key].documentType === "link" ? [] : form[field.key].files,
        documentType: form[field.key].documentType,
        documentLink: form[field.key].documentType === "link" ? form[field.key].documentLink.trim() : "",
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
          ${FIELD_DEFINITIONS.map((field) => {
            const value = record.civilMeta[field.key];
            const linkSummary = value?.documentType === "link" && value?.documentLink ? `Link: ${value.documentLink}` : "";
            const fileSummary = value?.files?.map(getFileName).join(", ");
            return `<td>${[value?.text || "", linkSummary, fileSummary].filter(Boolean).join(" | ")}</td>`;
          }).join("")}
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
      toast.success("Attachments uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload files.");
    } finally {
      setUploadingField("");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    for (const field of FIELD_DEFINITIONS) {
      const value = form[field.key];
      if (value.documentType === "link") {
        const trimmedLink = value.documentLink.trim();
        if (trimmedLink && !isHttpUrl(trimmedLink)) {
          toast.error(`${field.label}: enter a valid http/https link.`);
          return;
        }
      }
    }

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
            {FIELD_DEFINITIONS.map((field) => {
              const fieldValue = form[field.key];

              return (
                <div key={field.key} className="rounded-lg border border-border bg-white p-4">
                  <label className="block space-y-2 text-sm font-medium text-body">
                    {field.label}
                    <textarea
                      rows={3}
                      value={fieldValue.text}
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

                  <div className="mt-4 space-y-3">
                    <div className="inline-flex rounded-full border border-primary/15 bg-primary/5 p-1">
                      {DOCUMENT_TYPE_OPTIONS.map((option) => (
                        <button
                          key={`${field.key}-${option.value}`}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              [field.key]: {
                                ...current[field.key],
                                documentType: option.value,
                                documentLink: option.value === "link" ? current[field.key].documentLink : "",
                                files: option.value === "link" ? [] : current[field.key].files,
                              },
                            }))
                          }
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            fieldValue.documentType === option.value ? "bg-primary text-white shadow-sm" : "text-primary/80 hover:text-primary"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {fieldValue.documentType === "link" ? (
                      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                        <label className="block space-y-2 text-sm font-medium text-body">
                          Document URL
                          <input
                            type="url"
                            value={fieldValue.documentLink}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                [field.key]: {
                                  ...current[field.key],
                                  documentLink: event.target.value,
                                },
                              }))
                            }
                            placeholder="Paste Google Drive / OneDrive / Any File Link"
                            className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </label>
                        {fieldValue.documentLink.trim() ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                              <Link2 size={12} />
                              {truncateUrl(fieldValue.documentLink)}
                            </span>
                            {isDriveLink(fieldValue.documentLink) ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Drive Link</span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-body">{fieldValue.documentType === "image" ? "Upload image" : "Upload file"}</p>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover">
                            {fieldValue.documentType === "image" ? <FileImage size={14} /> : <UploadCloud size={14} />}
                            {uploadingField === field.key ? "Uploading..." : fieldValue.documentType === "image" ? "Upload Image" : "Upload File"}
                            <input
                              type="file"
                              multiple
                              accept={fieldValue.documentType === "image" ? "image/*" : ".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp"}
                              className="hidden"
                              onChange={(event) => handleFieldUpload(field.key, event)}
                            />
                          </label>
                        </div>

                        {fieldValue.files.length ? (
                          <div className="mt-3 space-y-2">
                            {fieldValue.files.map((file) => (
                              <div key={`${getFileUrl(file)}-${getFileName(file)}`} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                                <a href={getFileUrl(file)} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 truncate text-sm font-medium text-primary hover:underline">
                                  {fieldValue.documentType === "image" ? <FileImage size={14} /> : <Download size={14} />}
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
                    )}
                  </div>
                </div>
              );
            })}
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
  const { user } = useAuth();
  const canDelete = user?.role === "admin";
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
          return [value?.text || "", fileNames, value?.documentLink || "", value?.documentType || ""]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);
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
      [
        record.srNo,
        ...FIELD_DEFINITIONS.map((field) => {
          const value = record.civilMeta[field.key];
          const linkSummary = value?.documentType === "link" && value?.documentLink ? `Link: ${value.documentLink}` : "";
          const fileSummary = value?.files?.map(getFileName).join(" | ");
          return [value?.text || "", linkSummary, fileSummary].filter(Boolean).join(" | ");
        }),
      ]
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
        description="Manage civil progress rows with text, file uploads, image uploads, and link-based references without changing the row structure."
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
              placeholder="Search section, station, tower, inspection, files, images, or links"
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
                              {value?.documentType === "link" && value?.documentLink ? (
                                <div className="space-y-1">
                                  <a
                                    href={value.documentLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={value.documentLink}
                                    className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/5 px-3 py-1 font-medium text-primary hover:bg-primary/10"
                                  >
                                    <ExternalLink size={14} />
                                    <span className="truncate">{truncateUrl(value.documentLink)}</span>
                                  </a>
                                  {isDriveLink(value.documentLink) ? (
                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Drive Link</span>
                                  ) : null}
                                </div>
                              ) : value?.files?.length ? (
                                <div className="space-y-1">
                                  {value.files.map((file) => (
                                    <a
                                      key={`${getFileUrl(file)}-${getFileName(file)}`}
                                      href={getFileUrl(file)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                    >
                                      {value.documentType === "image" ? <FileImage size={14} /> : <Download size={14} />}
                                      {value.documentType === "image" ? "Open Image" : "Download File"}
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
                          {FIELD_DEFINITIONS.some((field) => record.civilMeta[field.key]?.documentType === "link" && record.civilMeta[field.key]?.documentLink) ? (
                            <button
                              type="button"
                              onClick={() => {
                                const firstLinkField = FIELD_DEFINITIONS.find(
                                  (field) => record.civilMeta[field.key]?.documentType === "link" && record.civilMeta[field.key]?.documentLink
                                );
                                if (firstLinkField) {
                                  window.open(record.civilMeta[firstLinkField.key].documentLink, "_blank", "noopener,noreferrer");
                                }
                              }}
                              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                            >
                              <Link2 size={14} />
                              View Link
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(record)}
                              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                            >
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

      {canDelete ? (
        <ConfirmationModal
          open={Boolean(deleteTarget)}
          title="Delete civil row?"
          description="This moves the selected civil row to the admin restore bin."
          confirmLabel="Delete Row"
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </AppShell>
  );
};

export default CivilPage;
