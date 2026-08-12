import { api } from "../../../services/api.js";

/** Queue of manual (bank transfer) bookings awaiting admin review. */
export async function fetchManualVerifications() {
  return api.get("/api/admin/manual-verifications", { auth: true });
}

export async function approveManualPayment(bookingId) {
  return api.post(
    `/api/admin/manual-verifications/${bookingId}/approve`,
    {},
    { auth: true },
  );
}

export async function rejectManualPayment(bookingId) {
  return api.post(
    `/api/admin/manual-verifications/${bookingId}/reject`,
    {},
    { auth: true },
  );
}

/**
 * Daily-ops widgets: unassigned seats, capacity warnings, today/tomorrow
 * schedules. Response: { manual_verification_count, unassigned_seats,
 * capacity_warnings, today_tomorrow }
 */
export async function fetchOpsOverview() {
  return api.get("/api/admin/ops-overview", { auth: true });
}
