import { ChevronDown, LogOut, Search } from "lucide-react";
import { useState } from "react";

const Topbar = ({ user, onLogout, searchValue, onSearchChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="glass-panel sticky top-0 z-20 mb-6 rounded-lg border border-white/60 px-4 py-4 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search workflow records, creators, and documents..."
            className="w-full rounded-lg border border-border bg-white px-11 py-3 text-sm text-body outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className="relative self-end lg:self-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-body shadow-sm transition hover:border-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {user?.name?.slice(0, 1) || "U"}
            </div>
            <div className="text-left">
              <p>{user?.name}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{user?.role}</p>
            </div>
            <ChevronDown size={16} className={menuOpen ? "rotate-180 transition" : "transition"} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 mt-3 w-56 rounded-lg border border-border bg-white p-2 shadow-soft">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-accent transition hover:bg-accent/5"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
