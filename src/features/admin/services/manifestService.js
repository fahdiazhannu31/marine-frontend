import { api } from "../../../services/api.js";
import { fetchDepartures, fetchReturns } from "../../../services/bookingService.js";

/**
 * Fetch all schedules (departure + return) for the schedule picker,
 * tagged with a human-readable label.
 */
export async function fetchAllSchedules() {
  const [departures, returns] = await Promise.all([
    fetchDepartures(),
    fetchReturns(),
  ]);

  const tag = (list, type) =>
    (Array.isArray(list) ? list : []).map((s) => ({ ...s, type }));

  return [...tag(departures, "DEPARTURE"), ...tag(returns, "RETURN")].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
}

/**
 * Fetch the passenger manifest (name, NIK, seat, group, check-in status)
 * for every SETTLED booking on a given schedule.
 * Response: { schedule: {...}, passengers: [{...}] }
 */
export async function fetchManifest(scheduleId) {
  return api.get(`/api/admin/manifest?schedule_id=${scheduleId}`, {
    auth: true,
  });
}
