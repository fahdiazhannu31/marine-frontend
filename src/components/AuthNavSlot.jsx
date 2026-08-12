import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { isUserAdmin } from "../utils/roleUtils";
import "./AuthNavSlot.css";
import { FaRegUserCircle } from "react-icons/fa";

export default function AuthNavSlot() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleClickAway = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [open, closeMenu]);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate("/");
  };

  if (isLoading) return null;

  // =========================
  // Belum Login
  // =========================
  if (!isAuthenticated) {
    return (
      <div className="nama-auth-slot nama-auth-slot-user" ref={wrapRef}>
        <button
          type="button"
          className="nama-auth-user-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <FaRegUserCircle size={24} />
        </button>

        {open && (
          <div className="nama-auth-dropdown" role="menu">
            <Link to="/login" onClick={closeMenu} role="menuitem">
              Log In
            </Link>

            <Link to="/register" onClick={closeMenu} role="menuitem">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // Sudah Login
  // =========================
  const displayName = user?.fullname || user?.username || "Account";
  const firstName = displayName.split(" ")[0];
  const isAdmin = isUserAdmin(user);

  return (
    <div className="nama-auth-slot nama-auth-slot-user" ref={wrapRef}>
      <button
        type="button"
        className="nama-auth-user-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <FaRegUserCircle size={22} />
        <span>{firstName}</span>
      </button>

      {open && (
        <div className="nama-auth-dropdown" role="menu">
          <Link to="/profile" onClick={closeMenu} role="menuitem">
            Profile
          </Link>

          <Link to="/transactions" onClick={closeMenu} role="menuitem">
            My Transactions
          </Link>

          {isAdmin && (
            <>
              <hr className="dropdown-divider" />
              <Link
                to="/admin/yacht-seat-booking"
                onClick={closeMenu}
                role="menuitem"
              >
                🔧 Admin Panel
              </Link>
            </>
          )}

          <button type="button" onClick={handleLogout} role="menuitem">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
