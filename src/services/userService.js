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
  const url = query ? `/admin/users?${query}` : "/admin/users";

  const response = await api.get(url);
  return response.data;
};

// Get user detail by ID
export const getUserDetail = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

// Create new user
export const createUser = async (userData) => {
  const response = await api.post("/admin/users", userData);
  return response.data;
};

// Update user
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

// Unlock locked account
export const unlockUser = async (userId) => {
  const response = await api.post(`/admin/users/${userId}/unlock`);
  return response.data;
};

// Reset user password (admin force reset)
export const resetUserPassword = async (userId, newPassword) => {
  const response = await api.post(`/admin/users/${userId}/reset-password`, {
    new_password: newPassword,
  });
  return response.data;
};

// Deactivate user (soft delete)
export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};
