import { api, getToken } from "../../../services/api.js";
import { API_URL } from "../../../config/BaseUrl.js";

// ── Boats ──────────────────────────────────────────────────────────
export const fetchBoats = () => api.get("/api/admin/boats", { auth: true });

function boatToFormData(boat) {
  const fd = new FormData();
  fd.append("boat_name", boat.boat_name ?? "");
  fd.append("capacity", boat.capacity ?? "");
  if (boat.photo1 instanceof File) fd.append("photo1", boat.photo1);
  return fd;
}

export const createBoat = (boat) =>
  multipartRequest("/api/admin/boats", "POST", boatToFormData(boat));

// Update also goes through POST (not PUT) so the photo1 upload works reliably.
export const updateBoat = (id, boat) =>
  multipartRequest(`/api/admin/boats/${id}`, "POST", boatToFormData(boat));

export const deleteBoat = (id) =>
  api.delete(`/api/admin/boats/${id}`, { auth: true });

// ── Schedules ──────────────────────────────────────────────────────
export const fetchSchedules = () =>
  api.get("/api/admin/schedules", { auth: true });
export const createSchedule = (data) =>
  api.post("/api/admin/schedules", data, { auth: true });
export const updateSchedule = (id, data) =>
  api.put(`/api/admin/schedules/${id}`, data, { auth: true });
export const deleteSchedule = (id) =>
  api.delete(`/api/admin/schedules/${id}`, { auth: true });

// ── Packages (multipart/form-data because of photo uploads) ─────────
export const fetchPackagesAdmin = () =>
  api.get("/api/admin/packages", { auth: true });

async function multipartRequest(path, method, formData) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function packageToFormData(pkg) {
  const fd = new FormData();
  fd.append("title", pkg.title ?? "");
  fd.append("description", pkg.description ?? "");
  fd.append("price_per_pax", pkg.price_per_pax ?? "");
  fd.append("price_per_pax_weekend", pkg.price_per_pax_weekend ?? "");
  fd.append("pax_count", pkg.pax_count ?? "");
  fd.append("status", pkg.status ?? "active");
  ["photo1", "photo2", "photo3"].forEach((key) => {
    if (pkg[key] instanceof File) fd.append(key, pkg[key]);
  });
  return fd;
}

export const createPackage = (pkg) =>
  multipartRequest("/api/admin/packages", "POST", packageToFormData(pkg));

// Update also goes through POST (not PUT) so file uploads work reliably.
export const updatePackage = (id, pkg) =>
  multipartRequest(`/api/admin/packages/${id}`, "POST", packageToFormData(pkg));

export const deletePackage = (id) =>
  api.delete(`/api/admin/packages/${id}`, { auth: true });
