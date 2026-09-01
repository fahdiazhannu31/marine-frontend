import { api, getToken } from "../../../services/api.js";
import { API_URL } from "../../../config/BaseUrl.js";

const BASE = "/api/admin/manifest";

// ── Schedules (reuse existing departures/returns) ────────────────────────────
export async function fetchSchedulesForManifest() {
  const [dep, ret] = await Promise.all([
    api.get("/api/schedules/departures"),
    api.get("/api/schedules/returns"),
  ]);
  const tag = (list, type) =>
    (Array.isArray(list) ? list : []).map((s) => ({ ...s, type }));
  return [...tag(dep, "DEPARTURE"), ...tag(ret, "RETURN")].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
}

// ── Uploads ──────────────────────────────────────────────────────────────────
export async function fetchUploads(scheduleId = null) {
  const qs = scheduleId ? `?schedule_id=${scheduleId}` : "";
  return api.get(`${BASE}/uploads${qs}`, { auth: true });
}

export async function fetchUploadDetail(uploadId) {
  return api.get(`${BASE}/uploads/${uploadId}`, { auth: true });
}

export async function confirmUpload(uploadId) {
  return api.post(`${BASE}/uploads/${uploadId}/confirm`, {}, { auth: true });
}

export async function forceAssignSeats(uploadId) {
  return api.post(
    `${BASE}/uploads/${uploadId}/force-assign`,
    {},
    { auth: true },
  );
}

export async function deleteUpload(uploadId) {
  return api.get(`${BASE}/delete-upload/${uploadId}`, { auth: true });
}

// ── File upload (multipart) ──────────────────────────────────────────────────
export async function uploadManifestFile({
  file,
  scheduleId,
  direction = "DEPARTURE",
  captainName = "",
  abkNames = "",
  notes = "",
}) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("schedule_id", scheduleId);
  formData.append("direction", direction);
  if (captainName) formData.append("captain_name", captainName);
  if (abkNames) formData.append("abk_names", abkNames);
  if (notes) formData.append("notes", notes);

  const res = await fetch(`${API_URL}${BASE}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Upload failed (HTTP ${res.status})`);
  }
  return data;
}

// ── Boats (with crew info) ───────────────────────────────────────────────────
export async function fetchBoatsWithCrew() {
  return api.get(`${BASE}/boats`, { auth: true });
}

export async function updateBoatCrew(boatId, { captain_name, abk_names }) {
  return api.put(
    `${BASE}/boats/${boatId}/crew`,
    { captain_name, abk_names },
    { auth: true },
  );
}

// ── Baggage ──────────────────────────────────────────────────────────────────
export async function fetchBaggage(uploadId) {
  return api.get(`${BASE}/baggage/${uploadId}`, { auth: true });
}

export async function addBaggage(payload) {
  return api.post(`${BASE}/baggage`, payload, { auth: true });
}

export async function updateBaggage(id, payload) {
  return api.put(`${BASE}/baggage/${id}`, payload, { auth: true });
}

export async function deleteBaggage(id) {
  return api.delete(`${BASE}/baggage/${id}`, { auth: true });
}

export async function markBaggagePrinted(id) {
  return api.post(`${BASE}/baggage/${id}/mark-printed`, {}, { auth: true });
}

// ── Tickets (edit, toggle cancel) ────────────────────────────────────────────
export async function updateTicket(ticketId, payload) {
  return api.put(`${BASE}/tickets/${ticketId}`, payload, { auth: true });
}

export async function toggleCancelTicket(ticketId) {
  return api.post(
    `${BASE}/tickets/${ticketId}/toggle-cancel`,
    {},
    { auth: true },
  );
}

export async function fetchAvailableSeats(uploadId) {
  return api.get(`${BASE}/available-seats/${uploadId}`, { auth: true });
}

// ── Manifest Final & Export ──────────────────────────────────────────────────
export async function fetchManifestFinal(uploadId, view = "departure") {
  return api.get(`${BASE}/final/${uploadId}?view=${view}`, { auth: true });
}

export function getExportExcelUrl(uploadId) {
  return `${API_URL}${BASE}/export-excel/${uploadId}`;
}

// ── Crew check-ins for a schedule ────────────────────────────────────────────
export async function fetchCrewCheckins(scheduleId, tripDate = null) {
  const params = tripDate ? `?trip_date=${tripDate}` : "";
  return api.get(`${BASE}/crew-checkins/${scheduleId}${params}`, {
    auth: true,
  });
}

// ── Switch seats between two passengers ──────────────────────────────────────
export async function switchSeats(ticketAId, ticketBId) {
  return api.post(
    `${BASE}/tickets/switch-seat`,
    { ticket_a_id: ticketAId, ticket_b_id: ticketBId },
    { auth: true },
  );
}

// ── Send group QR emails ─────────────────────────────────────────────────────
export async function sendGroupQrEmails(uploadId, groupEmails = {}) {
  return api.post(
    `${BASE}/send-group-qr-emails`,
    { upload_id: uploadId, group_emails: groupEmails },
    { auth: true },
  );
}

// ── Get group QR codes for viewing ───────────────────────────────────────────
export async function fetchGroupQrCodes(uploadId) {
  return api.get(`${BASE}/group-qr-codes/${uploadId}`, { auth: true });
}
