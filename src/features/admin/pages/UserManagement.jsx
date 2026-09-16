import React, { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Edit,
  Trash2,
  LockOpen,
  Key,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { useToast } from "../ui/ToastContext.jsx";
import { useConfirm } from "../ui/ConfirmContext.jsx";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  unlockUser,
  resetUserPassword,
} from "../../../services/userService";

export default function UserManagement() {
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });

  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers(filters);
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchUsers();
  };

  // ═══════════════════════════════════════════
  // CREATE USER
  // ═══════════════════════════════════════════
  const handleOpenCreateDialog = () => {
    setFormData({
      username: "",
      fullname: "",
      email: "",
      phone: "",
      password: "",
      role: "user",
    });
    setCreateDialogOpen(true);
  };

  const handleCreateUser = async () => {
    try {
      await createUser(formData);
      toast.success("User created successfully");
      setCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create user");
    }
  };

  // ═══════════════════════════════════════════
  // EDIT USER
  // ═══════════════════════════════════════════
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      fullname: user.fullname || "",
      phone: user.phone || "",
      role: user.roles?.split(",")[0] || "user",
      active: user.active,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      await updateUser(selectedUser.id, formData);
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update user");
    }
  };

  // ═══════════════════════════════════════════
  // DELETE USER
  // ═══════════════════════════════════════════
  const handleOpenDeleteDialog = async (user) => {
    const ok = await confirm({
      title: "Deactivate User",
      message: `Are you sure you want to deactivate ${user.email}? This will revoke all active tokens.`,
      confirmLabel: "Deactivate",
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteUser(user.id);
      toast.success("User deactivated successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to deactivate user");
    }
  };

  // ═══════════════════════════════════════════
  // UNLOCK USER
  // ═══════════════════════════════════════════
  const handleUnlockUser = async (user) => {
    try {
      await unlockUser(user.id);
      toast.success(`Account ${user.email} unlocked successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to unlock user");
    }
  };

  // ═══════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════
  const handleOpenResetPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await resetUserPassword(selectedUser.id, newPassword);
      toast.success("Password reset successfully");
      setResetPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reset password");
    }
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  const formatLockoutTime = (seconds) => {
    if (!seconds || seconds <= 0) return "-";
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UserCog size={26} strokeWidth={1.8} /> User Management
          </h1>
          <p
            style={{ margin: 0, color: "var(--adm-text-muted)", fontSize: 14 }}
          >
            Manage users, roles, and account security
          </p>
        </div>
        <button
          className="adm-btn adm-btn-primary"
          onClick={handleOpenCreateDialog}
        >
          <Plus size={14} style={{ marginRight: 6 }} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div
        className="adm-card"
        style={{ padding: "16px 20px", marginBottom: 24 }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            className="adm-input"
            placeholder="Search username, email, fullname..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            style={{ minWidth: 250 }}
          />

          <select
            className="adm-select"
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            style={{ minWidth: 120 }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select
            className="adm-select"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            style={{ minWidth: 120 }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            className="adm-btn adm-btn-secondary"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={loading ? "ci-spin" : ""}
              style={{ marginRight: 6 }}
            />
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Lock Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 32 }}>
                  <RefreshCw
                    size={18}
                    className="ci-spin"
                    style={{ verticalAlign: "middle", marginRight: 8 }}
                  />
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="adm-empty"
                  style={{ textAlign: "center", padding: 32 }}
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td
                    style={{
                      color: "var(--adm-text-faint)",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    #{String(user.id).padStart(4, "0")}
                  </td>
                  <td className="adm-cell-primary">{user.username}</td>
                  <td style={{ fontSize: 13 }}>{user.email}</td>
                  <td>{user.fullname || "-"}</td>
                  <td>
                    {user.roles?.split(",").map((role) => (
                      <span
                        key={role}
                        className="adm-badge"
                        style={{
                          background:
                            role === "admin" ? "#dc262620" : "#64646420",
                          color: role === "admin" ? "#dc2626" : "#646464",
                          marginRight: 4,
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span
                      className={`adm-badge ${user.active ? "adm-badge-success" : "adm-badge-neutral"}`}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {user.is_locked ? (
                      <div>
                        <span
                          className="adm-badge"
                          style={{ background: "#f5920030", color: "#c96a00" }}
                        >
                          🔒 LOCKED
                        </span>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--adm-text-muted)",
                            marginTop: 2,
                          }}
                        >
                          {formatLockoutTime(user.lockout_remaining)} left
                        </div>
                      </div>
                    ) : user.attempt_count > 0 ? (
                      <div>
                        <span className="adm-badge adm-badge-success">OK</span>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--adm-text-muted)",
                            marginTop: 2,
                          }}
                        >
                          {user.attempt_count} failed attempts
                        </div>
                      </div>
                    ) : (
                      <span className="adm-badge adm-badge-success">OK</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {user.is_locked && (
                        <button
                          className="adm-btn adm-btn-sm adm-btn-secondary"
                          onClick={() => handleUnlockUser(user)}
                          title="Unlock Account"
                        >
                          <LockOpen size={13} />
                        </button>
                      )}
                      <button
                        className="adm-btn adm-btn-sm adm-btn-secondary"
                        onClick={() => handleOpenEditDialog(user)}
                        title="Edit"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        className="adm-btn adm-btn-sm adm-btn-secondary"
                        onClick={() => handleOpenResetPasswordDialog(user)}
                        title="Reset Password"
                      >
                        <Key size={13} />
                      </button>
                      <button
                        className="adm-btn adm-btn-sm adm-btn-danger"
                        onClick={() => handleOpenDeleteDialog(user)}
                        title="Deactivate"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {createDialogOpen && (
        <div onClick={() => setCreateDialogOpen(false)} style={styles.backdrop}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="adm-card"
            style={styles.modal}
          >
            <h3 style={{ margin: "0 0 20px" }}>Create New User</h3>

            <div className="adm-form-row">
              <div className="adm-field">
                <label>Username *</label>
                <input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div className="adm-field">
                <label>Full Name *</label>
                <input
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="adm-form-row">
              <div className="adm-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                />
              </div>
              <div className="adm-field">
                <label>Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="081234567890"
                />
              </div>
            </div>

            <div className="adm-form-row">
              <div className="adm-field">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="adm-field">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="adm-form-actions">
              <button
                className="adm-btn adm-btn-ghost"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="adm-btn adm-btn-primary"
                onClick={handleCreateUser}
              >
                <Check size={14} style={{ marginRight: 6 }} /> Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editDialogOpen && (
        <div onClick={() => setEditDialogOpen(false)} style={styles.backdrop}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="adm-card"
            style={styles.modal}
          >
            <h3 style={{ margin: "0 0 4px" }}>Edit User</h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 13,
                color: "var(--adm-text-muted)",
              }}
            >
              {selectedUser?.email}
            </p>

            <div className="adm-form-row">
              <div className="adm-field">
                <label>Full Name</label>
                <input
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                />
              </div>
              <div className="adm-field">
                <label>Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="adm-form-row">
              <div className="adm-field">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="adm-field">
                <label>Status</label>
                <select
                  value={formData.active}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      active: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>

            <div className="adm-form-actions">
              <button
                className="adm-btn adm-btn-ghost"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="adm-btn adm-btn-primary"
                onClick={handleUpdateUser}
              >
                <Check size={14} style={{ marginRight: 6 }} /> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordDialogOpen && (
        <div
          onClick={() => setResetPasswordDialogOpen(false)}
          style={styles.backdrop}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="adm-card"
            style={styles.modal}
          >
            <h3 style={{ margin: "0 0 4px" }}>Reset User Password</h3>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 13,
                color: "var(--adm-text-muted)",
              }}
            >
              User: <strong>{selectedUser?.email}</strong>
            </p>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 12,
                padding: "8px 12px",
                background: "#eff6ff",
                borderRadius: 6,
                color: "#1e40af",
              }}
            >
              ℹ️ Admin will set new password directly. User will be notified
              separately.
            </p>

            <div className="adm-field">
              <label>New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="adm-form-actions">
              <button
                className="adm-btn adm-btn-ghost"
                onClick={() => setResetPasswordDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="adm-btn adm-btn-primary"
                onClick={handleResetPassword}
              >
                <Key size={14} style={{ marginRight: 6 }} /> Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared inline styles ──────────────────────────────────────────────────────
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "90vh",
    overflow: "auto",
    padding: 28,
  },
};
