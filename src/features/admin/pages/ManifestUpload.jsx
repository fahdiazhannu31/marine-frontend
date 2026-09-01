import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchSchedulesForManifest,
  fetchUploads,
  fetchUploadDetail,
  uploadManifestFile,
  confirmUpload,
  forceAssignSeats,
  deleteUpload,
  addBaggage,
  updateBaggage,
  deleteBaggage,
  markBaggagePrinted,
  fetchBoatsWithCrew,
  updateBoatCrew,
  updateTicket,
  fetchAvailableSeats,
  fetchCrewCheckins,
  switchSeats,
  sendGroupQrEmails,
  fetchGroupQrCodes,
} from "../services/manifestUploadService.js";
import { useToast } from "../ui/ToastContext.jsx";
import { useConfirm } from "../ui/ConfirmContext.jsx";
import YachtSeatMap from "../components/YachtSeatMap.jsx";
import { API_URL } from "../../../config/BaseUrl.js";
import {
  Printer,
  Pencil,
  Tag,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Moon,
  Sun,
  Users,
  Ticket,
  Store,
  Search,
  Wrench,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Anchor,
} from "lucide-react";

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

// ── SeatMap with Group Highlight ─────────────────────────────────────────────
// Using YachtSeatMap component for proper boat layouts including MOLA-MOLA
function SeatMap({ tickets, upload, highlightedGroup, onClearHighlight }) {
  if (!tickets || tickets.length === 0) return null;

  // Build seats array with booking status from tickets
  const seatMap = {};
  tickets.forEach((t) => {
    if (!t.seat_number || !t.seat_id) return;
    seatMap[t.seat_id] = {
      id: t.seat_id,
      seat_number: t.seat_number,
      passenger_name: t.passenger_name,
      group_name: t.group_name,
    };
  });

  const seats = Object.values(seatMap);
  const bookedSeats = tickets
    .filter((t) => t.seat_id)
    .map((t) => ({
      seat_id: t.seat_id,
      payment_id: upload?.id || null,
    }));

  // Get seats for highlighted group
  const highlightedSeats = highlightedGroup
    ? tickets
        .filter((t) => t.group_name === highlightedGroup && t.seat_id)
        .map((t) => t.seat_id)
    : [];

  // Get group info for popup
  const groupTickets = highlightedGroup
    ? tickets.filter((t) => t.group_name === highlightedGroup)
    : [];

  return (
    <div style={{ marginTop: 20, position: "relative" }}>
      {/* Group Highlight Popup */}
      {highlightedGroup && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            marginBottom: 16,
            animation: "slideDown 0.3s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>👥</span>
                <span>{highlightedGroup}</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.9,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <strong>{groupTickets.length}</strong> passengers
                </div>
                <div>•</div>
                <div>
                  <strong>
                    {groupTickets.filter((t) => t.seat_id).length}
                  </strong>{" "}
                  seats assigned
                </div>
                <div>•</div>
                <div>
                  Seats:{" "}
                  <strong>
                    {groupTickets
                      .filter((t) => t.seat_number)
                      .map((t) => t.seat_number)
                      .join(", ") || "None"}
                  </strong>
                </div>
              </div>
            </div>
            <button
              onClick={onClearHighlight}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      <p
        style={{
          fontSize: 12,
          color: "var(--adm-text-muted)",
          marginBottom: 8,
          marginTop: highlightedGroup ? 90 : 0,
        }}
      >
        Seat map layout for {upload?.boat_name || "this boat"}
        {highlightedGroup && (
          <span
            style={{
              marginLeft: 8,
              color: "#667eea",
              fontWeight: 600,
            }}
          >
            — Highlighting: {highlightedGroup}
          </span>
        )}
      </p>
      <YachtSeatMap
        seats={seats}
        selectedSeats={highlightedSeats}
        onSeatToggle={() => {}}
        maxSeats={null}
        paymentId={upload?.id || null}
        bookedSeats={bookedSeats}
        isLocked={true}
        boatId={upload?.boat_id || null}
        highlightMode={!!highlightedGroup}
      />
    </div>
  );
}

// ── TicketEditModal ───────────────────────────────────────────────────────────
function TicketEditModal({
  ticket,
  availableSeats,
  onSave,
  onClose,
  onRefresh,
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    seat_id: ticket.seat_id ? String(ticket.seat_id) : "",
    seat_number: ticket.seat_number || "",
    passenger_name: ticket.passenger_name || "",
    cancelled: parseInt(ticket.cancelled) === 1 ? 1 : 0,
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
      onClick={onClose}
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
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="adm-card"
        style={{
          maxWidth: 500,
          width: "90vw",
          maxHeight: "80vh",
          overflow: "auto",
          padding: 24,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Edit Ticket #{ticket.id}</h3>
        <p style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
          Seq: {ticket.seq_no} • {ticket.passenger_name}
          {availableSeats.length > 0 && (
            <span style={{ marginLeft: 8, color: "green" }}>
              • {availableSeats.length} seats available
            </span>
          )}
          {availableSeats.length === 0 && (
            <span style={{ marginLeft: 8, color: "red" }}>
              • No seats found!
            </span>
          )}
        </p>
        <div className="adm-form" style={{ marginTop: 16 }}>
          <div className="adm-field">
            <label>Nama Penumpang</label>
            <input
              value={form.passenger_name}
              onChange={(e) => set("passenger_name", e.target.value)}
            />
          </div>
          <div className="adm-field">
            <label>Kursi</label>
            <select
              value={form.seat_id}
              onChange={(e) => {
                const id = e.target.value;
                const seat = availableSeats.find((s) => String(s.id) === id);
                set("seat_id", id);
                if (seat) set("seat_number", seat.seat_number);
              }}
            >
              <option value="">— Unassigned —</option>
              {availableSeats.length === 0 && (
                <option disabled>Loading seats...</option>
              )}
              {availableSeats.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  disabled={s.status === "booked" && s.id !== ticket.seat_id}
                >
                  {s.seat_number}
                  {s.status === "booked" && s.id === ticket.seat_id
                    ? " (current)"
                    : s.status === "booked"
                      ? " (booked)"
                      : " (available)"}
                </option>
              ))}
            </select>
            {form.seat_number && (
              <p className="adm-field-hint">
                Kursi terpilih: {form.seat_number}
              </p>
            )}
            {availableSeats.length === 0 && (
              <p
                className="adm-field-hint"
                style={{ color: "#d32f2f", marginTop: 6 }}
              >
                ⚠️ No seats available. Check browser console for errors.
              </p>
            )}
          </div>
          <div className="adm-field">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
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
                  borderRadius: 6,
                }}
              >
                ⚠️ Penumpang ini tidak akan masuk manifest final.
              </p>
            )}
          </div>
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
          <div className="adm-form-actions" style={{ marginTop: 16 }}>
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

