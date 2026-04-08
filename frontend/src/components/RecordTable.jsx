import { Download, ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import { getFileName, getFileUrl } from "../utils/files";

const isDriveLink = (value) => /drive\.google\.com|docs\.google\.com/i.test(String(value || ""));
const truncateUrl = (value, maxLength = 40) => {
  const normalized = String(value || "").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
};

const RecordTable = ({ records, canDelete, onEdit, onDelete }) => (
  <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-primary text-white">
          <tr>
            {["Title", "Department", "Description", "Files", "Document Link", "Created By", "Created At", "Actions"].map((label) => (
              <th key={label} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.length ? (
            records.map((record) => (
              <tr key={record.id} className="transition hover:bg-blue-50/60">
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-body">{record.title}</p>
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-600">{record.department}</td>
                <td className="max-w-sm px-4 py-4 align-top text-sm leading-6 text-slate-600">{record.description}</td>
                <td className="px-4 py-4 align-top">
                  <div className="space-y-2">
                    {record.files?.length ? (
                      record.files.map((file) => (
                        <a
                          key={`${getFileUrl(file)}-${getFileName(file)}`}
                          href={getFileUrl(file)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          <Download size={14} />
                          <span className="max-w-[180px] truncate">Download {getFileName(file)}</span>
                        </a>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">{record.documentType === "link" ? "Link only" : "No files"}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  {record.documentLink ? (
                    <div className="space-y-2">
                      <a
                        href={record.documentLink}
                        target="_blank"
                        rel="noreferrer"
                        title={record.documentLink}
                        className="inline-flex max-w-[220px] items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <Link2 size={14} />
                        <span className="truncate">{truncateUrl(record.documentLink)}</span>
                      </a>
                      <div className="flex flex-wrap items-center gap-2">
                        {isDriveLink(record.documentLink) ? (
                          <span
                            title="Open Document Link"
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
                          >
                            <ExternalLink size={11} />
                            Drive Link
                          </span>
                        ) : null}
                        <a
                          href={record.documentLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Document Link"
                          className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/10"
                        >
                          <ExternalLink size={13} />
                          Open
                        </a>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">No link</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>{record.createdBy}</p>
                    {record.anonymous ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Anonymous</p> : null}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-600">{new Date(record.createdAt).toLocaleString()}</td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {record.documentLink ? (
                      <a
                        href={record.documentLink}
                        target="_blank"
                        rel="noreferrer"
                        title="Open Document Link"
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/10"
                      >
                        <ExternalLink size={14} />
                        View Link
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(record)}
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
              <td colSpan="8" className="px-4 py-16 text-center text-sm text-slate-500">
                No workflow records available for the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default RecordTable;
