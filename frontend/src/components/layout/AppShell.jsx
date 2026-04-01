import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
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
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