// ── SwitchSeatModal ───────────────────────────────────────────────────────────
// Let admin pick another ticket and swap their seats
function SwitchSeatModal({ ticket, tickets, onClose, onSuccess }) {
  const toast = useToast();
  const [targetId, setTargetId] = useState("");
  const [saving, setSaving] = useState(false);

  const others = tickets.filter(
    (t) => t.id !== ticket.id && parseInt(t.cancelled) !== 1 && t.seat_number, // only tickets that have a seat
  );

  const target = others.find((t) => String(t.id) === String(targetId));

  const handleSwitch = async () => {
    if (!targetId) {
      toast.error("Pilih penumpang tujuan.");
      return;
    }
    setSaving(true);
    try {
      const res = await switchSeats(ticket.id, parseInt(targetId));
      toast.success(
        `✓ Kursi ditukar: ${res.ticket_a.name} → ${res.ticket_a.new_seat} | ${res.ticket_b.name} → ${res.ticket_b.new_seat}`,
      );
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e.message || "Gagal menukar kursi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="adm-card"
        style={{ maxWidth: 480, width: "90vw", padding: 24 }}
      >
        <h3 style={{ marginTop: 0 }}>
          <ArrowLeftRight
            size={16}
            style={{ verticalAlign: "middle", marginRight: 8 }}
          />
          Switch Seat
        </h3>

        {/* Current ticket */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            background: "var(--adm-bg)",
            border: "1px solid var(--adm-border)",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {ticket.passenger_name}
          </div>
          <div style={{ color: "var(--adm-text-muted)" }}>
            Kursi saat ini:{" "}
            <strong style={{ color: "var(--adm-accent)" }}>
              {ticket.seat_number || "Unassigned"}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "4px 0 16px",
            color: "var(--adm-text-faint)",
          }}
        >
          <ArrowLeftRight size={18} />
        </div>

        {/* Target selector */}
        <div className="adm-field">
          <label>Tukar dengan penumpang:</label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">— Pilih penumpang —</option>
            {others.map((t) => (
              <option key={t.id} value={t.id}>
                {t.seat_number} — {t.passenger_name}
                {t.group_name && t.group_name !== t.passenger_name
                  ? ` (${t.group_name})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {target && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              marginTop: 8,
              background: "#e8f5e9",
              border: "1px solid #a5d6a7",
              fontSize: 13,
            }}
          >
            <strong>{ticket.passenger_name}</strong> ← {target.seat_number}
            {" | "}
            <strong>{target.passenger_name}</strong> ← {ticket.seat_number}
          </div>
        )}

        <div className="adm-form-actions" style={{ marginTop: 20 }}>
          <button className="adm-btn adm-btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            className="adm-btn adm-btn-primary"
            onClick={handleSwitch}
            disabled={saving || !targetId}
          >
            {saving ? "Menukar…" : "Switch Kursi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CrewCheckinPanel ──────────────────────────────────────────────────────────
// Shows crew assigned to this schedule + their check-in status.
// Falls back to captain_name / abk_names from the upload record when no
// formal crew assignments exist in the crew table.
function CrewCheckinPanel({
  scheduleId,
  tripDate,
  captainName,
  abkNames,
  groName,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const ROLE_COLORS = {
    captain: "#1800AD",
    abk: "#0064C8",
    gro: "#009678",
    staff: "#505050",
    other: "#826428",
  };
  const rlabel = (r) =>
    ({
      captain: "Captain",
      abk: "ABK",
      gro: "GRO",
      staff: "Staff",
      other: "Other",
    })[r] ?? r;

  useEffect(() => {
    setLoading(true);
    setData(null);
    if (!scheduleId) {
      setLoading(false);
      return;
    }
    fetchCrewCheckins(scheduleId, tripDate)
      .then(setData)
      .catch(() => setData({ crew: [] }))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  // Fallback: parse captain_name + abk_names from upload record
  const fallback = [];
  if (captainName) {
    fallback.push({
      _key: "cap",
      name: captainName,
      role: "captain",
      checked_in: false,
      checked_in_at: null,
    });
  }
  if (abkNames) {
    let names = [];
    try {
      names = JSON.parse(abkNames);
    } catch (_) {
      names = abkNames
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    names.forEach((n, i) => {
      if (n)
        fallback.push({
          _key: `abk-${i}`,
          name: n,
          role: "abk",
          checked_in: false,
          checked_in_at: null,
        });
    });
  }

  const hasFormal = (data?.crew?.length ?? 0) > 0;
  const crewList = hasFormal ? data.crew : fallback;

  // Add GRO to fallback if not covered by formal crew
  const groInFormal = hasFormal && data.crew.some((c) => c.role === "gro");
  if (!hasFormal || !groInFormal) {
    if (groName) {
      const names = groName
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      names.forEach((n, i) => {
        if (n && !crewList.find((c) => c.name === n)) {
          crewList.push({
            _key: `gro-${i}`,
            name: n,
            role: "gro",
            checked_in: false,
            checked_in_at: null,
          });
        }
      });
    }
  }
  const checkedIn = crewList.filter((c) => c.checked_in).length;

  if (!loading && !crewList.length) return null;

  return (
    <div
      style={{
        marginTop: 20,
        padding: "14px 18px",
        border: "1px solid var(--adm-border)",
        borderRadius: "var(--adm-radius-lg)",
        background: "var(--adm-surface)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Anchor size={14} style={{ color: "var(--adm-text-muted)" }} />
        <span style={{ fontWeight: 700, fontSize: 13 }}>Crew / ABK</span>
        {loading ? (
          <span style={{ fontSize: 12, color: "var(--adm-text-muted)" }}>
            Loading…
          </span>
        ) : hasFormal ? (
          <span
            className={`adm-badge ${checkedIn === crewList.length ? "adm-badge-success" : checkedIn > 0 ? "adm-badge-warning" : "adm-badge-neutral"}`}
            style={{ marginLeft: 4 }}
          >
            {checkedIn}/{crewList.length} check-in
          </span>
        ) : (
          <span
            className="adm-badge adm-badge-neutral"
            style={{ marginLeft: 4, fontSize: 10 }}
          >
            Data manifest · belum pakai modul Crew
          </span>
        )}
      </div>

      {/* Crew pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {crewList.map((c, idx) => {
          const color = ROLE_COLORS[c.role] ?? "#888";
          const isIn = c.checked_in;
          const key = c._key ?? c.crew_id ?? c.assignment_id ?? idx;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                border: `1px solid ${isIn ? "#a5d6a7" : "var(--adm-border)"}`,
                borderRadius: 999,
                background: isIn ? "#e8f5e9" : "var(--adm-bg)",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: isIn ? "#2e7d32" : "#ccc",
                  boxShadow: isIn ? "0 0 4px rgba(46,125,50,.5)" : "none",
                }}
              />
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: `${color}18`,
                }}
              >
                {rlabel(c.role)}
              </span>
              {isIn && c.checked_in_at && (
                <span style={{ fontSize: 10, color: "#2e7d32" }}>
                  {new Date(c.checked_in_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {!isIn && hasFormal && (
                <span style={{ fontSize: 10, color: "#999" }}>belum</span>
              )}
            </div>
          );
        })}
      </div>

      {!hasFormal && fallback.length > 0 && (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 11,
            color: "var(--adm-text-faint)",
          }}
        >
          Tambahkan crew di halaman <strong>Crew Management</strong> dan assign
          ke schedule ini untuk check-in real-time.
        </p>
      )}
    </div>
  );
}

// ── TicketsPanel ──────────────────────────────────────────────────────────────
function TicketsPanel({ tickets, upload, onRefresh }) {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState(""); // immediate input value
  const [search, setSearch] = useState(""); // debounced search value
  const [filter, setFilter] = useState("all");
  const [editingTicket, setEditingTicket] = useState(null);
  const [switchingTicket, setSwitchingTicket] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [highlightedGroup, setHighlightedGroup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [showingQrCodes, setShowingQrCodes] = useState(false);
  const [qrCodesData, setQrCodesData] = useState(null);
  const [loadingQrCodes, setLoadingQrCodes] = useState(false);
  const itemsPerPage = 20;

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openEditModal = async (ticket) => {
    setEditingTicket(ticket);
    try {
      const data = await fetchAvailableSeats(upload.id);
      console.log("Available seats data:", data); // Debug
      console.log("Seats array:", data.seats); // Debug
      setAvailableSeats(data.seats || []);
    } catch (e) {
      console.error("Failed to fetch seats:", e); // Debug
      toast.error("Failed to load seats: " + e.message);
    }
  };

  // Helper functions - defined BEFORE they're used
  const isCancelled = (t) => parseInt(t.cancelled) === 1;
  const cancelledCount = tickets.filter(isCancelled).length;

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
          ? isCancelled(t)
          : filter === "checked_in"
            ? parseInt(t.checked_in) === 1 && !isCancelled(t)
            : filter === "pending"
              ? parseInt(t.checked_in) !== 1 && !isCancelled(t)
              : filter === "overnight"
                ? (t.ket || "").toUpperCase().includes("OVERNIGHT")
                : filter === "daytrip"
                  ? (t.ket || "").toUpperCase().includes("DAY")
                  : filter === "unassigned"
                    ? !t.seat_number && !isCancelled(t)
                    : filter === "staff"
                      ? (t.ket || "").toUpperCase() === "STAFF"
                      : filter === "foc"
                        ? (t.ket || "").toUpperCase() === "FOC"
                        : filter === "vendor"
                          ? (t.ket || "").toUpperCase() === "VENDOR"
                          : true;
    return matchSearch && matchFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // Print functions
  const bpBase = `${API_URL}/api/admin/manifest/boarding-pass/${upload?.id}`;
  const printAll = () => window.open(bpBase, "_blank");
  const printOne = (id) => window.open(`${bpBase}?ticket_ids=${id}`, "_blank");
  const printFiltered = () =>
    window.open(
      `${bpBase}?ticket_ids=${filtered.map((t) => t.id).join(",")}`,
      "_blank",
    );

  // Return boarding pass — only overnight tickets
  const overnightIds = tickets
    .filter(
      (t) =>
        (t.ket || "").toUpperCase().includes("OVERNIGHT") && !isCancelled(t),
    )
    .map((t) => t.id);
  const printReturnBp = () =>
    window.open(`${bpBase}?ticket_ids=${overnightIds.join(",")}`, "_blank");

  // Per-ket counts from actual ticket data
  const ketCount = (ket) =>
    tickets.filter(
      (t) =>
        (t.ket || "").toUpperCase().includes(ket.toUpperCase()) &&
        !isCancelled(t),
    ).length;

  // Send group QR emails
  const handleSendGroupQrEmails = async () => {
    setSendingEmails(true);
    try {
      // For now, send without group_emails (backend will log warning)
      // TODO: collect emails from booking system or prompt user
      const result = await sendGroupQrEmails(upload.id, {});
      toast.success(
        `✉️ Sent ${result.sent_count} emails to ${result.total_groups} groups`,
      );
      if (result.failed_groups.length > 0) {
        toast.warning(
          `Gagal ${result.failed_groups.length}: ${result.failed_groups.join(", ")}`,
        );
      }
    } catch (e) {
      toast.error("Failed to send emails: " + e.message);
    } finally {
      setSendingEmails(false);
    }
  };

  // View group QR codes
  const handleViewGroupQrCodes = async () => {
    setLoadingQrCodes(true);
    try {
      const data = await fetchGroupQrCodes(upload.id);
      setQrCodesData(data);
      setShowingQrCodes(true);
    } catch (e) {
      toast.error("Failed to load QR codes: " + e.message);
    } finally {
      setLoadingQrCodes(false);
    }
  };

  // Download QR as PNG (use data URL)
  const downloadQrCode = (groupName, qrDataUrl) => {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${groupName.replace(/\s+/g, "-")}.png`;
    link.click();
  };

  // KET badge styling
  const ketBadgeStyle = (ket) => {
    const k = (ket || "").toUpperCase();
    if (k.includes("OVERNIGHT"))
      return { background: "#e3f2fd", color: "#1565c0" };
    if (k.includes("DAY TRIP") || k.includes("DAYTRIP"))
      return { background: "#fff3e0", color: "#e65100" };
    if (k.includes("STAFF")) return { background: "#e8f5e9", color: "#2e7d32" };
    if (k.includes("FOC")) return { background: "#f3e5f5", color: "#6a1b9a" };
    if (k.includes("VENDOR"))
      return { background: "#efebe9", color: "#4e342e" };
    if (k.includes("CANCEL"))
      return { background: "#ffebee", color: "#c62828" };
    return { background: "var(--adm-bg)", color: "var(--adm-text-muted)" };
  };

  return (
    <div>
      <div className="adm-stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total Pax", value: tickets.length },
          {
            label: "Seat Assigned",
            value: tickets.filter((t) => t.seat_number && !isCancelled(t))
              .length,
          },
          {
            label: "Unassigned",
            value: tickets.filter((t) => !t.seat_number && !isCancelled(t))
              .length,
            warn: true,
          },
          { label: "Cancelled", value: cancelledCount, danger: true },
          { label: "Overnight", value: ketCount("OVERNIGHT"), info: true },
          {
            label: "Day Trip",
            value: ketCount("DAY TRIP") + ketCount("DAYTRIP"),
            orange: true,
          },
          ...(ketCount("STAFF") > 0
            ? [{ label: "Staff", value: ketCount("STAFF"), green: true }]
            : []),
          ...(ketCount("FOC") > 0
            ? [{ label: "FOC", value: ketCount("FOC"), purple: true }]
            : []),
          ...(ketCount("VENDOR") > 0
            ? [{ label: "Vendor", value: ketCount("VENDOR"), brown: true }]
            : []),
          {
            label: "Groups",
            value: new Set(tickets.map((t) => t.group_name).filter(Boolean))
              .size,
          },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div
              className="adm-stat-value"
              style={{
                fontSize: 22,
                color: s.danger
                  ? "#d32f2f"
                  : s.warn
                    ? "#e65100"
                    : s.info
                      ? "#1565c0"
                      : s.orange
                        ? "#e65100"
                        : s.green
                          ? "#2e7d32"
                          : s.purple
                            ? "#6a1b9a"
                            : s.brown
                              ? "#4e342e"
                              : undefined,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <SeatMap
        tickets={tickets.filter((t) => !isCancelled(t))}
        upload={upload}
        highlightedGroup={highlightedGroup}
        onClearHighlight={() => setHighlightedGroup(null)}
      />

      {/* Crew check-in status for this schedule */}
      <CrewCheckinPanel
        scheduleId={upload?.schedule_id}
        tripDate={upload?.trip_date}
        captainName={upload?.captain_name}
        abkNames={upload?.abk_names}
        groName={upload?.gro_name}
      />

      <div
        style={{
          display: "flex",
          gap: 8,
          margin: "16px 0 0",
          padding: "12px 16px",
          background: "var(--adm-bg)",
          border: "1px solid var(--adm-border)",
          borderRadius: "var(--adm-radius-sm)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--adm-text-muted)",
            marginRight: 4,
          }}
        >
          <Printer
            size={13}
            style={{ verticalAlign: "middle", marginRight: 4 }}
          />
          Print Boarding Pass:
        </span>
        <button
          className="adm-btn adm-btn-primary adm-btn-sm"
          onClick={printAll}
        >
          All ({tickets.length} pax)
        </button>
        {filtered.length !== tickets.length && filtered.length > 0 && (
          <button
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={printFiltered}
          >
            Filtered ({filtered.length} pax)
          </button>
        )}
        {/* Return boarding pass — only for overnight passengers (includes 2nd return page) */}
        {overnightIds.length > 0 && (
          <button
            className="adm-btn adm-btn-sm"
            style={{ background: "#1800AD", color: "#fff", border: "none" }}
            onClick={printReturnBp}
            title="Print boarding pass untuk penumpang overnight (2 halaman: berangkat + pulang)"
          >
            <Moon size={12} style={{ marginRight: 4 }} />
            Overnight BP ({overnightIds.length} pax)
          </button>
        )}
        {/* Send all group QR codes via email */}
        {upload && (
          <>
            <button
              className="adm-btn adm-btn-sm"
              style={{
                background: "#2196F3",
                color: "#fff",
                border: "none",
              }}
              onClick={handleViewGroupQrCodes}
              disabled={loadingQrCodes}
              title="View all group QR codes"
            >
              {loadingQrCodes ? (
                <>
                  <span style={{ marginRight: 4 }}>⏳ Loading…</span>
                </>
              ) : (
                <>👁️ View QR Codes</>
              )}
            </button>
            <button
              className="adm-btn adm-btn-sm"
              style={{
                background: "#4CAF50",
                color: "#fff",
                border: "none",
              }}
              onClick={handleSendGroupQrEmails}
              disabled={sendingEmails}
              title="Blast email group QR codes to all groups"
            >
              {sendingEmails ? (
                <>
                  <span style={{ marginRight: 4 }}>⏳ Sending…</span>
                </>
              ) : (
                <>📧 Send All Group QR</>
              )}
            </button>
          </>
        )}
        <span
          style={{
            fontSize: 11,
            color: "var(--adm-text-faint)",
            marginLeft: 4,
          }}
        >
          — or click <Printer size={11} style={{ verticalAlign: "middle" }} />{" "}
          on any row
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          margin: "20px 0 12px",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", minWidth: 240 }}>
          <input
            placeholder="Search name, NIK, seat…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              padding: "7px 32px 7px 11px",
              border: `1px solid ${searchInput ? "#1976d2" : "var(--adm-border-strong)"}`,
              borderRadius: "var(--adm-radius-sm)",
              fontSize: 13,
              width: "100%",
              transition: "border-color 0.2s",
            }}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearch("");
              }}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--adm-text-muted)",
                cursor: "pointer",
                padding: "4px 6px",
                fontSize: 14,
                lineHeight: 1,
                borderRadius: 4,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "var(--adm-bg)";
                e.target.style.color = "var(--adm-text)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "var(--adm-text-muted)";
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        {[
          "all",
          "pending",
          "checked_in",
          "unassigned",
          "cancelled",
          "overnight",
          "daytrip",
          ...(ketCount("STAFF") > 0 ? ["staff"] : []),
          ...(ketCount("FOC") > 0 ? ["foc"] : []),
          ...(ketCount("VENDOR") > 0 ? ["vendor"] : []),
        ].map((f) => (
          <button
            key={f}
            className={`adm-btn adm-btn-sm ${filter === f ? "adm-btn-primary" : "adm-btn-secondary"}`}
            onClick={() => setFilter(f)}
            style={{ position: "relative" }}
          >
            {f === "pending" ? (
              <>
                <AlertTriangle size={12} style={{ verticalAlign: "middle" }} />{" "}
                Pending
              </>
            ) : f === "checked_in" ? (
              <>
                <CheckCheck size={12} style={{ verticalAlign: "middle" }} />{" "}
                Checked In
              </>
            ) : f === "cancelled" ? (
              <>
                <X size={12} style={{ verticalAlign: "middle" }} /> Cancelled
              </>
            ) : f === "overnight" ? (
              <>
                <Moon size={12} style={{ verticalAlign: "middle" }} /> Overnight
              </>
            ) : f === "daytrip" ? (
              <>
                <Sun size={12} style={{ verticalAlign: "middle" }} /> Day Trip
              </>
            ) : f === "staff" ? (
              <>
                <Users size={12} style={{ verticalAlign: "middle" }} /> Staff
              </>
            ) : f === "foc" ? (
              <>
                <Ticket size={12} style={{ verticalAlign: "middle" }} /> FOC
              </>
            ) : f === "vendor" ? (
              <>
                <Store size={12} style={{ verticalAlign: "middle" }} /> Vendor
              </>
            ) : f === "unassigned" ? (
              <>
                <AlertTriangle size={12} style={{ verticalAlign: "middle" }} />{" "}
                Unassigned
              </>
            ) : (
              "All"
            )}
          </button>
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--adm-text-faint)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {search && (
            <span
              style={{
                background: "#e3f2fd",
                color: "#1565c0",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              🔍 Search active
            </span>
          )}
          {filter !== "all" && (
            <span
              style={{
                background: "#fff3e0",
                color: "#e65100",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              Filter: {filter}
            </span>
          )}
          <span>{filtered.length} rows</span>
        </span>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ket</th>
              <th>Nama Penumpang</th>
              <th>Grup</th>
              <th>NIK/Passport</th>
              <th>Kursi</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map((t) => (
              <tr
                key={t.id}
                style={{
                  opacity: isCancelled(t) ? 0.6 : 1,
                  textDecoration: isCancelled(t) ? "line-through" : "none",
                }}
              >
                <td style={{ color: "var(--adm-text-faint)" }}>{t.seq_no}</td>
                <td>
                  <span className="adm-badge" style={ketBadgeStyle(t.ket)}>
                    {t.ket || "—"}
                  </span>
                </td>
                <td
                  className="adm-cell-primary"
                  style={{ whiteSpace: "normal", minWidth: 160 }}
                >
                  {t.passenger_name}
                </td>
                <td style={{ color: "var(--adm-text-muted)", maxWidth: 140 }}>
                  {t.group_name ? (
                    <button
                      onClick={() => setHighlightedGroup(t.group_name)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#667eea",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                        fontSize: "inherit",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = "#764ba2";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = "#667eea";
                      }}
                    >
                      {t.group_name}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {t.id_passport || "—"}
                </td>
                <td>
                  {isCancelled(t) ? (
                    <span
                      className="adm-badge"
                      style={{ background: "#ffebee", color: "#d32f2f" }}
                    >
                      Cancelled
                    </span>
                  ) : t.seat_number ? (
                    <span className="adm-badge adm-badge-success">
                      {t.seat_number}
                    </span>
                  ) : (
                    <span className="adm-badge adm-badge-warning">
                      Unassigned
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`adm-badge ${parseInt(t.checked_in) === 1 ? "adm-badge-success" : "adm-badge-neutral"}`}
                  >
                    {parseInt(t.checked_in) === 1 ? (
                      <>
                        <Check
                          size={11}
                          style={{ verticalAlign: "middle", marginRight: 2 }}
                        />
                        Checked In
                      </>
                    ) : (
                      "Pending"
                    )}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                      onClick={() => openEditModal(t)}
                      title="Edit ticket"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                      onClick={() => printOne(t.id)}
                      title="Print boarding pass"
                    >
                      <Printer size={13} />
                    </button>
                    {t.seat_number && !isCancelled(t) && (
                      <button
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => setSwitchingTicket(t)}
                        title="Switch seat dengan penumpang lain"
                        style={{ color: "#7c3aed" }}
                      >
                        <ArrowLeftRight size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--adm-bg)",
            border: "1px solid var(--adm-border)",
            borderRadius: "var(--adm-radius-sm)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--adm-text-muted)" }}>
            Showing {startIndex + 1} - {Math.min(endIndex, filtered.length)} of{" "}
            {filtered.length} tickets
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Previous
            </button>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--adm-text)",
                minWidth: 80,
                textAlign: "center",
              }}
            >
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {editingTicket && (
        <TicketEditModal
          ticket={editingTicket}
          availableSeats={availableSeats}
          onSave={() => setEditingTicket(null)}
          onClose={() => setEditingTicket(null)}
          onRefresh={onRefresh}
        />
      )}

      {switchingTicket && (
        <SwitchSeatModal
          ticket={switchingTicket}
          tickets={tickets}
          onClose={() => setSwitchingTicket(null)}
          onSuccess={() => {
            setSwitchingTicket(null);
            onRefresh();
          }}
        />
      )}

      {/* QR Codes Viewer Modal */}
      {showingQrCodes && qrCodesData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowingQrCodes(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--adm-radius)",
              padding: 24,
              maxWidth: 900,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid var(--adm-border)",
              }}
            >
              <h3 style={{ margin: 0 }}>👁️ Group QR Codes</h3>
              <button
                onClick={() => setShowingQrCodes(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--adm-text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                fontSize: 13,
                color: "var(--adm-text-muted)",
                marginBottom: 16,
              }}
            >
              <p>
                <strong>Boat:</strong> {qrCodesData.boat_name}
              </p>
              <p>
                <strong>Route:</strong> {qrCodesData.origin} →{" "}
                {qrCodesData.destination}
              </p>
              <p>
                <strong>Date:</strong> {qrCodesData.trip_date}
              </p>
              <p>
                <strong>Total Groups:</strong> {qrCodesData.total_groups}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16,
              }}
            >
              {qrCodesData.groups.map((group) => (
                <div
                  key={group.group_name}
                  style={{
                    border: "1px solid var(--adm-border)",
                    borderRadius: "var(--adm-radius-sm)",
                    padding: 16,
                    textAlign: "center",
                    background: "var(--adm-bg)",
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: "0 0 4px" }}>{group.group_name}</h4>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--adm-text-muted)",
                      }}
                    >
                      {group.member_count} pax
                    </div>
                  </div>

                  {group.qr_data_url && (
                    <div style={{ marginBottom: 12 }}>
                      <img
                        src={group.qr_data_url}
                        alt={`QR for ${group.group_name}`}
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          border: "1px solid var(--adm-border-strong)",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  )}

                  <button
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    onClick={() =>
                      downloadQrCode(group.group_name, group.qr_data_url)
                    }
                    style={{ width: "100%" }}
                  >
                    ⬇️ Download PNG
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BaggagePanel ─────────────────────────────────────────────────────────────
function BaggagePanel({ upload, tickets, baggage, onRefresh }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    group_name: "",
    bag_label: "",
    weight_kg: "",
    bag_count: 1,
    description: "",
  });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const groups = [
    ...new Set(tickets.map((t) => t.group_name).filter(Boolean)),
  ].sort();

  const resetForm = () => {
    setForm({
      group_name: "",
      bag_label: "",
      weight_kg: "",
      bag_count: 1,
      description: "",
    });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.group_name) {
      toast.error("Group name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateBaggage(editId, form);
        toast.success("Baggage updated.");
      } else {
        await addBaggage({
          ...form,
          upload_id: upload.id,
          direction: upload.direction,
        });
        toast.success("Baggage added.");
      }
      resetForm();
      onRefresh();
    } catch (e) {
      toast.error(e.message || "Failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete baggage item?",
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBaggage(id);
      toast.success("Deleted.");
      onRefresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleMarkPrinted = async (b) => {
    try {
      await markBaggagePrinted(b.id);
      toast.success("Marked as printed.");
      onRefresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handlePrintTag = (b) => {
    const url = `${API_URL}/api/admin/manifest/baggage-tag-pdf/${b.id}`;
    const token = localStorage.getItem("nama_marine_token");
    // Fetch PDF blob then open in new tab (need auth header)
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        window.open(objUrl, "_blank");
        // Cleanup after short delay
        setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
        onRefresh(); // refresh printed status
      })
      .catch(() => toast.error("Gagal membuka tag PDF."));
  };

  return (
    <div>
      <div className="adm-form" style={{ marginBottom: 24 }}>
        <h3>{editId ? "Edit Baggage" : "Add Baggage"}</h3>
        <div className="adm-form-row">
          <div className="adm-field">
            <label>Group *</label>
            <select
              value={form.group_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, group_name: e.target.value }))
              }
            >
              <option value="">Select group…</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-field">
            <label>Label / Tag</label>
            <input
              value={form.bag_label}
              onChange={(e) =>
                setForm((f) => ({ ...f, bag_label: e.target.value }))
              }
              placeholder="e.g. BAG-001"
            />
          </div>
        </div>
        <div className="adm-form-row">
          <div className="adm-field">
            <label>Weight (kg)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.weight_kg}
              onChange={(e) =>
                setForm((f) => ({ ...f, weight_kg: e.target.value }))
              }
            />
          </div>
          <div className="adm-field">
            <label>Bag Count</label>
            <input
              type="number"
              min="1"
              value={form.bag_count}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bag_count: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>
        </div>
        <div className="adm-field">
          <label>Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
        <div className="adm-form-actions">
          {editId && (
            <button className="adm-btn adm-btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
          <button
            className="adm-btn adm-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : editId ? "Update" : "Add Baggage"}
          </button>
        </div>
      </div>
      {baggage.length === 0 ? (
        <p className="adm-empty">No baggage added yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Label</th>
                <th>Bags</th>
                <th>Weight</th>
                <th>Description</th>
                <th>Printed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {baggage.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span className="adm-cell-primary">{b.group_name}</span>
                  </td>
                  <td>{b.bag_label || "-"}</td>
                  <td>{b.bag_count}</td>
                  <td>{b.weight_kg ? `${b.weight_kg} kg` : "-"}</td>
                  <td style={{ maxWidth: 200 }}>{b.description || "-"}</td>
                  <td>
                    <span
                      className={`adm-badge ${b.tag_printed ? "adm-badge-success" : "adm-badge-neutral"}`}
                    >
                      {b.tag_printed ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <div className="adm-row-actions">
                      <button
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => handlePrintTag(b)}
                        title="Cetak baggage tag PDF"
                      >
                        <Tag
                          size={13}
                          style={{ marginRight: 4, verticalAlign: "middle" }}
                        />
                        Tag PDF
                      </button>
                      <button
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => {
                          setEditId(b.id);
                          setForm({
                            group_name: b.group_name,
                            bag_label: b.bag_label || "",
                            weight_kg: b.weight_kg || "",
                            bag_count: b.bag_count || 1,
                            description: b.description || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        onClick={() => handleDelete(b.id)}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── UploadForm ────────────────────────────────────────────────────────────────
function UploadForm({ schedules, onSuccess }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    schedule_id: "",
    direction: "DEPARTURE",
    captain_name: "",
    abk_names: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f && !f.name.endsWith(".xlsx")) {
      toast.error("Only .xlsx files are supported.");
      return;
    }
    setFile(f || null);
  };

  const handleSubmit = async () => {
    if (!form.schedule_id) {
      toast.error("Please select a schedule.");
      return;
    }
    if (!file) {
      toast.error("Please attach an .xlsx manifest file.");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const res = await uploadManifestFile({
        file,
        scheduleId: form.schedule_id,
        direction: form.direction,
        captainName: form.captain_name,
        abkNames: form.abk_names,
        notes: form.notes,
      });
      setResult(res);
      const parts = [
        `${res.total_pax} pax`,
        `${res.seats_assigned} seats assigned`,
      ];
      if (res.origin && res.destination)
        parts.push(`${res.origin} → ${res.destination}`);
      if (res.captain_name) parts.push(`Nahkoda: ${res.captain_name}`);
      toast.success(`Uploaded: ${parts.join(" · ")}.`);

      // Show captain auto-assign result
      const ca = res.captain_assign;
      if (ca) {
        if (ca.status === "assigned") {
          toast.success(
            `⚓ Captain ${ca.captain_name} berhasil di-assign ke schedule.`,
          );
        } else if (ca.status === "already_assigned") {
          toast.info(
            `⚓ Captain ${ca.captain_name} sudah di-assign sebelumnya.`,
          );
        } else if (ca.status === "not_found") {
          toast.error(`⚠️ ${ca.message}`);
        }
      }
      if (fileRef.current) fileRef.current.value = "";
      setFile(null);
      onSuccess(res.upload_id);
    } catch (e) {
      toast.error(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="adm-form">
      <h3>Upload Manifest Excel</h3>
      <p
        style={{
          fontSize: 13,
          color: "var(--adm-text-muted)",
          marginBottom: 20,
          marginTop: -8,
        }}
      >
        Upload manifest sheet (.xlsx). Kursi akan di-assign otomatis per grup.
      </p>
      <div className="adm-form-row">
        <div className="adm-field">
          <label>Schedule *</label>
          <select
            value={form.schedule_id}
            onChange={(e) => set("schedule_id", e.target.value)}
          >
            <option value="">Select schedule…</option>
            {schedules.map((s) => (
              <option key={`${s.type}-${s.id}`} value={s.id}>
                {scheduleLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label>Direction</label>
          <select
            value={form.direction}
            onChange={(e) => set("direction", e.target.value)}
          >
            <option value="DEPARTURE">Departure (Keberangkatan)</option>
            <option value="RETURN">Return (Kepulangan)</option>
          </select>
        </div>
      </div>
      <div className="adm-form-row">
        <div className="adm-field">
          <label>Nama Kapten</label>
          <input
            value={form.captain_name}
            onChange={(e) => set("captain_name", e.target.value)}
            placeholder="Opsional"
          />
        </div>
        <div className="adm-field">
          <label>Nama ABK / Crew</label>
          <textarea
            rows={2}
            value={form.abk_names}
            onChange={(e) => set("abk_names", e.target.value)}
            placeholder="Satu nama per baris (opsional)"
            style={{ resize: "vertical" }}
          />
        </div>
      </div>
      <div className="adm-form-row">
        <div className="adm-field">
          <label>File Manifest (.xlsx) *</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            onChange={handleFile}
          />
          <p className="adm-field-hint">
            {file
              ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)`
              : "Max 10 MB"}
          </p>
        </div>
        <div className="adm-field">
          <label>Catatan</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
      </div>
      <div className="adm-form-actions">
        <button
          className="adm-btn adm-btn-primary"
          onClick={handleSubmit}
          disabled={uploading}
        >
          {uploading ? "Uploading & assigning seats…" : "Upload & Assign Seats"}
        </button>
      </div>
      {result && (
        <div className="adm-alert adm-alert-success" style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 6 }}>
            ✓ <strong>{result.total_pax}</strong> penumpang diproses —{" "}
            <strong>{result.seats_assigned}</strong> kursi di-assign.
          </div>
          <div
            style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12 }}
          >
            {result.origin && result.destination && (
              <span>
                📍 {result.origin} → {result.destination}
              </span>
            )}
            {result.captain_name && (
              <span>⚓ Nahkoda: {result.captain_name}</span>
            )}
            {result.gro_name && <span>🙋 GRO: {result.gro_name}</span>}
            {result.overnight > 0 && (
              <span style={{ color: "#1565c0" }}>
                🌙 Overnight: {result.overnight}
              </span>
            )}
            {result.daytrip > 0 && (
              <span style={{ color: "#e65100" }}>
                ☀️ Day Trip: {result.daytrip}
              </span>
            )}
            {result.staff > 0 && (
              <span style={{ color: "#2e7d32" }}>👤 Staff: {result.staff}</span>
            )}
            {result.foc > 0 && (
              <span style={{ color: "#6a1b9a" }}>🎟️ FOC: {result.foc}</span>
            )}
            {result.vendor > 0 && (
              <span style={{ color: "#4e342e" }}>
                🏪 Vendor: {result.vendor}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              marginTop: 6,
              color: "var(--adm-text-muted)",
            }}
          >
            Upload ID: <strong>{result.upload_id}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UploadList ────────────────────────────────────────────────────────────────
function UploadList({ uploads, selectedId, onSelect, onDelete }) {
  if (uploads.length === 0)
    return <p className="adm-empty">No manifests uploaded yet.</p>;
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Boat</th>
            <th>Date</th>
            <th>Direction</th>
            <th>Pax</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((u) => (
            <tr
              key={u.id}
              style={{
                background:
                  u.id === selectedId ? "var(--adm-accent-soft)" : undefined,
              }}
            >
              <td style={{ fontWeight: 700 }}>#{u.id}</td>
              <td>
                <div className="adm-cell-primary">{u.boat_name}</div>
                {u.captain_name && (
                  <div className="adm-cell-muted">Kapten: {u.captain_name}</div>
                )}
              </td>
              <td>{fmtDate(u.trip_date)}</td>
              <td>
                <span
                  className={`adm-badge ${u.direction === "RETURN" ? "adm-badge-info" : "adm-badge-warning"}`}
                >
                  {u.direction === "RETURN" ? "Return" : "Departure"}
                </span>
              </td>
              <td>{u.total_pax}</td>
              <td>
                <span
                  className={`adm-badge ${u.status === "confirmed" ? "adm-badge-success" : "adm-badge-neutral"}`}
                >
                  {u.status}
                </span>
              </td>
              <td>
                <div className="adm-row-actions">
                  <button
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    onClick={() => onSelect(u.id)}
                  >
                    {u.id === selectedId ? "Hide" : "View"}
                  </button>
                  <button
                    className="adm-btn adm-btn-danger adm-btn-sm"
                    onClick={() => onDelete(u.id)}
                  >
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── BoatCrewPanel ─────────────────────────────────────────────────────────────
function BoatCrewPanel() {
  const toast = useToast();
  const [boats, setBoats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ captain_name: "", abk_names: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBoatsWithCrew()
      .then(setBoats)
      .catch(() => toast.error("Failed to load boats."));
  }, []);

  const startEdit = (b) => {
    setEditing(b.id);
    let abkStr = "";
    if (b.abk_names) {
      try {
        abkStr = JSON.parse(b.abk_names).join("\n");
      } catch {
        abkStr = b.abk_names;
      }
    }
    setForm({ captain_name: b.captain_name || "", abk_names: abkStr });
  };

  const handleSave = async (boatId) => {
    setSaving(true);
    try {
      await updateBoatCrew(boatId, {
        captain_name: form.captain_name,
        abk_names: form.abk_names,
      });
      toast.success("Crew updated.");
      setBoats(await fetchBoatsWithCrew());
      setEditing(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!boats.length) return <div className="adm-loading">Loading boats…</div>;
  return (
    <div>
      <p
        style={{
          fontSize: 13,
          color: "var(--adm-text-muted)",
          marginBottom: 20,
        }}
      >
        Set captain dan ABK per kapal. Nama captain juga bisa diisi saat upload
        manifest.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {boats.map((b) => (
          <div key={b.id} className="adm-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {b.boat_name}
                </div>
                <div className="adm-cell-muted">Capacity: {b.capacity}</div>
              </div>
              {editing !== b.id && (
                <button
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => startEdit(b)}
                >
                  Edit Crew
                </button>
              )}
            </div>
            {editing === b.id ? (
              <div style={{ marginTop: 16 }}>
                <div className="adm-form-row">
                  <div className="adm-field">
                    <label>Nama Kapten</label>
                    <input
                      value={form.captain_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, captain_name: e.target.value }))
                      }
                      placeholder="Nama kapten kapal"
                    />
                  </div>
                  <div className="adm-field">
                    <label>ABK / Crew (satu nama per baris)</label>
                    <textarea
                      rows={4}
                      value={form.abk_names}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, abk_names: e.target.value }))
                      }
                      style={{ resize: "vertical" }}
                    />
                  </div>
                </div>
                <div className="adm-form-actions">
                  <button
                    className="adm-btn adm-btn-ghost"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="adm-btn adm-btn-primary"
                    onClick={() => handleSave(b.id)}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 32,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div className="adm-stat-label" style={{ marginBottom: 4 }}>
                    Kapten
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {b.captain_name || (
                      <em style={{ color: "var(--adm-text-faint)" }}>
                        Belum diset
                      </em>
                    )}
                  </div>
                </div>
                <div>
                  <div className="adm-stat-label" style={{ marginBottom: 4 }}>
                    ABK
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {b.abk_names ? (
                      (() => {
                        try {
                          return JSON.parse(b.abk_names).join(", ");
                        } catch {
                          return b.abk_names;
                        }
                      })()
                    ) : (
                      <em style={{ color: "var(--adm-text-faint)" }}>
                        Belum diset
                      </em>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
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
      message: "All tickets and baggage records will be removed.",
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
      const ups = await fetchUploads().catch(() =>
        uploads.filter((u) => u.id !== id),
      );
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
      setUploads(await fetchUploads());
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleForceAssign = async () => {
    if (!selectedId) return;
    try {
      const result = await forceAssignSeats(selectedId);
      toast.success(
        `Assigned ${result.passengers_assigned} seats successfully!`,
      );
      loadDetail(selectedId);
      setUploads(await fetchUploads());
    } catch (e) {
      toast.error(e.message || "Force assign failed");
    }
  };

  const refreshDetail = () => {
    if (selectedId) loadDetail(selectedId);
  };

  if (status === "loading") return <div className="adm-loading">Loading…</div>;
  if (status === "error")
    return (
      <div className="adm-alert adm-alert-danger">
        Failed to load manifest data.
      </div>
    );

  const currentUpload = detail?.upload || null;
  const currentTickets = detail?.tickets || [];
  const currentBaggage = detail?.baggage || [];

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1>Manifest Upload</h1>
          <p>
            Upload Excel manifest, kursi di-assign otomatis per grup, lalu
            kelola bagasi dan cetak guest tag.
          </p>
        </div>
        {currentUpload && (
          <div className="adm-page-header-actions">
            {currentUpload.status === "draft" && (
              <button
                className="adm-btn adm-btn-success"
                onClick={handleConfirm}
              >
                <CheckCheck
                  size={15}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                Confirm Manifest #{selectedId}
              </button>
            )}
            {currentTickets.filter((t) => !t.seat_id && !t.cancelled).length >
              0 && (
              <button
                className="adm-btn adm-btn-warning"
                onClick={handleForceAssign}
                style={{ marginLeft: 8 }}
              >
                <Wrench
                  size={15}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                Force Assign Seats (
                {
                  currentTickets.filter((t) => !t.seat_id && !t.cancelled)
                    .length
                }{" "}
                unassigned)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="adm-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`adm-tab ${tab === t ? "adm-tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Tickets" && currentTickets.length > 0 && (
              <span className="adm-count-pill" style={{ marginLeft: 6 }}>
                {currentTickets.length}
              </span>
            )}
            {t === "Baggage" && currentBaggage.length > 0 && (
              <span className="adm-count-pill" style={{ marginLeft: 6 }}>
                {currentBaggage.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "Upload" && (
        <>
          <UploadForm schedules={schedules} onSuccess={handleUploadSuccess} />
          <div className="adm-section">
            <div className="adm-section-heading">
              <h2>Previous Uploads</h2>
              <span className="adm-count-pill">{uploads.length}</span>
            </div>
            <UploadList
              uploads={uploads}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}

      {tab === "Tickets" &&
        (!selectedId ? (
          <div className="adm-alert adm-alert-info">
            Select a manifest from the Upload tab to view its tickets.
          </div>
        ) : !detail ? (
          <div className="adm-loading">Loading tickets…</div>
        ) : (
          <>
            {/* ── Manifest info card ────────────────────────────── */}
            <div className="adm-card" style={{ marginBottom: 20 }}>
              {/* Row 1 – trip info */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div className="adm-stat-label">Kapal</div>
                  <div style={{ fontWeight: 700 }}>
                    {currentUpload.boat_name}
                  </div>
                </div>
                {currentUpload.origin && (
                  <div>
                    <div className="adm-stat-label">Asal</div>
                    <div>{currentUpload.origin}</div>
                  </div>
                )}
                {currentUpload.destination && (
                  <div>
                    <div className="adm-stat-label">Tujuan</div>
                    <div>{currentUpload.destination}</div>
                  </div>
                )}
                <div>
                  <div className="adm-stat-label">Direction</div>
                  <div>{currentUpload.direction}</div>
                </div>
                <div>
                  <div className="adm-stat-label">Tanggal</div>
                  <div>{fmtDate(currentUpload.trip_date)}</div>
                </div>
                <div>
                  <div className="adm-stat-label">Status</div>
                  <span
                    className={`adm-badge ${currentUpload.status === "confirmed" ? "adm-badge-success" : "adm-badge-warning"}`}
                  >
                    {currentUpload.status}
                  </span>
                </div>
              </div>
              {/* Row 2 – crew info (only if any exists) */}
              {(currentUpload.captain_name ||
                currentUpload.abk_names ||
                currentUpload.gro_name) && (
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                    paddingTop: 12,
                    borderTop: "1px solid var(--adm-border)",
                  }}
                >
                  {currentUpload.captain_name && (
                    <div>
                      <div className="adm-stat-label">Nahkoda</div>
                      <div style={{ fontSize: 13 }}>
                        {currentUpload.captain_name}
                      </div>
                    </div>
                  )}
                  {currentUpload.abk_names && (
                    <div>
                      <div className="adm-stat-label">Crew / ABK</div>
                      <div style={{ fontSize: 13 }}>
                        {(() => {
                          try {
                            return JSON.parse(currentUpload.abk_names).join(
                              ", ",
                            );
                          } catch {
                            return currentUpload.abk_names;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  {currentUpload.gro_name && (
                    <div>
                      <div className="adm-stat-label">GRO</div>
                      <div style={{ fontSize: 13 }}>
                        {currentUpload.gro_name}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Row 3 – pax category counts */}
              {(currentUpload.overnight_count > 0 ||
                currentUpload.daytrip_count > 0) && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    paddingTop: 12,
                    borderTop: "1px solid var(--adm-border)",
                    marginTop: 12,
                  }}
                >
                  {[
                    {
                      label: "Overnight",
                      value: currentUpload.overnight_count,
                      color: "#1565c0",
                      bg: "#e3f2fd",
                    },
                    {
                      label: "Day Trip",
                      value: currentUpload.daytrip_count,
                      color: "#e65100",
                      bg: "#fff3e0",
                    },
                    {
                      label: "Staff",
                      value: currentUpload.staff_count,
                      color: "#2e7d32",
                      bg: "#e8f5e9",
                    },
                    {
                      label: "FOC",
                      value: currentUpload.foc_count,
                      color: "#6a1b9a",
                      bg: "#f3e5f5",
                    },
                    {
                      label: "Vendor",
                      value: currentUpload.vendor_count,
                      color: "#4e342e",
                      bg: "#efebe9",
                    },
                  ]
                    .filter((x) => (x.value ?? 0) > 0)
                    .map((x) => (
                      <span
                        key={x.label}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: x.bg,
                          color: x.color,
                        }}
                      >
                        {x.label}: {x.value}
                      </span>
                    ))}
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--adm-text-faint)",
                      alignSelf: "center",
                    }}
                  >
                    pax (dari manifest Excel)
                  </span>
                </div>
              )}
            </div>
            <TicketsPanel
              tickets={currentTickets}
              upload={currentUpload}
              onRefresh={refreshDetail}
            />
          </>
        ))}

      {tab === "Baggage" &&
        (!selectedId ? (
          <div className="adm-alert adm-alert-info">
            Select a manifest from the Upload tab first.
          </div>
        ) : !detail ? (
          <div className="adm-loading">Loading…</div>
        ) : (
          <BaggagePanel
            upload={currentUpload}
            tickets={currentTickets}
            baggage={currentBaggage}
            onRefresh={refreshDetail}
          />
        ))}

      {tab === "Boats" && <BoatCrewPanel />}
    </div>
  );
}
