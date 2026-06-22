import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { isReadOnlyUser } from "../../utils/access";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppShell = ({ children, searchValue, onSearchChange, searchPlaceholder, searchDisabled = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-page">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} user={user} />
      <div className="min-h-screen lg:pl-72">
        <main className="px-4 py-4 lg:px-8 lg:py-6">
          <Topbar
            user={user}
            onLogout={logout}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            searchDisabled={searchDisabled}
          />
          {isReadOnlyUser(user) ? (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
              Viewer access: you can view, open links, download files, and export data. Editing, uploads, and deletion are disabled.
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
