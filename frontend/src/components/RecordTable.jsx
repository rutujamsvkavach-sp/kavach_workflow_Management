import { Download, Pencil, Trash2 } from "lucide-react";

const RecordTable = ({ records, canDelete, onEdit, onDelete }) => (
  <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-primary text-white">
          <tr>
            {["Title", "Department", "Description", "Files", "Created By", "Created At", "Actions"].map((label) => (
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
                          key={file}
                          href={file}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          <Download size={14} />
                          <span className="max-w-[180px] truncate">{file.split("/").pop()}</span>
                        </a>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No files</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-600">{record.createdBy}</td>
                <td className="px-4 py-4 align-top text-sm text-slate-600">{new Date(record.createdAt).toLocaleString()}</td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
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
              <td colSpan="7" className="px-4 py-16 text-center text-sm text-slate-500">
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
