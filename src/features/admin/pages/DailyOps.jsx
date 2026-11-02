import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchOpsOverview } from "../services/opsService.js";
import { API_URL } from "../../../config/BaseUrl.js";
import { useToast } from "../ui/ToastContext.jsx";

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(v) {
  if (!v) return "-";
  const date = new Date(v.replace(" ", "T"));
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DailyOps() {
  const toast = useToast();

  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const ops = await fetchOpsOverview();
      setOverview(ops);
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load daily ops data");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (status === "loading") {
    return <div className="adm-loading">Loading daily ops...</div>;
  }

  if (status === "error") {
    return <div className="adm-alert adm-alert-danger">{errorMsg}</div>;
  }

  const {
    capacity_warnings = [],
    today_tomorrow = [],
    manifest_uploads = [],
  } = overview || {};

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1>Daily Operations Dashboard</h1>
          <p>
            Ringkasan operasional harian: jadwal trip, manifest, crew, dan
            passenger breakdown untuk hari ini dan besok.
          </p>
        </div>
      </div>

      {/* ── Manifest Uploads Today/Tomorrow (Primary Info) ────── */}
      <section className="adm-section">
        <div className="adm-section-heading">
          <h2>Manifest Overview — Today &amp; Tomorrow</h2>
          {manifest_uploads && manifest_uploads.length > 0 && (
            <span className="adm-count-pill">{manifest_uploads.length}</span>
          )}
        </div>

        {!manifest_uploads || manifest_uploads.length === 0 ? (
          <p className="adm-empty">
            Belum ada manifest untuk hari ini atau besok.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {manifest_uploads.map((m) => {
              const isToday = m.is_today;
              const isConfirmed = m.status === "confirmed";
              const totalPax = m.total_pax || 0;
              const checkedInPax = m.checked_in_count || 0;
              const checkInPercent =
                totalPax > 0 ? Math.round((checkedInPax / totalPax) * 100) : 0;

              return (
                <div
                  key={m.id}
                  style={{
                    border: "2px solid var(--adm-border)",
                    borderRadius: 12,
                    padding: 20,
                    background: isToday
                      ? "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
                      : "white",
                  }}
                >
                  {/* Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          className={`adm-badge ${isToday ? "adm-badge-info" : "adm-badge-neutral"}`}
                          style={{ fontSize: 12 }}
                        >
                          {isToday ? "TODAY" : "TOMORROW"}
                        </span>
                        <span
                          className={`adm-badge ${
                            m.direction === "DEPARTURE"
                              ? "adm-badge-success"
                              : "adm-badge-warning"
                          }`}
                        >
                          {m.direction === "DEPARTURE" ? "DEPARTURE" : "RETURN"}
                        </span>
                        <span
                          className={`adm-badge ${
                            isConfirmed
                              ? "adm-badge-success"
                              : "adm-badge-neutral"
                          }`}
                        >
                          {isConfirmed ? "✓ Confirmed" : "Draft"}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        🚢 {m.boat_name || "N/A"}
                      </h3>
                      <div
                        style={{ fontSize: 14, color: "var(--adm-text-muted)" }}
                      >
                        📅 {fmtDate(m.trip_date)} • {m.origin || "?"} →{" "}
                        {m.destination || "?"}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {totalPax}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "var(--adm-text-muted)" }}
                      >
                        Total PAX
                      </div>
                    </div>
                  </div>

                  {/* Passenger Breakdown */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 12,
                      marginBottom: 16,
                      padding: 16,
                      background: "rgba(255,255,255,0.7)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {m.overnight_count || 0}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                      >
                        Overnight
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {m.daytrip_count || 0}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                      >
                        Day Trip
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {m.staff_count || 0}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                      >
                        Staff
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {m.foc_count || 0}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                      >
                        FOC
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {m.vendor_count || 0}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--adm-text-muted)" }}
                      >
                        Vendor
                      </div>
                    </div>
                  </div>

                  {/* Crew Info */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 10,
                      marginBottom: 16,
                      padding: 12,
                      background: "rgba(255,255,255,0.5)",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>⚓ Captain:</strong> {m.captain_name || "—"}
                    </div>
                    <div>
                      <strong>👨‍✈️ ABK:</strong>{" "}
                      {(() => {
                        try {
                          if (!m.abk_names) return "—";
                          const parsed =
                            typeof m.abk_names === "string"
                              ? JSON.parse(m.abk_names)
                              : m.abk_names;
                          return Array.isArray(parsed)
                            ? parsed.join(", ")
                            : m.abk_names;
                        } catch (e) {
                          return m.abk_names || "—";
                        }
                      })()}
                    </div>
                    <div>
                      <strong>🎯 GRO:</strong> {m.gro_name || "—"}
                    </div>
                    <div>
                      <strong>🏥 KKM:</strong> {m.kkm_name || "—"}
                    </div>
                    <div>
                      <strong>🛡️ Guard:</strong> {m.guard_name || "—"}
                    </div>
                  </div>

                  {/* Check-in Progress */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        Check-in Progress
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {checkedInPax}/{totalPax} ({checkInPercent}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 24,
                        background: "#e0e0e0",
                        borderRadius: 12,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${checkInPercent}%`,
                          height: "100%",
                          background:
                            checkInPercent === 100
                              ? "linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)"
                              : "linear-gradient(90deg, #2196f3 0%, #42a5f5 100%)",
                          transition: "width 0.3s ease",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: checkInPercent > 50 ? "white" : "#333",
                        }}
                      >
                        {checkInPercent}% Checked In
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      to={`/admin/manifest-upload?uploadId=${m.id}`}
                      className="adm-btn adm-btn-sm adm-btn-secondary"
                    >
                      📝 View Details
                    </Link>

                    {isConfirmed && (
                      <>
                        <a
                          href={`${API_URL}/api/admin/manifest/export-excel/${m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="adm-btn adm-btn-sm adm-btn-success"
                        >
                          📥 Download Excel
                        </a>
                        <Link
                          to={`/admin/check-in?upload_id=${m.id}`}
                          className="adm-btn adm-btn-sm adm-btn-info"
                        >
                          📱 Check-in
                        </Link>
                      </>
                    )}

                    {m.notes && (
                      <div
                        style={{
                          flex: "1 1 100%",
                          padding: 8,
                          background: "#fff3cd",
                          border: "1px solid #ffc107",
                          borderRadius: 6,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        <strong>📌 Notes:</strong> {m.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Schedule Overview (for schedules without manifest) ── */}
      {today_tomorrow && today_tomorrow.length > 0 && (
        <section className="adm-section">
          <div className="adm-section-heading">
            <h2>All Schedules Today &amp; Tomorrow</h2>
            <span className="adm-count-pill">{today_tomorrow.length}</span>
          </div>
          <div className="adm-stat-grid">
            {today_tomorrow.map((s) => {
              const hasManifest = (s.manifest_pax ?? 0) > 0;
              const manifestUpload = s.manifest_upload_id
                ? { id: s.manifest_upload_id, confirmed: s.manifest_confirmed }
                : null;

              return (
                <div key={s.id} className="adm-stat-card">
                  <span
                    className={`adm-badge ${
                      s.is_today ? "adm-badge-info" : "adm-badge-neutral"
                    }`}
                  >
                    {s.is_today ? "Today" : "Tomorrow"}
                  </span>
                  <div style={{ marginTop: 10, fontWeight: 700, fontSize: 15 }}>
                    {s.boat_name || "N/A"}
                  </div>
                  <div className="adm-cell-muted" style={{ marginBottom: 12 }}>
                    {s.type === "RETURN" ? "Return" : "Departure"} •{" "}
                    {formatDateTime(s.date)}
                  </div>

                  {/* Combined totals row */}
                  <div
                    style={{
                      display: "flex",
                      gap: 18,
                      marginBottom: hasManifest ? 10 : 0,
                    }}
                  >
                    <div>
                      <div className="adm-stat-value" style={{ fontSize: 18 }}>
                        {s.total_pax ?? s.booked_pax}/{s.capacity}
                      </div>
                      <div className="adm-stat-label">Total Pax</div>
                    </div>
                    <div>
                      <div className="adm-stat-value" style={{ fontSize: 18 }}>
                        {s.total_checked_in ?? s.checked_in_pax}
                      </div>
                      <div className="adm-stat-label">Checked In</div>
                    </div>
                    <div>
                      <div className="adm-stat-value" style={{ fontSize: 18 }}>
                        {s.fill_percent}%
                      </div>
                      <div className="adm-stat-label">Full</div>
                    </div>
                  </div>

                  {/* Breakdown: online vs manifest */}
                  {hasManifest && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px solid var(--adm-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--adm-text-muted)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Online booking</span>
                        <span>
                          <strong>{s.booked_pax}</strong> pax,{" "}
                          <strong>{s.checked_in_pax}</strong> check-in
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Manifest upload</span>
                        <span>
                          <strong>{s.manifest_pax}</strong> pax,{" "}
                          <strong>{s.manifest_checked_in}</strong> check-in
                        </span>
                      </div>
                      {(s.manifest_overnight > 0 || s.manifest_daytrip > 0) && (
                        <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                          {s.manifest_overnight > 0 && (
                            <span>
                              Overnight: <strong>{s.manifest_overnight}</strong>
                            </span>
                          )}
                          {s.manifest_daytrip > 0 && (
                            <span>
                              Day trip: <strong>{s.manifest_daytrip}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Download manifest button (if confirmed) */}
                      {manifestUpload && manifestUpload.confirmed && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={`${API_URL}/api/admin/manifest/export-excel/${manifestUpload.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="adm-btn adm-btn-sm adm-btn-secondary"
                            style={{
                              width: "100%",
                              textAlign: "center",
                              fontSize: 11,
                            }}
                          >
                            Download Manifest Final (Excel)
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Capacity warnings ─────────────────────────────────── */}
      <section className="adm-section">
        <div className="adm-section-heading">
          <h2>Capacity Warnings (next 14 days, ≥80% full)</h2>
          {capacity_warnings.length > 0 && (
            <span className="adm-count-pill adm-count-pill-warning">
              {capacity_warnings.length}
            </span>
          )}
        </div>

        {capacity_warnings.length === 0 ? (
          <p className="adm-empty">
            No upcoming schedule is close to full capacity.
          </p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Boat</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Booked</th>
                  <th>Fill %</th>
                </tr>
              </thead>
              <tbody>
                {capacity_warnings.map((s) => (
                  <tr key={s.id}>
                    <td>{s.boat_name || "N/A"}</td>
                    <td>{s.type === "RETURN" ? "Return" : "Departure"}</td>
                    <td>{formatDateTime(s.date)}</td>
                    <td>
                      {s.booked_pax}/{s.capacity}
                    </td>
                    <td>
                      <span
                        className={`adm-badge ${
                          s.fill_percent >= 100
                            ? "adm-badge-danger"
                            : "adm-badge-warning"
                        }`}
                      >
                        {s.fill_percent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
