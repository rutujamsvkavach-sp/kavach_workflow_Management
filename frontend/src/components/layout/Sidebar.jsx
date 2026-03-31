import { Menu, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

import logo from "../../assets/indian-logo.png";
import { departments } from "../../constants/departments";

const Sidebar = ({ open, onToggle, user }) => {
  const navItems = [
    { label: "Dashboard", path: "/" },
    ...departments.map((department) => ({
      label: department,
      path: `/departments/${encodeURIComponent(department)}`,
    })),
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Admin Panel", path: "/admin" });
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed left-4 top-4 z-50 rounded-lg bg-sidebar p-3 text-white shadow-soft lg:hidden"
      >
        <Menu size={20} />
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto bg-sidebar px-5 py-6 text-white transition duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <div className="rounded-lg bg-white/5 p-2">
            <img src={logo} alt="Indian Railways" className="h-14 w-14 rounded-lg object-contain" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Indian Railways</p>
            <h2 className="mt-1 font-display text-2xl">kavach_workflow Management</h2>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white/70">Workflow Command Center</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/40">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{user?.staffId || "No ID"}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-primary text-white shadow-soft" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open ? <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={onToggle} /> : null}
    </>
  );
};

export default Sidebar;
