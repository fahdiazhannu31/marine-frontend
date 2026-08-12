import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { isUserAdmin } from "../../utils/roleUtils.js";
import { ToastProvider } from "./ui/ToastContext.jsx";
import { ConfirmProvider } from "./ui/ConfirmContext.jsx";
import "./ui/adminTheme.css";
import "./ui/AdminUI.css";
import "./AdminLayout.css";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "📊" },
  { label: "Daily Ops", path: "/admin/daily-ops", icon: "✅" },
  {
    label: "Yacht Seat Booking",
    path: "/admin/yacht-seat-booking",
    icon: "🪑",
  },
  { label: "Check-in", path: "/admin/checkin", icon: "📱" },
  { label: "Manifest Upload", path: "/admin/manifest-upload", icon: "📤" },
  { label: "Manifest Final", path: "/admin/manifest-final", icon: "📋" },
  { label: "Manifest", path: "/admin/manifest", icon: "🗂️" },
  { label: "Master Data", path: "/admin/master-data", icon: "🛠️" },
];

/**
 * Admin panel layout wrapper.
 * Checks if user is authenticated and has admin role, renders the sidebar
 * shell, and provides Toast/Confirm context to every admin page.
 */
export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isUserAdmin(user)) {
      navigate("/", { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return <div className="adm-shell-loading">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="adm-shell">
          <button
            type="button"
            className="adm-mobile-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <aside
            className={`adm-sidebar ${sidebarOpen ? "adm-sidebar-open" : ""}`}
          >
            <div className="adm-sidebar-brand">
              <span className="adm-sidebar-brand-text">NAMA Marine</span>
            </div>

            <nav className="adm-sidebar-nav">
              {ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`adm-sidebar-link ${
                    location.pathname === item.path
                      ? "adm-sidebar-link-active"
                      : ""
                  }`}
                >
                  <span className="adm-sidebar-link-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

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
