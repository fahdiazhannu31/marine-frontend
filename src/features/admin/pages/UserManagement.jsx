import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockOpen as UnlockIcon,
  VpnKey as ResetPasswordIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  unlockUser,
  resetUserPassword,
} from '../../../services/userService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
  });

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
  });

  const [newPassword, setNewPassword] = useState('');

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers(filters);
      setUsers(data);
    } catch (error) {
      showSnackbar('Failed to load users', 'error');
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

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ═══════════════════════════════════════════
  // CREATE USER
  // ═══════════════════════════════════════════
  const handleOpenCreateDialog = () => {
    setFormData({
      username: '',
      fullname: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
    });
    setCreateDialogOpen(true);
  };

  const handleCreateUser = async () => {
    try {
      await createUser(formData);
      showSnackbar('User created successfully');
      setCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to create user', 'error');
    }
  };

  // ═══════════════════════════════════════════
  // EDIT USER
  // ═══════════════════════════════════════════
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      fullname: user.fullname || '',
      phone: user.phone || '',
      role: user.roles?.split(',')[0] || 'user',
      active: user.active,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      await updateUser(selectedUser.id, formData);
      showSnackbar('User updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to update user', 'error');
    }
  };

  // ═══════════════════════════════════════════
  // DELETE USER
  // ═══════════════════════════════════════════
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(selectedUser.id);
      showSnackbar('User deactivated successfully');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to deactivate user', 'error');
    }
  };

  // ═══════════════════════════════════════════
  // UNLOCK USER
  // ═══════════════════════════════════════════
  const handleUnlockUser = async (user) => {
    try {
      await unlockUser(user.id);
      showSnackbar(`Account ${user.email} unlocked successfully`);
      fetchUsers();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to unlock user', 'error');
    }
  };

  // ═══════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════
  const handleOpenResetPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      await resetUserPassword(selectedUser.id, newPassword);
      showSnackbar('Password reset successfully');
      setResetPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to reset password', 'error');
    }
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  const formatLockoutTime = (seconds) => {
    if (!seconds || seconds <= 0) return '-';
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Search"
            placeholder="Username, email, fullname"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role}
              label="Role"
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleApplyFilters}
            disabled={loading}
          >
            Apply
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add User
          </Button>
        </Stack>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Lock Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullname || '-'}</TableCell>
                  <TableCell>
                    {user.roles?.split(',').map((role) => (
                      <Chip
                        key={role}
                        label={role}
                        size="small"
                        color={role === 'admin' ? 'error' : 'default'}
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={user.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.is_locked ? (
                      <Tooltip title={`Locked for ${formatLockoutTime(user.lockout_remaining)}`}>
                        <Chip label="LOCKED" size="small" color="warning" />
                      </Tooltip>
                    ) : (
                      <Chip label="OK" size="small" color="success" />
                    )}
                    {user.attempt_count > 0 && !user.is_locked && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {user.attempt_count} failed attempts
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEditDialog(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {user.is_locked && (
                      <Tooltip title="Unlock Account">
                        <IconButton size="small" color="warning" onClick={() => handleUnlockUser(user)}>
                          <UnlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Reset Password">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenResetPasswordDialog(user)}
                      >
                        <ResetPasswordIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Deactivate">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(user)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Full Name"
              required
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081234567890"
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Minimum 8 characters"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.active}
                label="Status"
                onChange={(e) => setFormData({ ...formData, active: e.target.value })}
              >
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Deactivate User</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will deactivate the user account and revoke all active tokens.
          </Alert>
          <Typography>
            Are you sure you want to deactivate <strong>{selectedUser?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)}>
        <DialogTitle>Reset User Password</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Admin will set new password directly. User will be notified separately.
          </Alert>
          <Typography variant="body2" gutterBottom>
            User: <strong>{selectedUser?.email}</strong>
          </Typography>
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 8 characters"
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
