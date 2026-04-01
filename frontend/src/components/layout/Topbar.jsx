import { Bell, ChevronDown, LogOut, Search, X } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";

const formatTimeAgo = (value) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Topbar = ({
  user,
  onLogout,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search workflow records, creators, and documents...",
  searchDisabled = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <header className="glass-panel sticky top-0 z-20 mb-6 rounded-lg border border-white/60 px-4 py-4 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            disabled={searchDisabled}
            className="w-full rounded-lg border border-border bg-white px-11 py-3 pr-11 text-sm text-body outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-body"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 self-end lg:self-auto">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                if (!notificationsOpen) {
                  markAllAsRead();
                }
              }}
              className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-white text-body shadow-sm transition hover:border-primary"
            >
              <Bell size={18} />
              {unreadCount ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div className="absolute right-0 mt-3 w-80 rounded-lg border border-border bg-white p-3 shadow-soft">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-body">Notifications</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Login and logout activity</p>
                  </div>
                  {notifications.length ? (
                    <button
                      type="button"
                      onClick={clearNotifications}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-accent transition hover:text-red-700"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {notifications.length ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-border bg-slate-50 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-body">{notification.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((current) => !current);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-body shadow-sm transition hover:border-primary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {user?.name?.slice(0, 1) || "U"}
              </div>
              <div className="text-left">
                <p>{user?.name}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{user?.staffId || "No ID"}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{user?.role}</p>
              </div>
              <ChevronDown size={16} className={menuOpen ? "rotate-180 transition" : "transition"} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-3 w-56 rounded-lg border border-border bg-white p-2 shadow-soft">
                <div className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {user?.staffId || "Staff ID pending"}
                </div>
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
      </div>
    </header>
  );
};

export default Topbar;
