import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  fetchManualVerifications,
  approveManualPayment,
  rejectManualPayment,
  fetchOpsOverview,
} from "../services/opsService.js";
import { formatRupiah } from "../../packages/formatRupiah.js";
import { API_URL } from "../../../config/BaseUrl.js";
import { useToast } from "../ui/ToastContext.jsx";
import { useConfirm } from "../ui/ConfirmContext.jsx";

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

export default function DailyOps() {
  const toast = useToast();
  const confirm = useConfirm();

  const [verifications, setVerifications] = useState([]);
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [verifs, ops] = await Promise.all([
        fetchManualVerifications(),
        fetchOpsOverview(),
      ]);
      setVerifications(verifs);
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

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await approveManualPayment(id);
      toast.success("Booking approved and marked as settled.");
      await loadAll();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to approve booking");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    const ok = await confirm({
      title: "Reject this booking?",
      message: "Its reserved slots will be released back to the schedule.",
      confirmLabel: "Reject",
      danger: true,
    });
    if (!ok) return;

    setActioningId(id);
    try {
      await rejectManualPayment(id);
      toast.success("Booking rejected, slots released.");
      await loadAll();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to reject booking");
    } finally {
      setActioningId(null);
    }
  };

  if (status === "loading") {
    return <div className="adm-loading">Loading daily ops...</div>;
  }

  if (status === "error") {
    return <div className="adm-alert adm-alert-danger">{errorMsg}</div>;
  }

  const {
    unassigned_seats = [],
    capacity_warnings = [],
    today_tomorrow = [],
  } = overview || {};

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1>Daily Operations</h1>
          <p>
            Everything that needs a human decision today: pending payment
            verifications, unassigned seats, and capacity heads-up.
          </p>
        </div>
      </div>

      {/* ── Today / Tomorrow schedules ───────────────────────── */}
      <section className="adm-section">
        <div className="adm-section-heading">
          <h2>Today &amp; Tomorrow</h2>
        </div>
        {today_tomorrow.length === 0 ? (
          <p className="adm-empty">No schedules today or tomorrow.</p>
        ) : (
          <div className="adm-stat-grid">
            {today_tomorrow.map((s) => {
              const hasManifest = (s.manifest_pax ?? 0) > 0;
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
                        <span>🌐 Online booking</span>
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
                        <span>📋 Manifest upload</span>
                        <span>
                          <strong>{s.manifest_pax}</strong> pax,{" "}
                          <strong>{s.manifest_checked_in}</strong> check-in
                        </span>
                      </div>
                      {(s.manifest_overnight > 0 || s.manifest_daytrip > 0) && (
                        <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                          {s.manifest_overnight > 0 && (
                            <span>
                              🌙 Overnight:{" "}
                              <strong>{s.manifest_overnight}</strong>
                            </span>
                          )}
                          {s.manifest_daytrip > 0 && (
                            <span>
                              ☀️ Day trip: <strong>{s.manifest_daytrip}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Manual verification queue ────────────────────────── */}
      <section className="adm-section">
        <div className="adm-section-heading">
          <h2>Manual Payment Verification</h2>
          {verifications.length > 0 && (
            <span className="adm-count-pill">{verifications.length}</span>
          )}
        </div>

        {verifications.length === 0 ? (
          <p className="adm-empty">Nothing awaiting verification right now.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Group</th>
                  <th>Package</th>
                  <th>Departure</th>
                  <th>Pax</th>
                  <th>Amount</th>
                  <th>Slip</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => (
                  <tr key={v.id}>
                    <td>{formatDateTime(v.created_at)}</td>
                    <td>
                      <div className="adm-cell-primary">{v.group_name}</div>
                      <div className="adm-cell-muted">{v.email}</div>
                    </td>
                    <td>{v.package_name}</td>
                    <td>
                      {v.boat_departure_name || "N/A"}
                      <div className="adm-cell-muted">
                        {formatDateTime(v.date_departure)}
                      </div>
                    </td>
                    <td>{v.jml_pax}</td>
                    <td>{formatRupiah(v.amount)}</td>
                    <td>
                      {v.transfer_slip ? (
                        <a
                          href={`${API_URL}/assets_users/images/${v.transfer_slip}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="adm-cell-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button
                          className="adm-btn adm-btn-success adm-btn-sm"
                          disabled={actioningId === v.id}
                          onClick={() => handleApprove(v.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="adm-btn adm-btn-danger adm-btn-sm"
                          disabled={actioningId === v.id}
                          onClick={() => handleReject(v.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Unassigned seats ──────────────────────────────────── */}
      <section className="adm-section">
        <div className="adm-section-heading">
          <h2>Bookings Missing Seat Assignment</h2>
          {unassigned_seats.length > 0 && (
            <span className="adm-count-pill">{unassigned_seats.length}</span>
          )}
        </div>

        {unassigned_seats.length === 0 ? (
          <p className="adm-empty">
            Every settled booking has its seats assigned.
          </p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Departure</th>
                  <th>Seats Assigned</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unassigned_seats.map((b) => (
                  <tr key={b.id}>
                    <td>{b.group_name}</td>
                    <td>
                      {b.boat_departure_name || "N/A"}
                      <div className="adm-cell-muted">
                        {formatDateTime(b.date_departure)}
                      </div>
                    </td>
                    <td>
                      {b.seats_assigned}/{b.jml_pax}
                    </td>
                    <td>
                      <Link
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        to={`/admin/yacht-seat-booking?booking_id=${b.id}`}
                      >
                        Assign Seats
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
