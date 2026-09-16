import { api } from "./api";

/**
 * User Management Service
 * Admin-only endpoints for managing users
 */

// List all users with optional filters
export const listUsers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.role) params.append("role", filters.role);
  if (filters.status) params.append("status", filters.status);

  const query = params.toString();
  const url = query ? `/api/admin/users?${query}` : "/api/admin/users";

  const response = await api.get(url, { auth: true });
  return response;
};

// Get user detail by ID
export const getUserDetail = async (userId) => {
  const response = await api.get(`/api/admin/users/${userId}`, { auth: true });
  return response;
};

// Create new user
export const createUser = async (userData) => {
  const response = await api.post("/api/admin/users", userData, { auth: true });
  return response;
};

// Update user
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/api/admin/users/${userId}`, userData, {
    auth: true,
  });
  return response;
};

// Unlock locked account
export const unlockUser = async (userId) => {
  const response = await api.post(
    `/api/admin/users/${userId}/unlock`,
    {},
    { auth: true },
  );
  return response;
};

// Reset user password (admin force reset)
export const resetUserPassword = async (userId, newPassword) => {
  const response = await api.post(
    `/api/admin/users/${userId}/reset-password`,
    {
      new_password: newPassword,
    },
    { auth: true },
  );
  return response;
};

// Deactivate user (soft delete)
export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/admin/users/${userId}`, {
    auth: true,
  });
  return response;
};
