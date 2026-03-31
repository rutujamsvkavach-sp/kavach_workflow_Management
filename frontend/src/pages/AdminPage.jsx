import { CheckCircle2, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";
import StatusBadge from "../components/ui/StatusBadge";
import { authApi } from "../services/api";
import { matchesSearch } from "../utils/search";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const response = await authApi.getUsers();
      setUsers(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    matchesSearch(search, [user.name, user.email, user.role, user.staffId, user.approved ? "approved active" : "pending suspended"])
  );

  const toggleApproval = async (user) => {
    try {
      await authApi.updateUserApproval(user.id, {
        approved: !user.approved,
        role: user.role,
      });
      toast.success("User status updated.");
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update user.");
    }
  };

  const toggleRole = async (user) => {
    try {
      await authApi.updateUserApproval(user.id, {
        approved: user.approved,
        role: user.role === "admin" ? "staff" : "admin",
      });
      toast.success("User role updated.");
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update role.");
    }
  };

  return (
    <AppShell
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search users by name, staff ID, email, role, or status..."
    >
      <PageHeader
        eyebrow="Administration"
        title="Admin Control Panel"
        description="Review registered users, approve access, and manage role assignments for the kavach_workflow Management platform."
      />

      {loading ? (
        <Spinner label="Loading user administration data..." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Registered Users</p>
              <p className="mt-3 font-display text-4xl text-body">{users.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Approved Users</p>
              <p className="mt-3 font-display text-4xl text-body">{users.filter((user) => user.approved).length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Admins</p>
              <p className="mt-3 font-display text-4xl text-body">{users.filter((user) => user.role === "admin").length}</p>
            </div>
          </div>

          {search ? (
            <div className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-slate-500 shadow-soft">
              Showing <span className="font-semibold text-body">{filteredUsers.length}</span> matching users for{" "}
              <span className="font-semibold text-primary">"{search}"</span>.
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-primary text-white">
                  <tr>
                    {["User", "Staff ID", "Email", "Role", "Status", "Actions"].map((label) => (
                      <th key={label} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em]">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition hover:bg-blue-50/60">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <UserCog size={18} />
                          </div>
                          <span className="font-semibold text-body">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-primary">{user.staffId || "Pending"}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-4">
                        <StatusBadge label={user.role} variant={user.role} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge label={user.approved ? "Approved" : "Pending"} variant={user.approved ? "approved" : "pending"} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleApproval(user)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-hover"
                          >
                            <CheckCircle2 size={14} />
                            {user.approved ? "Suspend" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRole(user)}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            Make {user.role === "admin" ? "Staff" : "Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-16 text-center text-sm text-slate-500">
                        No users match the current filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default AdminPage;
