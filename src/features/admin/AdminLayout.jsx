import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { isUserAdmin } from "../../utils/roleUtils.js";
import { ToastProvider } from "./ui/ToastContext.jsx";
import { ConfirmProvider } from "./ui/ConfirmContext.jsx";
import {
  LayoutDashboard,
  ClipboardList,
  Armchair,
  ScanLine,
  Upload,
  FileText,
  FolderOpen,
  Database,
  Users,
  LogOut,
  Menu,
  Printer,
} from "lucide-react";
import "./ui/adminTheme.css";
import "./ui/AdminUI.css";
import "./AdminLayout.css";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Daily Ops", path: "/admin/daily-ops", icon: ClipboardList },
  {
    label: "Yacht Seat Booking",
    path: "/admin/yacht-seat-booking",
    icon: Armchair,
  },
  { label: "Check-in", path: "/admin/checkin", icon: ScanLine },
  { label: "Print Desk", path: "/admin/print-desk", icon: Printer },
  { label: "Manifest Upload", path: "/admin/manifest-upload", icon: Upload },
  { label: "Manifest Final", path: "/admin/manifest-final", icon: FileText },
  { label: "Manifest", path: "/admin/manifest", icon: FolderOpen },
  { label: "Crew", path: "/admin/crew", icon: Users },
  { label: "Master Data", path: "/admin/master-data", icon: Database },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (!isUserAdmin(user)) {
      navigate("/admin/login", { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) return <div className="adm-shell-loading">Loading...</div>;
  if (!isAuthenticated || !user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="adm-shell">
          {/* Mobile toggle */}
          <button
            type="button"
            className="adm-mobile-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu size={18} />
          </button>

          <aside
            className={`adm-sidebar ${sidebarOpen ? "adm-sidebar-open" : ""}`}
          >
            {/* Brand */}
            <div
              className="adm-sidebar-brand"
              style={{ justifyContent: "center", padding: "20px 16px" }}
            >
              <img
                src="/images/logo/nama-marine-logo.png"
                alt="NAMA Marine"
                style={{ height: 75, maxWidth: 180, objectFit: "contain" }}
              />
            </div>

            {/* Nav */}
            <nav className="adm-sidebar-nav">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`adm-sidebar-link ${isActive ? "adm-sidebar-link-active" : ""}`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="adm-sidebar-link-icon"
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="adm-sidebar-footer">
              <div className="adm-sidebar-user">
                <div className="adm-sidebar-user-avatar">
                  {(user.fullname || user.username || "A")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="adm-sidebar-user-info">
                  <div className="adm-sidebar-user-name">
                    {user.fullname || user.username}
                  </div>
                  <div className="adm-sidebar-user-role">Admin</div>
                </div>
              </div>
              <button
                type="button"
                className="adm-sidebar-logout"
                onClick={handleLogout}
              >
                <LogOut
                  size={13}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                Log out
              </button>
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="adm-sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="adm-content">
            <div className="adm-content-inner">{children}</div>
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
