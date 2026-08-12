import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchSchedulesForManifest,
  fetchUploads,
  fetchUploadDetail,
  uploadManifestFile,
  confirmUpload,
  deleteUpload,
  addBaggage,
  updateBaggage,
  deleteBaggage,
  markBaggagePrinted,
  fetchBoatsWithCrew,
  updateBoatCrew,
  updateTicket,
  fetchAvailableSeats,
} from "../services/manifestUploadService.js";
import { useToast } from "../ui/ToastContext.jsx";
import { useConfirm } from "../ui/ConfirmContext.jsx";
import GuestTagPrint from "./GuestTagPrint.jsx";
import { API_URL } from "../../../config/BaseUrl.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scheduleLabel(s) {
  const d = fmtDate(s.date);
  const t = s.type === "RETURN" ? "Return" : "Departure";
  return `${t} — ${s.boat_name || "?"} — ${d}`;
}

const TABS = ["Upload", "Tickets", "Baggage", "Boats"];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: TicketEditModal — FIXED VERSION
// ─────────────────────────────────────────────────────────────────────────────
function TicketEditModal({ ticket, availableSeats, onSave, onClose, onRefresh }) {
  const toast = useToast();
  const [form, setForm] = useState({
    seat_id: ticket.seat_id ? String(ticket.seat_id) : "",
    seat_number: ticket.seat_number || "",
    passenger_name: ticket.passenger_name || "",
    cancelled: ticket.cancelled ? 1 : 0,
    notes: ticket.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTicket(ticket.id, {
        seat_id: form.seat_id ? parseInt(form.seat_id) : null,
        seat_number: form.seat_number,
        passenger_name: form.passenger_name,
        cancelled: parseInt(form.cancelled),
        notes: form.notes,
      });
      toast.success("Ticket updated.");
      onSave();
      onRefresh();
    } catch (e) {
      toast.error(e.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="adm-card"
        style={{
          maxWidth: 500,
          width: "90vw",
          maxHeight: "80vh",
          overflow: "auto",
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Ticket #{ticket.id}</h3>
        <p style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
          Seq: {ticket.seq_no} • {ticket.passenger_name}
        </p>

        <div className="adm-form" style={{ marginTop: 20 }}>
          {/* Passenger name */}
          <div className="adm-field">
            <label>Nama Penumpang</label>
            <input
              value={form.passenger_name}
              onChange={(e) => set("passenger_name", e.target.value)}
              placeholder="Nama penumpang"
            />
          </div>

          {/* Seat selection */}
          <div className="adm-field">
            <label>Kursi</label>
            <select
              value={form.seat_id}
              onChange={(e) => {
                const seatId = e.target.value;
                const seat = availableSeats.find((s) => s.id === parseInt(seatId));
                set("seat_id", seatId);
                if (seat) set("seat_number", seat.seat_number);
              }}
            >
              <option value="">— Tidak ada kursi (unassigned) —</option>
              {availableSeats.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  disabled={s.status === "booked" && s.id !== ticket.seat_id}
                >
                  {s.seat_number} {s.status === "booked" ? "(booked)" : ""}
                </option>
              ))}
            </select>
            {form.seat_number && (
              <p className="adm-field-hint">Kursi: {form.seat_number}</p>
            )}
          </div>

          {/* Cancel toggle */}
          <div className="adm-field">
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.cancelled === 1}
                onChange={(e) => set("cancelled", e.target.checked ? 1 : 0)}
              />
              <span>Cancelled (tidak naik)</span>
            </label>
            {form.cancelled === 1 && (
              <p
                style={{
                  fontSize: 12,
                  color: "#d32f2f",
                  marginTop: 6,
                  background: "#ffebee",
                  padding: "8px 12px",
                  borderRadius: "var(--adm-radius-sm)",
                }}
              >
                ⚠️ Penumpang ini akan ditandai sebagai cancelled dan tidak
                akan masuk manifest final.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="adm-field">
            <label>Catatan</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Catatan opsional"
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Buttons */}
          <div className="adm-form-actions" style={{ marginTop: 20 }}>
            <button className="adm-btn adm-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="adm-btn adm-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: SeatMap
// ─────────────────────────────────────────────────────────────────────────────
function SeatMap({ tickets }) {
  if (!tickets || tickets.length === 0) return null;

  const byRow = {};
  tickets.forEach((t) => {
    if (!t.seat_number) return;
    const row = t.seat_number.replace(/[A-Za-z]+$/, "") || "?";
    if (!byRow[row]) byRow[row] = [];
    byRow[row].push(t);
  });

  const rows = Object.keys(byRow).sort((a, b) => Number(a) - Number(b));
  if (rows.length === 0) return null;

  const groups = [...new Set(tickets.map((t) => t.group_name).filter(Boolean))];
  const palette = [
    "#e3f0ff", "#fef3c7", "#dcfce7", "#fce7f3", "#ede9fe",
    "#ffedd5", "#cffafe", "#f0fdf4", "#fdf4ff", "#ecfdf5",
  ];
  const groupColor = {};
  groups.forEach((g, i) => {
    groupColor[g] = palette[i % palette.length];
  });

  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontSize: 12, color: "var(--adm-text-muted)", marginBottom: 8 }}>
        Seat map — coloured by group. Unassigned passengers not shown.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((row) => (
          <div key={row} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 28, fontSize: 11, color: "var(--adm-text-faint)", textAlign: "right", flexShrink: 0 }}>
              {row}
            </span>
            {byRow[row].map((t) => (
              <div
                key={t.id}
                title={`${t.passenger_name} (${t.group_name || "solo"})`}
                style={{
                  width: 36, height: 36, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, cursor: "default",
                  background: groupColor[t.group_name] || "#f4f5f7",
                  border: "1px solid rgba(0,0,0,.12)", color: "var(--adm-text)",
                }}
              >
                {t.seat_number}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {groups.slice(0, 12).map((g) => (
          <div key={g} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: groupColor[g], border: "1px solid rgba(0,0,0,.1)" }} />
            <span style={{ color: "var(--adm-text-muted)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {g}
            </span>
          </div>
        ))}
        {groups.length > 12 && (
          <span style={{ fontSize: 11, color: "var(--adm-text-faint)" }}>
            +{groups.length - 12} more
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: TicketsPanel — FIXED VERSION
// ─────────────────────────────────────────────────────────────────────────────
function TicketsPanel({ tickets, upload, onRefresh }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingTicket, setEditingTicket] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const openEditModal = async (ticket) => {
    setEditingTicket(ticket);
    setLoadingSeats(true);
    try {
      const data = await fetchAvailableSeats(upload.id);
      setAvailableSeats(data.seats || []);
    } catch (e) {
      toast.error("Failed to load available seats: " + e.message);
    } finally {
      setLoadingSeats(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (t.passenger_name || "").toLowerCase().includes(q) ||
      (t.group_name || "").toLowerCase().includes(q) ||
      (t.id_passport || "").toLowerCase().includes(q) ||
      (t.seat_number || "").toLowerCase().includes(q);

    const matchFilter =
      filter === "all"
        ? true
        : filter === "cancelled"
          ? t.cancelled === 1
          : filter === "overnight"
            ? (t.ket || "").toUpperCase().includes("OVERNIGHT")
            : filter === "daytrip"
              ? (t.ket || "").toUpperCase().includes("DAY")
              : filter === "unassigned"
                ? !t.seat_number && t.cancelled !== 1
                : true;
    return matchSearch && matchFilter;
  });

  const bpBase = `${API_URL}/api/admin/manifest/boarding-pass/${upload?.id}`;
  const printAll = () => window.open(bpBase, "_blank");
  const printOne = (ticketId) => window.open(`${bpBase}?ticket_ids=${ticketId}`, "_blank");
  const printFiltered = () => {
    const ids = filtered.map((t) => t.id).join(",");
    window.open(`${bpBase}?ticket_ids=${ids}`, "_blank");
  };

  const cancelledCount = tickets.filter((t) => t.cancelled === 1).length;

  return (
    <div>
      {/* Stats */}
      <div className="adm-stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total Pax", value: tickets.length },
          { label: "Seat Assigned", value: tickets.filter((t) => t.seat_number && !t.cancelled).length },
          { label: "Unassigned", value: tickets.filter((t) => !t.seat_number && !t.cancelled).length },
          { label: "Cancelled", value: cancelledCount, badge: "danger" },
          { label: "Groups", value: new Set(tickets.map((t) => t.group_name).filter(Boolean)).size },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value" style={{ fontSize: 22, color: s.badge === "danger" ? "#d32f2f" : undefined }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Seat map */}
      <SeatMap tickets={tickets.filter((t) => !t.cancelled)} />

      {/* Print toolbar */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0 0", padding: "12px 16px", background: "var(--adm-bg)", border: "1px solid var(--adm-border)", borderRadius: "var(--adm-radius-sm)", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--adm-text-muted)", marginRight: 4 }}>🖨️ Print Boarding Pass:</span>
        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={printAll}>All ({tickets.length} pax)</button>
        {filtered.length !== tickets.length && filtered.length > 0 && (
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={printFiltered}>Filtered ({filtered.length} pax)</button>
        )}
        <span style={{ fontSize: 11, color: "var(--adm-text-faint)", marginLeft: 4 }}>— or click 🖨️ on any row to print one passenger</span>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "20px 0 12px", alignItems: "center" }}>
        <input
          className="adm-field input"
          style={{ padding: "7px 11px", border: "1px solid var(--adm-border-strong)", borderRadius: "var(--adm-radius-sm)", fontSize: 13, minWidth: 200 }}
          placeholder="Search name, NIK, seat…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["all", "unassigned", "cancelled", "overnight", "daytrip"].map((f) => (
          <button
            key={f}
            className={`adm-btn adm-btn-sm ${filter === f ? "adm-btn-primary" : "adm-btn-secondary"}`}
            onClick={() => setFilter(f)}
          >
            {f === "unassigned" ? "Unassigned" : f === "cancelled" ? "❌ Cancelled" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--adm-text-faint)" }}>{filtered.length} rows</span>
      </div>

      {/* Table */}
      <div className="adm-table-wrap" style={{ marginTop: 16 }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ket</th>
              <th>Nama Penumpang</th>
              <th>Grup</th>
              <th>NIK / Passport</th>
              <th>Kursi</th>
              <th>Status</th>
              <th>Package</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} style={{ opacity: t.cancelled ? 0.6 : 1, textDecoration: t.cancelled ? "line-through" : "none" }}>
                <td style={{ color: "var(--adm-text-faint)" }}>{t.seq_no}</td>
                <td>
                  <span className={`adm-badge ${(t.ket || "").toUpperCase().includes("OVERNIGHT") ? "adm-badge-info" : "adm-badge-neutral"}`}>
                    {t.ket || "—"}
                  </span>
                </td>
                <td className="adm-cell-primary" style={{ whiteSpace: "normal", minWidth: 160 }}>
                  {t.passenger_name}
                </td>
                <td style={{ color: "var(--adm-text-muted)", whiteSpace: "normal", maxWidth: 140 }}>
                  {t.group_name || "—"}
                </td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {t.id_passport || "—"}
                </td>
                <td>
                  {t.cancelled ? (
                    <span className="adm-badge" style={{ background: "#ffebee", color: "#d32f2f" }}>Cancelled</span>
                  ) : t.seat_number ? (
                    <span className="adm-badge adm-badge-success">{t.seat_number}</span>
                  ) : (
                    <span className="adm-badge adm-badge-warning">Unassigned</span>
                  )}
                </td>
                <td>
                  <span className={`adm-badge ${t.checked_in ? "adm-badge-success" : "adm-badge-neutral"}`}>
                    {t.checked_in ? "✓ Checked In" : "Pending"}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
                  {t.package || "—"}
                </td>
                <td>
                  <div className="adm-row-actions" style={{ display: "flex", gap: 6 }}>
                    <button className="adm-btn adm-btn-secondary adm-btn-sm" title="Edit ticket" onClick={() => openEditModal(t)}>
                      ✏️
                    </button>
                    <button className="adm-btn adm-btn-secondary adm-btn-sm" title={`Print boarding pass for ${t.passenger_name}`} onClick={() => printOne(t.id)}>
                      🖨️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editingTicket && (
        <TicketEditModal
          ticket={editingTicket}
          availableSeats={availableSeats}
          onSave={() => setEditingTicket(null)}
          onClose={() => setEditingTicket(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REST OF COMPONENTS (BaggagePanel, UploadForm, UploadList, BoatCrewPanel, etc.)
// Copy from original file...
// ─────────────────────────────────────────────────────────────────────────────

export default function ManifestUpload() {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("Upload");
  const [schedules, setSchedules] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading");

  const loadInitial = useCallback(async () => {
    try {
      const [scheds, ups] = await Promise.all([
        fetchSchedulesForManifest(),
        fetchUploads(),
      ]);
      setSchedules(scheds);
      setUploads(ups);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadDetail = useCallback(
    async (id) => {
      if (!id) {
        setDetail(null);
        setSelectedId(null);
        return;
      }
      try {
        const d = await fetchUploadDetail(id);
        setDetail(d);
        setSelectedId(id);
      } catch (e) {
        toast.error("Failed to load upload detail.");
      }
    },
    [toast],
  );

  const handleSelect = (id) => {
    if (id === selectedId) {
      setSelectedId(null);
      setDetail(null);
    } else {
      loadDetail(id);
      setTab("Tickets");
    }
  };

  const handleUploadSuccess = async (uploadId) => {
    const ups = await fetchUploads().catch(() => uploads);
    setUploads(ups);
    loadDetail(uploadId);
    setTab("Tickets");
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete this manifest?",
      message: "All tickets and baggage records for this upload will be removed.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteUpload(id);
      toast.success("Manifest deleted.");
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
      const ups = await fetchUploads().catch(() => uploads.filter((u) => u.id !== id));
      setUploads(ups);
    } catch (e) {
      toast.error(e.message || "Delete failed.");
    }
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    try {
      await confirmUpload(selectedId);
      toast.success("Manifest confirmed.");
      loadDetail(selectedId);
      const ups = await fetchUploads();
      setUploads(ups);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const refreshDetail = () => {
    if (selectedId) loadDetail(selectedId);
  };

  if (status === "loading") return <div className="adm-loading">Loading…</div>;
  if (status === "error") return <div className="adm-alert adm-alert-danger">Failed to load manifest data.</div>;

  const currentUpload = detail?.upload || null;
  const currentTickets = detail?.tickets || [];
  const currentBaggage = detail?.baggage || [];

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1>Manifest Upload</h1>
          <p>Upload Excel manifest, kursi di-assign otomatis per grup (anggota grup duduk berdekatan), lalu kelola bagasi dan cetak guest tag.</p>
        </div>
        {currentUpload && currentUpload.status === "draft" && (
          <div className="adm-page-header-actions">
            <button className="adm-btn adm-btn-success" onClick={handleConfirm}>
              ✓ Confirm Manifest #{selectedId}
            </button>
          </div>
        )}
      </div>

      <div className="adm-tabs">
        {TABS.map((t) => (
          <button key={t} className={`adm-tab ${tab === t ? "adm-tab-active" : ""}`} onClick={() => setTab(t)}>
            {t}
            {t === "Tickets" && currentTickets.length > 0 && <span className="adm-count-pill" style={{ marginLeft: 6 }}>{currentTickets.length}</span>}
            {t === "Baggage" && currentBaggage.length > 0 && <span className="adm-count-pill" style={{ marginLeft: 6 }}>{currentBaggage.length}</span>}
          </button>
        ))}
      </div>

      {tab === "Tickets" && (
        <>
          {!selectedId ? (
            <div className="adm-alert adm-alert-info">Select a manifest from the Upload tab to view its tickets.</div>
          ) : !detail ? (
            <div className="adm-loading">Loading tickets…</div>
          ) : (
            <>
              <div className="adm-card" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div>
                    <div className="adm-stat-label">Boat</div>
                    <div style={{ fontWeight: 700 }}>{currentUpload.boat_name}</div>
                  </div>
                  <div>
                    <div className="adm-stat-label">Kapten</div>
                    <div>{currentUpload.captain_name || "—"}</div>
                  </div>
                  <div>
                    <div className="adm-stat-label">Direction</div>
                    <div>{currentUpload.direction}</div>
                  </div>
                  <div>
                    <div className="adm-stat-label">Date</div>
                    <div>{fmtDate(currentUpload.trip_date)}</div>
                  </div>
                  <div>
                    <div className="adm-stat-label">Status</div>
                    <span className={`adm-badge ${currentUpload.status === "confirmed" ? "adm-badge-success" : "adm-badge-warning"}`}>
                      {currentUpload.status}
                    </span>
                  </div>
                </div>
              </div>
              <TicketsPanel tickets={currentTickets} upload={currentUpload} onRefresh={refreshDetail} />
            </>
          )}
        </>
      )}
    </div>
  );
}
