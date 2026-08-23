import { api } from "../../../services/api.js";
import { API_URL } from "../../../config/BaseUrl.js";

const BASE = "/api/admin/crew";

// ── Crew CRUD ─────────────────────────────────────────────────────────────────

export async function fetchCrew(role = null) {
  const qs = role ? `?role=${role}` : "";
  return api.get(`${BASE}${qs}`, { auth: true });
}

export async function fetchCrewMember(id) {
  return api.get(`${BASE}/${id}`, { auth: true });
}

export async function createCrew(payload) {
  return api.post(BASE, payload, { auth: true });
}

export async function updateCrew(id, payload) {
  return api.put(`${BASE}/${id}`, payload, { auth: true });
}

export async function deleteCrew(id) {
  return api.delete(`${BASE}/${id}`, { auth: true });
}

/** Returns URL for the QR ID card PDF (open in new tab) */
export function getCrewQrPdfUrl(id) {
  return `${API_URL}${BASE}/${id}/qr-pdf`;
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function fetchAssignments({ date = null, scheduleId = null } = {}) {
  const params = new URLSearchParams();
  if (date)       params.set("date", date);
  if (scheduleId) params.set("schedule_id", scheduleId);
  const qs = params.toString() ? `?${params}` : "";
  return api.get(`${BASE}/assignments${qs}`, { auth: true });
}

export async function createAssignment(payload) {
  return api.post(`${BASE}/assignments`, payload, { auth: true });
}

export async function deleteAssignment(id) {
  return api.delete(`${BASE}/assignments/${id}`, { auth: true });
}

// ── Check-in ──────────────────────────────────────────────────────────────────

export async function getCheckinByQr(qrCode) {
  return api.get(`${BASE}/checkin-by-qr/${encodeURIComponent(qrCode)}`, { auth: true });
}

export async function recordCrewCheckin({ qr_code, schedule_id = null, note = "" }) {
  return api.post(`${BASE}/checkin`, { qr_code, schedule_id, note }, { auth: true });
}
