import { api } from "../../../services/api.js";

/**
 * Fetch aggregated statistics for the admin dashboard.
 * @param {number} rangeDays - 7 | 14 | 30 | 90 (default 14)
 * Response shape: { status, data: { summary, status_breakdown,
 *   revenue_trend, top_packages, recent_transactions, range_days } }
 */
export async function fetchDashboardStats(rangeDays = 14) {
  try {
    const data = await api.get(
      `/api/admin/dashboard-stats?range=${rangeDays}`,
      { auth: true },
    );
    return data.data || data;
  } catch (error) {
    console.error("[dashboardService] fetchDashboardStats failed:", error);
    throw error;
  }
}
