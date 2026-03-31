import { Paperclip, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { departments } from "../constants/departments";
import { uploadApi } from "../services/api";

const defaultState = {
  department: departments[0],
  title: "",
  description: "",
  fileUrl: [],
  anonymous: false,
};

const RecordFormModal = ({ open, onClose, onSubmit, record, defaultDepartment }) => {
  const [form, setForm] = useState(defaultState);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        department: record.department,
        title: record.title,
        description: record.description,
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
    const files = event.target.files;

    if (!files?.length) {
      return;
    }

    setUploading(true);

    try {
      const payload = new FormData();
      [...files].forEach((file) => payload.append("files", file));
      const response = await uploadApi.uploadFiles(payload);
      const uploaded = response.data.data.map((item) => item.url);

      setForm((current) => ({
        ...current,
        fileUrl: [...current.fileUrl, ...uploaded],
      }));
      toast.success("Files uploaded successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload files.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <UploadCloud size={22} />
                </div>
                <div>
                  <p className="font-semibold text-body">Upload PDF, Excel, and image files</p>
                  <p className="text-sm text-slate-500">Maximum 5 files per upload request, up to 10 MB each.</p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-hover">
                {uploading ? "Uploading..." : "Select Files"}
                <input type="file" multiple accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            {form.fileUrl.length ? (
              <div className="mt-4 space-y-2">
                {form.fileUrl.map((file) => (
                  <div key={file} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Paperclip size={16} className="text-primary" />
                      <a href={file} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-primary hover:underline">
                        {file.split("/").pop()}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          fileUrl: current.fileUrl.filter((item) => item !== file),
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
