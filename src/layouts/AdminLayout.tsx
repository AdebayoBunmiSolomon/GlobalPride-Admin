import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { authService } from "@/api/services/auth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useSettings } from "@/hooks/useSettings";
import { useAdminSettings } from "@/store/settingsStore";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** App shell for authenticated pages: sidebar + top bar + routed content. */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  // Loads the platform settings once signed in; they also refresh the persisted `useSettings` cache.
  useAdminSettings();
  const sessionTimeout = useSettings((state) => state.security.sessionTimeout);

  // Settings → Security → Admin Session Timeout.
  useIdleTimeout(sessionTimeout * 60_000, () => {
    authService.signOut();
    navigate("/", { replace: true });
  });

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
