import { useEffect, useState } from "react";
import { fetchDashboardStats } from "../services/dashboardService.js";
import { formatRupiah } from "../../packages/formatRupiah.js";
import "./Dashboard.css";

const RANGE_OPTIONS = [
  { label: "7 Days", value: 7 },
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

const STATUS_COLORS = {
  SETTLED: "#2fb380",
  PAID: "#2fb380",
  PENDING: "#f2a93b",
  "ON VERIFICATION": "#3b8ef2",
  EXPIRED: "#e05656",
  FAILED: "#e05656",
};

function statusColor(status) {
  return STATUS_COLORS[status] || "#9aa0a6";
}

/**
 * Lightweight SVG line chart for revenue trend — no external chart
 * library required. Draws an area + line across the given data points.
 */
function RevenueTrendChart({ data }) {
  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 56 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (d.revenue / maxRevenue) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`
      : "";

  // Show a subset of x-axis labels so they don't overlap
  const labelEvery = Math.ceil(data.length / 7) || 1;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="dash-chart-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Y-axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + innerH - t * innerH;
        return (
          <g key={t}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#eef0f2"
              strokeWidth="1"
            />
            <text x={4} y={y + 4} className="dash-chart-axis-label">
              {t === 0 ? "0" : formatCompact(maxRevenue * t)}
            </text>
          </g>
        );
      })}

      {areaPath && (
        <path d={areaPath} fill="url(#revenueGradient)" opacity="0.5" />
      )}
      {linePath && (
        <path d={linePath} fill="none" stroke="#f2881c" strokeWidth="2.5" />
      )}

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#f2881c" />
          {i % labelEvery === 0 && (
            <text
              x={p.x}
              y={height - 6}
              className="dash-chart-axis-label"
              textAnchor="middle"
            >
              {new Date(p.date).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
              })}
            </text>
          )}
        </g>
      ))}

      <defs>
        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2881c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f2881c" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return `${value}`;
}

export default function Dashboard() {
  const [rangeDays, setRangeDays] = useState(14);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    fetchDashboardStats(rangeDays)
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setErrorMsg(err.message || "Failed to load dashboard statistics");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

  const summary = stats?.summary || {};
  const manifest = stats?.manifest_summary || {};
  const totalStatusCount =
    stats?.status_breakdown?.reduce((sum, s) => sum + Number(s.count), 0) || 1;

  return (
    <div className="adm-page admin-dashboard">
      <div className="adm-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Ringkasan transaksi, pendapatan, dan status check-in.</p>
        </div>

        <div className="dash-range-toggle">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`dash-range-btn ${
                rangeDays === opt.value ? "active" : ""
              }`}
              onClick={() => setRangeDays(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {status === "loading" && (
        <div className="adm-loading">Loading dashboard...</div>
      )}

      {status === "error" && (
        <div className="adm-alert adm-alert-danger">
          {errorMsg || "Failed to load dashboard statistics"}
        </div>
      )}

      {status === "ready" && stats && (
        <>
          {/* Summary cards — online bookings */}
          <section className="dash-summary-grid">
            <div className="dash-card">
              <span className="dash-card-label">Total Revenue</span>
              <span className="dash-card-value">
                {formatRupiah(summary.total_revenue)}
              </span>
              <span className="dash-card-sub">Paid &amp; Settled</span>
            </div>

            <div className="dash-card">
              <span className="dash-card-label">Total Transactions</span>
              <span className="dash-card-value">
                {summary.total_transactions ?? 0}
              </span>
              <span className="dash-card-sub">All statuses</span>
            </div>

            <div className="dash-card">
              <span className="dash-card-label">Online Passengers</span>
              <span className="dash-card-value">
                {summary.total_passengers ?? 0}
              </span>
              <span className="dash-card-sub">Paid &amp; Settled pax</span>
            </div>

            <div className="dash-card dash-card-accent">
              <span className="dash-card-label">Online Check-in</span>
              <span className="dash-card-value">
                {summary.total_checked_in ?? 0}
              </span>
              <span className="dash-card-sub">Scanned at boarding</span>
            </div>
          </section>

          {/* Manifest upload summary */}
          {manifest.upload_count > 0 && (
            <section className="adm-section">
              <div className="adm-section-heading">
                <h2>Manifest Upload Summary</h2>
                <span className="adm-badge adm-badge-neutral">
                  {manifest.upload_count} uploads
                </span>
              </div>
              <div className="dash-summary-grid">
                <div className="dash-card">
                  <span className="dash-card-label">Total Manifest Pax</span>
                  <span className="dash-card-value">
                    {manifest.total_pax ?? 0}
                  </span>
                  <span className="dash-card-sub">
                    {manifest.range_pax ?? 0} dalam {stats.range_days} hari
                    terakhir
                  </span>
                </div>
                <div className="dash-card dash-card-accent">
                  <span className="dash-card-label">Manifest Check-in</span>
                  <span className="dash-card-value">
                    {manifest.checked_in ?? 0}
                  </span>
                  <span className="dash-card-sub">
                    {manifest.range_checked_in ?? 0} dalam {stats.range_days}{" "}
                    hari terakhir
                  </span>
                </div>
                <div className="dash-card">
                  <span className="dash-card-label">Overnight</span>
                  <span className="dash-card-value">
                    {manifest.overnight ?? 0}
                  </span>
                  <span className="dash-card-sub">
                    {manifest.range_overnight ?? 0} dalam {stats.range_days}{" "}
                    hari terakhir
                  </span>
                </div>
                <div className="dash-card">
                  <span className="dash-card-label">Day Trip</span>
                  <span className="dash-card-value">
                    {manifest.daytrip ?? 0}
                  </span>
                  <span className="dash-card-sub">
                    {manifest.range_daytrip ?? 0} dalam {stats.range_days} hari
                    terakhir
                  </span>
                </div>
                {manifest.staff > 0 && (
                  <div className="dash-card">
                    <span className="dash-card-label">Staff</span>
                    <span className="dash-card-value">{manifest.staff}</span>
                    <span className="dash-card-sub">Non-paying</span>
                  </div>
                )}
                {manifest.foc > 0 && (
                  <div className="dash-card">
                    <span className="dash-card-label">FOC</span>
                    <span className="dash-card-value">{manifest.foc}</span>
                    <span className="dash-card-sub">Free of charge</span>
                  </div>
                )}
                {manifest.vendor > 0 && (
                  <div className="dash-card">
                    <span className="dash-card-label">Vendor</span>
                    <span className="dash-card-value">{manifest.vendor}</span>
                    <span className="dash-card-sub">Vendor pax</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="dash-main-grid">
            {/* Revenue trend chart */}
            <section className="dash-panel dash-panel-wide">
              <h2>Revenue Trend</h2>
              {stats.revenue_trend?.length > 0 ? (
                <RevenueTrendChart data={stats.revenue_trend} />
              ) : (
                <p className="empty-state">No revenue data yet</p>
              )}
            </section>

            {/* Status breakdown */}
            <section className="dash-panel">
              <h2>Booking Status</h2>
              <div className="dash-status-list">
                {stats.status_breakdown?.map((s) => {
                  const pct = Math.round(
                    (Number(s.count) / totalStatusCount) * 100,
                  );
                  return (
                    <div className="dash-status-row" key={s.status}>
                      <div className="dash-status-label">
                        <span
                          className="dash-status-dot"
                          style={{ background: statusColor(s.status) }}
                        />
                        {s.status || "UNKNOWN"}
                      </div>
                      <div className="dash-status-bar-track">
                        <div
                          className="dash-status-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: statusColor(s.status),
                          }}
                        />
                      </div>
                      <div className="dash-status-count">
                        {s.count} ({pct}%)
                      </div>
                    </div>
                  );
                })}
                {(!stats.status_breakdown ||
                  stats.status_breakdown.length === 0) && (
                  <p className="empty-state">No bookings yet</p>
                )}
              </div>
            </section>
          </div>

          <div className="dash-main-grid">
            {/* Top packages */}
            <section className="dash-panel">
              <h2>Top Packages</h2>
              {stats.top_packages?.length > 0 ? (
                <div className="dash-top-packages">
                  {stats.top_packages.map((p, i) => (
                    <div className="dash-package-row" key={i}>
                      <div className="dash-package-rank">{i + 1}</div>
                      <div className="dash-package-info">
                        <div className="dash-package-name">
                          {p.package_name || "N/A"}
                        </div>
                        <div className="dash-package-meta">
                          {p.bookings} bookings
                        </div>
                      </div>
                      <div className="dash-package-revenue">
                        {formatRupiah(p.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No package data yet</p>
              )}
            </section>

            {/* Recent transactions */}
            <section className="dash-panel dash-panel-wide">
              <h2>Recent Transactions</h2>
              {stats.recent_transactions?.length > 0 ? (
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Passenger</th>
                        <th>Package</th>
                        <th>Pax</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Check-in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_transactions.map((t) => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td>{t.user_name || "-"}</td>
                          <td>{t.package_name || "-"}</td>
                          <td>{t.jml_pax}</td>
                          <td>{formatRupiah(t.amount)}</td>
                          <td>
                            <span
                              className="dash-status-badge"
                              style={{
                                background: `${statusColor(t.status)}22`,
                                color: statusColor(t.status),
                              }}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td>
                            {t.attendance ? (
                              <span className="dash-checked">✓</span>
                            ) : (
                              <span className="dash-not-checked">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No transactions yet</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
