import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import RecordFormModal from "../components/RecordFormModal";
import RecordTable from "../components/RecordTable";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import PageHeader from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { recordsApi } from "../services/api";

const DepartmentPage = () => {
  const { departmentName } = useParams();
  const department = decodeURIComponent(departmentName);
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadRecords = async () => {
    setLoading(true);

    try {
      const response = await recordsApi.getAll({
        department,
      });
      setRecords(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load department records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [department]);

  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((record) =>
      [record.title, record.description, record.createdBy].some((item) => String(item).toLowerCase().includes(query))
    );
  }, [records, search]);

  const handleSave = async (payload) => {
    try {
      if (selectedRecord) {
        await recordsApi.update(selectedRecord.id, payload);
        toast.success("Record updated successfully.");
      } else {
        await recordsApi.create(payload);
        toast.success("Record created successfully.");
      }

      setModalOpen(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save record.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await recordsApi.remove(deleteTarget.id);
      toast.success("Record deleted successfully.");
      setDeleteTarget(null);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete record.");
    }
  };

  return (
    <AppShell searchValue={search} onSearchChange={setSearch}>
      <PageHeader
        eyebrow="Department Workflow"
        title={department}
        description={`Manage ${department} workflow records, attach field documents, and review operational progress from a responsive control view.`}
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
            Add Record
          </button>
        }
      />

      {loading ? (
        <Spinner label={`Loading ${department} records...`} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Department Total</p>
              <p className="mt-3 font-display text-4xl text-body">{records.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Visible Records</p>
              <p className="mt-3 font-display text-4xl text-body">{filteredRecords.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Attachments</p>
              <p className="mt-3 font-display text-4xl text-body">
                {records.reduce((sum, record) => sum + (record.files?.length || 0), 0)}
              </p>
            </div>
          </div>

          <RecordTable
            records={filteredRecords}
            canDelete={user.role === "admin"}
            onEdit={(record) => {
              setSelectedRecord(record);
              setModalOpen(true);
            }}
            onDelete={(record) => setDeleteTarget(record)}
          />
        </div>
      )}

      <RecordFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleSave}
        record={selectedRecord}
        defaultDepartment={department}
      />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete workflow record?"
        description="This will permanently remove the selected record from Google Sheets. This action cannot be undone."
        confirmLabel="Delete Record"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
};

export default DepartmentPage;
