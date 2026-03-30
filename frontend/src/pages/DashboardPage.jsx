import { Activity, Building2, FileStack, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import StatCard from "../components/StatCard";
import PageHeader from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";
import { departments } from "../constants/departments";
import { useAuth } from "../context/AuthContext";
import { recordsApi } from "../services/api";

const DashboardPage = () => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);

      try {
        const response = await recordsApi.getAll();
        setRecords(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const visibleRecords = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((record) =>
      [record.title, record.department, record.description, record.createdBy].some((item) =>
        String(item).toLowerCase().includes(query)
      )
    );
  }, [records, search]);

  const departmentSummary = departments.map((department) => ({
    department,
    count: records.filter((record) => record.department === department).length,
  }));

  return (
    <AppShell searchValue={search} onSearchChange={setSearch}>
      <PageHeader
        eyebrow="Overview"
        title="Railway Workflow Dashboard"
        description="Track department activity, documentation flow, and staff contributions across the kavach_workflow Management command center."
      />

      {loading ? (
        <Spinner label="Loading dashboard metrics..." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Records" value={records.length} hint="Across all operational departments" />
            <StatCard label="Visible Records" value={visibleRecords.length} hint="Filtered by the active search term" />
            <StatCard label="Departments" value={departments.length} hint="Configured workflow divisions" accent="accent" />
            <StatCard label="Role Access" value={user.role === "admin" ? "Admin" : "Staff"} hint="Current access profile" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-body">Recent Workflow Activity</h2>
                  <p className="text-sm text-slate-500">Latest department submissions and record updates.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {visibleRecords.slice(0, 6).map((record) => (
                  <div key={record.id} className="rounded-lg border border-border p-4 transition hover:border-primary/40">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">{record.department}</p>
                        <h3 className="mt-1 text-lg font-semibold text-body">{record.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{record.description}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      <span>Created By: {record.createdBy}</span>
                      <span>Files: {record.files?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-3 text-accent">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-body">Department Coverage</h2>
                    <p className="text-sm text-slate-500">Live record count per module.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {departmentSummary.map((item) => (
                    <div key={item.department}>
                      <div className="mb-2 flex items-center justify-between text-sm font-medium text-body">
                        <span>{item.department}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min((item.count / Math.max(records.length, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <FileStack size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-body">Document Readiness</h2>
                    <p className="text-sm text-slate-500">Attachments linked to department records.</p>
                  </div>
                </div>
                <div className="mt-5 rounded-lg bg-slate-50 p-5">
                  <p className="text-4xl font-display text-body">
                    {records.reduce((sum, record) => sum + (record.files?.length || 0), 0)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Documents and media files available for review and download.</p>
                </div>
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-4">
                  <ShieldCheck className="mt-0.5 text-primary" size={18} />
                  <p className="text-sm leading-6 text-slate-600">
                    Protected access ensures only authenticated staff and admins can upload or manage sensitive project files.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default DashboardPage;
