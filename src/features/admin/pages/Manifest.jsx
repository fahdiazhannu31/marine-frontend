import { useEffect, useState } from "react";
import { fetchAllSchedules, fetchManifest } from "../services/manifestService.js";

function formatScheduleLabel(s) {
  const date = s.date
    ? new Date(s.date).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";
  const typeLabel = s.type === "RETURN" ? "Return" : "Departure";
  return `${typeLabel} — ${s.boat_name || "N/A"} — ${date}`;
}

function downloadCsv(schedule, passengers) {
  const header = [
    "No",
    "Group",
    "Nama Penumpang",
    "NIK",
    "Kursi",
    "Trip Type",
    "Check-in",
  ];

  const rows = passengers.map((p, i) => [
    i + 1,
    p.group_name || "",
    p.name || "",
    p.nik || "",
    p.seat_number || "",
    p.trip_type || "",
    p.checked_in ? "Sudah" : "Belum",
  ]);

  const csvLines = [header, ...rows].map((row) =>
    row
      .map((cell) => {
        const value = String(cell ?? "");
        return /[",\n]/.test(value)
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(","),
  );

  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `manifest-schedule-${schedule.id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Manifest() {
  const [schedules, setSchedules] = useState([]);
  const [scheduleId, setScheduleId] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchAllSchedules()
      .then((data) => {
        setSchedules(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load schedules");
        setStatus("error");
      });
  }, []);

  const handleScheduleChange = async (id) => {
    setScheduleId(id);
    setSchedule(null);
    setPassengers([]);
    setErrorMsg("");

    if (!id) return;

    setLoadingManifest(true);
    try {
      const res = await fetchManifest(id);
      setSchedule(res.schedule);
      setPassengers(res.passengers || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load manifest for this schedule");
    } finally {
      setLoadingManifest(false);
    }
  };

  const checkedInCount = passengers.filter((p) => p.checked_in).length;

  return (
    <div className="adm-page adm-print-page">
      <div className="adm-page-header adm-print-hide">
        <div>
          <h1>Passenger Manifest</h1>
          <p>
            Full passenger list (name, NIK, seat) for a given departure or
            return schedule.
          </p>
        </div>
      </div>

      {status === "error" && (
        <div className="adm-alert adm-alert-danger">
          {errorMsg || "Failed to load schedules"}
        </div>
      )}

      {status === "loading" && (
        <div className="adm-loading">Loading schedules...</div>
      )}

      {status === "ready" && (
        <div>
          <div className="adm-manifest-toolbar adm-print-hide">
            <div className="adm-field" style={{ minWidth: 320, marginBottom: 0 }}>
              <label htmlFor="schedule">Schedule</label>
              <select
                id="schedule"
                value={scheduleId}
                onChange={(e) => handleScheduleChange(e.target.value)}
              >
                <option value="">Select a schedule…</option>
                {schedules.map((s) => (
                  <option key={`${s.type}-${s.id}`} value={s.id}>
                    {formatScheduleLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            {schedule && passengers.length > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="adm-btn adm-btn-secondary"
                  onClick={() => window.print()}
                >
                  🖨️ Print
                </button>
                <button
                  className="adm-btn adm-btn-secondary"
                  onClick={() => downloadCsv(schedule, passengers)}
                >
                  ⬇️ Export CSV
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="adm-alert adm-alert-danger">{errorMsg}</div>
          )}

          {loadingManifest && (
            <div className="adm-loading">Loading manifest...</div>
          )}

          {schedule && !loadingManifest && (
            <div className="adm-card" style={{ marginTop: 20 }}>
              <h2 style={{ marginBottom: 4 }}>{formatScheduleLabel(schedule)}</h2>
              <p className="adm-cell-muted" style={{ marginBottom: 20 }}>
                {passengers.length} passenger
                {passengers.length === 1 ? "" : "s"} • Capacity{" "}
                {schedule.total_pax} • Checked in {checkedInCount}/
                {passengers.length}
              </p>

              {passengers.length === 0 ? (
                <p className="adm-empty">
                  No settled bookings found for this schedule yet.
                </p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Group</th>
                        <th>Nama Penumpang</th>
                        <th>NIK</th>
                        <th>Kursi</th>
                        <th>Trip</th>
                        <th>Check-in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((p, i) => (
                        <tr key={`${p.payment_id}-${i}`}>
                          <td>{i + 1}</td>
                          <td>{p.group_name}</td>
                          <td>{p.name}</td>
                          <td>{p.nik || "-"}</td>
                          <td>{p.seat_number || "-"}</td>
                          <td>
                            {p.trip_type === "round_trip"
                              ? "Round Trip"
                              : "One Way"}
                          </td>
                          <td>
                            <span
                              className={`adm-badge ${
                                p.checked_in
                                  ? "adm-badge-success"
                                  : "adm-badge-warning"
                              }`}
                            >
                              {p.checked_in ? "Sudah" : "Belum"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
