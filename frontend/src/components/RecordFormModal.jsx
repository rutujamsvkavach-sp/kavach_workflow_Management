import { ExternalLink, Link2, Paperclip, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { departments } from "../constants/departments";
import { uploadApi } from "../services/api";
import { getFileName, getFileUrl } from "../utils/files";

const defaultState = {
  department: departments[0],
  title: "",
  description: "",
  documentLink: "",
  documentType: "file",
  fileUrl: [],
  anonymous: false,
};

const isHttpUrl = (value) => /^https?:\/\/.+/i.test(String(value || "").trim());
const isDriveLink = (value) => /drive\.google\.com|docs\.google\.com/i.test(String(value || ""));
const truncateUrl = (value, maxLength = 52) => {
  const normalized = String(value || "").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
};
const uploadModes = [
  { value: "file", label: "Upload File" },
  { value: "image", label: "Upload Image" },
  { value: "link", label: "Use Link (URL)" },
];

const RecordFormModal = ({ open, onClose, onSubmit, record, defaultDepartment }) => {
  const [form, setForm] = useState(defaultState);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});

    if (record) {
      setForm({
        department: record.department,
        title: record.title,
        description: record.description,
        documentLink: record.documentLink || "",
        documentType:
          record.documentType === "link" || (record.documentLink && !record.files?.length)
            ? "link"
            : record.documentType === "image" ||
                (record.files || []).some((file) => String(file?.type || "").startsWith("image/"))
              ? "image"
              : "file",
        fileUrl: record.files || [],
        anonymous: Boolean(record.anonymous),
      });
      return;
    }

    setForm({
      ...defaultState,
      department: defaultDepartment || departments[0],
    });
  }, [defaultDepartment, open, record]);

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
      const uploaded = response.data.data;

      setForm((current) => ({
        ...current,
        fileUrl: [...current.fileUrl, ...uploaded],
      }));
      setErrors((current) => ({ ...current, documentSource: "" }));
      toast.success(`${form.documentType === "image" ? "Images" : "Files"} uploaded successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to upload ${form.documentType === "image" ? "images" : "files"}.`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDocumentTypeChange = (documentType) => {
    setForm((current) => ({
      ...current,
      documentType,
      fileUrl: documentType === "link" ? [] : current.fileUrl,
      documentLink: documentType === "link" ? current.documentLink : "",
    }));
    setErrors((current) => ({ ...current, documentSource: "", documentLink: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedLink = form.documentLink.trim();
    const nextErrors = {};

    if (form.documentType !== "link" && !form.fileUrl.length) {
      nextErrors.documentSource = `Please upload at least one ${form.documentType === "image" ? "image" : "file"}.`;
    }

    if (form.documentType === "link") {
      if (!trimmedLink) {
        nextErrors.documentLink = "Please enter a document link.";
      } else if (!isHttpUrl(trimmedLink)) {
        nextErrors.documentLink = "Please enter a valid URL starting with http:// or https://.";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast.error("Please choose a valid document source.");
      return;
    }

    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-3xl rounded-lg bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Workflow Record</p>
            <h3 className="mt-2 font-display text-3xl text-body">{record ? "Edit Department Record" : "Create Department Record"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-body">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-body">
              Department
              <select
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-body">
              Title
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Enter record title"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-body">
            Description
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
              className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Describe the workflow update, progress, dependencies, and next action."
            />
          </label>

          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-semibold text-body">Document Source</p>
              <p className="mt-1 text-sm text-slate-500">Choose either a file upload or a stored URL for this record.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {uploadModes.map((option) => {
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
                    <input
                      type="radio"
                      name="documentType"
                      value={option.value}
                      checked={isActive}
                      onChange={() => handleDocumentTypeChange(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {form.documentType !== "link" ? (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                      <UploadCloud size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-body">{form.documentType === "image" ? "Upload Image" : "Upload File"}</p>
                      <p className="text-sm text-slate-500">
                        {form.documentType === "image"
                          ? "Upload screenshots, photos, or image proof files."
                          : "Upload documents, spreadsheets, PDFs, or supporting files."}{" "}
                        Maximum 5 files per upload request, up to 10 MB each.
                      </p>
                    </div>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover">
                    {uploading ? "Uploading..." : form.documentType === "image" ? "Select Images" : "Select Files"}
                    <input
                      type="file"
                      multiple
                      accept={form.documentType === "image" ? "image/*" : ".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.doc,.docx"}
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>
                </div>

                {form.fileUrl.length ? (
                  <div className="mt-4 space-y-2">
                    {form.fileUrl.map((file) => (
                      <div key={`${getFileUrl(file)}-${getFileName(file)}`} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <Paperclip size={16} className="text-primary" />
                          <a href={getFileUrl(file)} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-primary hover:underline">
                            {getFileName(file)}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              fileUrl: current.fileUrl.filter((item) => getFileUrl(item) !== getFileUrl(file)),
                            }))
                          }
                          className="text-sm font-semibold text-accent"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No {form.documentType === "image" ? "images" : "files"} selected yet.</p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                    <Link2 size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-body">Use Link (URL)</p>
                    <p className="text-sm text-slate-500">Paste a Google Drive, OneDrive, or any file link for direct access.</p>
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
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Paste Google Drive / OneDrive / Any File Link"
                  />
                  <p className="text-sm font-normal text-slate-500">Paste a direct document, folder, or storage link that users can open later.</p>
                </label>
                {form.documentLink ? (
                  <a
                    href={form.documentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex max-w-full items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    title={form.documentLink}
                  >
                    <ExternalLink size={14} />
                    <span className="truncate">{truncateUrl(form.documentLink)}</span>
                  </a>
                ) : null}
                {form.documentLink && isDriveLink(form.documentLink) ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    <ExternalLink size={12} />
                    Drive Link
                  </div>
                ) : null}
              </div>
            )}

            {errors.documentSource ? <p className="mt-3 text-sm font-medium text-accent">{errors.documentSource}</p> : null}
            {errors.documentLink ? <p className="mt-3 text-sm font-medium text-accent">{errors.documentLink}</p> : null}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border bg-slate-50 px-4 py-4 text-sm font-medium text-body">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(event) => setForm((current) => ({ ...current, anonymous: event.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>
              <span className="block font-semibold">Post as anonymous</span>
              <span className="mt-1 block text-sm font-normal text-slate-500">
                Hide your name from the dashboard and department tables while keeping internal ownership secure.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-body transition hover:bg-slate-50"
            >
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

export default RecordFormModal;
