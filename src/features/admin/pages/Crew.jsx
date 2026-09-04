import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../ui/ToastContext.jsx";
import { useConfirm } from "../ui/ConfirmContext.jsx";
import {
  fetchCrew,
  createCrew,
  updateCrew,
  deleteCrew,
  getCrewQrPdfUrl,
  fetchAssignments,
  createAssignment,
  deleteAssignment,
  getCheckinByQr,
  recordCrewCheckin,
} from "../services/crewService.js";
import { api } from "../../../services/api.js";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Printer,
  Check,
  X,
  ScanLine,
  CalendarDays,
  Camera,
  CameraOff,
  RefreshCw,
  CheckCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Anchor,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "captain", label: "Captain", color: "#1800AD" },
  { value: "abk", label: "ABK", color: "#0078D4" },
  { value: "gro", label: "GRO", color: "#00A478" },
  { value: "staff", label: "Staff", color: "#646464" },
  { value: "other", label: "Other", color: "#967832" },
];

function roleLabel(r) {
  return ROLES.find((x) => x.value === r)?.label ?? r;
}
function roleColor(r) {
  return ROLES.find((x) => x.value === r)?.color ?? "#888";
}

let Html5Qrcode = null;

function playBeep(type = "success") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = type === "success" ? 880 : 300;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
}

// ── Crew Form Modal ───────────────────────────────────────────────────────────
function CrewFormModal({ crew, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: crew?.name ?? "",
    role: crew?.role ?? "abk",
    phone: crew?.phone ?? "",
    id_number: crew?.id_number ?? "",
    notes: crew?.notes ?? "",
    active: crew?.active ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (crew?.id) {
        await updateCrew(crew.id, form);
        toast.success("Crew diupdate.");
      } else {
        await createCrew(form);
        toast.success("Crew ditambahkan. QR permanent sudah digenerate.");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={styles.backdrop}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="adm-card"
        style={styles.modal}
      >
        <h3 style={{ margin: "0 0 20px" }}>
          {crew ? "Edit Crew" : "Tambah Crew"}
        </h3>

        <div className="adm-form-row">
          <div className="adm-field">
            <label>Nama *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nama lengkap"
            />
          </div>
          <div className="adm-field">
            <label>Role *</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-form-row">
          <div className="adm-field">
            <label>No. HP</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div className="adm-field">
            <label>NIK / KTP / Seaman Book</label>
            <input
              value={form.id_number}
              onChange={(e) => set("id_number", e.target.value)}
              placeholder="No. identitas"
            />
          </div>
        </div>

        <div className="adm-field">
          <label>Catatan</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {crew && (
          <div className="adm-field">
            <label>Status</label>
            <select
              value={form.active}
              onChange={(e) => set("active", parseInt(e.target.value))}
            >
              <option value={1}>Aktif</option>
              <option value={0}>Non-aktif</option>
            </select>
          </div>
        )}

        <div className="adm-form-actions">
          <button className="adm-btn adm-btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            className="adm-btn adm-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Menyimpan…" : crew ? "Update" : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({ crew, schedules, boats, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    schedule_id: "",
    boat_id: "",
    trip_date: new Date().toISOString().slice(0, 10),
    direction: "DEPARTURE",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-fill boat and date from schedule
  const handleScheduleChange = (sid) => {
    set("schedule_id", sid);
    if (!sid) return;
    const s = schedules.find((x) => String(x.id) === String(sid));
    if (s) {
      set("boat_id", String(s.boat_id ?? ""));
      set("trip_date", (s.date ?? "").slice(0, 10));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await createAssignment({
        crew_id: crew.id,
        schedule_id: form.schedule_id ? parseInt(form.schedule_id) : null,
        boat_id: form.boat_id ? parseInt(form.boat_id) : null,
        trip_date: form.trip_date,
        direction: form.direction,
        notes: form.notes,
      });
      toast.success(`${crew.name} di-assign.`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message || "Gagal assign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={styles.backdrop}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="adm-card"
        style={styles.modal}
      >
        <h3 style={{ margin: "0 0 4px" }}>Assign ke Schedule</h3>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 13,
            color: "var(--adm-text-muted)",
          }}
        >
          {crew.name} — {roleLabel(crew.role)}
        </p>

        <div className="adm-field">
          <label>Schedule (opsional)</label>
          <select
            value={form.schedule_id}
            onChange={(e) => handleScheduleChange(e.target.value)}
          >
            <option value="">— Pilih schedule —</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.type === "RETURN" ? "Return" : "Departure"} — {s.boat_name} —{" "}
                {(s.date ?? "").slice(0, 10)}
              </option>
            ))}
          </select>
        </div>

        <div className="adm-form-row">
          <div className="adm-field">
            <label>Tanggal Trip *</label>
            <input
              type="date"
              value={form.trip_date}
              onChange={(e) => set("trip_date", e.target.value)}
            />
          </div>
          <div className="adm-field">
            <label>Arah</label>
            <select
              value={form.direction}
              onChange={(e) => set("direction", e.target.value)}
            >
              <option value="DEPARTURE">Departure</option>
              <option value="RETURN">Return</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
        </div>

        <div className="adm-field">
          <label>Kapal</label>
          <select
            value={form.boat_id}
            onChange={(e) => set("boat_id", e.target.value)}
          >
            <option value="">— Pilih kapal —</option>
            {boats.map((b) => (
              <option key={b.id} value={b.id}>
                {b.boat_name}
              </option>
            ))}
          </select>
        </div>

        <div className="adm-field">
          <label>Catatan</label>
          <input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Opsional"
          />
        </div>

        <div className="adm-form-actions">
          <button className="adm-btn adm-btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            className="adm-btn adm-btn-primary"
            onClick={handleSave}
            disabled={saving || !form.trip_date}
          >
            {saving ? "Menyimpan…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Crew Check-in Result Card ─────────────────────────────────────────────────
function CrewCheckinResult({ data, onCheckin, onDismiss, processing }) {
  if (!data) return null;
  const { crew, today_assignments, checkins_today, already_checked_in } = data;

  return (
    <div
      className={`ci-result-card ${already_checked_in ? "ci-result-done" : "ci-result-active"}`}
      style={{ marginTop: 16 }}
    >
      {/* Crew header */}
      <div
        className="ci-scanned-passenger"
        style={{ borderLeft: `4px solid ${roleColor(crew.role)}` }}
      >
        <div
          className="ci-scanned-icon"
          style={{
            background: `${roleColor(crew.role)}20`,
            color: roleColor(crew.role),
          }}
        >
          {already_checked_in ? (
            <UserCheck size={26} />
          ) : (
            <ScanLine size={26} />
          )}
        </div>
        <div className="ci-scanned-info">
          <div
            className="ci-scanned-label"
            style={{ color: roleColor(crew.role) }}
          >
            {already_checked_in ? "✓ Sudah Check-In" : "Crew Ditemukan"}
          </div>
          <div className="ci-scanned-name">{crew.name}</div>
          <div className="ci-scanned-meta">
            <span
              className="ci-scanned-seat"
              style={{
                background: `${roleColor(crew.role)}15`,
                color: roleColor(crew.role),
              }}
            >
              {roleLabel(crew.role)}
            </span>
            {crew.phone && <span>{crew.phone}</span>}
          </div>
        </div>
        <button className="ci-result-dismiss" onClick={onDismiss}>
          <X size={15} />
        </button>
      </div>

      {/* Today assignments */}
      {today_assignments.length > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--adm-border)",
            fontSize: 13,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
              color: "var(--adm-text-muted)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Assignment Hari Ini
          </div>
          {today_assignments.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
              }}
            >
              <span>{a.boat_name ?? "—"}</span>
              <span style={{ color: "var(--adm-text-muted)" }}>
                {a.direction}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Check-in times */}
      {checkins_today.length > 0 && (
        <div
          style={{
            padding: "10px 20px",
            fontSize: 12,
            color: "var(--adm-text-muted)",
            borderBottom: "1px solid var(--adm-border)",
          }}
        >
          {checkins_today.map((c, i) => (
            <div key={i}>
              Check-in: {new Date(c.checked_in_at).toLocaleTimeString("id-ID")}
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {!already_checked_in ? (
        <button
          className="ci-checkin-btn"
          onClick={onCheckin}
          disabled={processing}
        >
          {processing ? (
            <>
              <RefreshCw size={14} className="ci-spin" /> Processing…
            </>
          ) : (
            <>
              <CheckCheck size={14} /> Check-In {crew.name}
            </>
          )}
        </button>
      ) : (
        <div className="ci-all-done">
          <CheckCheck size={14} /> Sudah check-in hari ini
        </div>
      )}
    </div>
  );
}

// ── Crew Calendar ─────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  captain: "#1800AD",
  abk: "#0078D4",
  gro: "#00A478",
  staff: "#646464",
  other: "#967832",
};
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function DayDetailModal({ date, assignments, onClose, onDeleteAssignment }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [replacing, setReplacing] = useState(null); // { assignment, crewList, selectedId, saving }
  const fmt = (v) =>
    v
      ? new Date(v).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const handleDelete = async (a) => {
    const ok = await confirm({
      title: `Hapus assignment ${a.crew_name}?`,
      message: `${a.crew_name} akan di-remove dari schedule tanggal ini.`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAssignment(a.id);
      toast.success(`Assignment ${a.crew_name} dihapus.`);
      onDeleteAssignment?.(a.id);
    } catch (e) {
      toast.error(e.message || "Gagal hapus assignment.");
    }
  };

  // Open replace panel: load crew with same role
  const handleStartReplace = async (a) => {
    try {
      const crewList = await fetchCrew(a.role);
      setReplacing({
        assignment: a,
        crewList: Array.isArray(crewList)
          ? crewList.filter((c) => c.id !== a.crew_id)
          : [],
        selectedId: "",
        saving: false,
      });
    } catch (e) {
      toast.error("Gagal memuat daftar crew.");
    }
  };

  const handleConfirmReplace = async () => {
    if (!replacing?.selectedId) {
      toast.error("Pilih crew pengganti dulu.");
      return;
    }
    setReplacing((r) => ({ ...r, saving: true }));
    try {
      const a = replacing.assignment;
      // Delete old assignment
      await deleteAssignment(a.id);
      // Create new assignment with same schedule/boat/trip_date/direction
      await createAssignment({
        crew_id: parseInt(replacing.selectedId),
        schedule_id: a.schedule_id ?? null,
        boat_id: a.boat_id ?? null,
        trip_date: a.trip_date ?? date,
        direction: a.direction ?? "DEPARTURE",
        notes: "Diganti via calendar",
      });
      const newCrew = replacing.crewList.find(
        (c) => c.id === parseInt(replacing.selectedId),
      );
      toast.success(
        `${a.crew_name} diganti dengan ${newCrew?.name ?? "crew baru"}.`,
      );
      onDeleteAssignment?.(a.id); // will trigger parent to refresh
      setReplacing(null);
    } catch (e) {
      toast.error(e.message || "Gagal mengganti crew.");
      setReplacing((r) => ({ ...r, saving: false }));
    }
  };

  // Group by direction then role
  const grouped = assignments.reduce((acc, a) => {
    const key = a.direction || "DEPARTURE";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <div onClick={onClose} style={styles.backdrop}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="adm-card"
        style={{ ...styles.modal, maxWidth: 520 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              <CalendarDays
                size={16}
                style={{
                  verticalAlign: "middle",
                  marginRight: 8,
                  color: "var(--adm-accent)",
                }}
              />
              {new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--adm-text-muted)",
              }}
            >
              {assignments.length} crew assigned
            </p>
          </div>
          <button
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        {/* Assignments per direction */}
        {Object.entries(grouped).map(([dir, items]) => (
          <div key={dir} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                color: dir === "RETURN" ? "#1800AD" : "#c96a00",
                padding: "4px 10px",
                background: dir === "RETURN" ? "#1800AD12" : "#F2881C12",
                borderRadius: 6,
                marginBottom: 8,
                display: "inline-block",
              }}
            >
              {dir === "RETURN" ? "🌙 Return" : "☀️ Departure"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((a) => {
                const color = ROLE_COLORS[a.role] ?? "#888";
                return (
                  <React.Fragment key={a.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "var(--adm-bg)",
                        border: `1px solid ${color}30`,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      {/* Role dot */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `${color}18`,
                          color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Anchor size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#222",
                          }}
                        >
                          {a.crew_name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--adm-text-muted)",
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginTop: 2,
                          }}
                        >
                          <span
                            style={{
                              background: `${color}15`,
                              color,
                              borderRadius: 4,
                              padding: "1px 6px",
                              fontWeight: 600,
                            }}
                          >
                            {roleLabel(a.role)}
                          </span>
                          {a.boat_name && <span>⛵ {a.boat_name}</span>}
                          {a.phone && <span>📱 {a.phone}</span>}
                        </div>
                      </div>
                      {/* Check-in badge */}
                      {a.checked_in ? (
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#2e7d32",
                              fontWeight: 700,
                            }}
                          >
                            ✓ CHECK-IN
                          </div>
                          <div style={{ fontSize: 11, color: "#2e7d32" }}>
                            {fmt(a.checked_in_at)}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{ fontSize: 11, color: "#aaa", flexShrink: 0 }}
                        >
                          Belum
                        </span>
                      )}
                      {/* Delete & Replace buttons */}
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartReplace(a);
                          }}
                          title="Ganti crew"
                          style={{ fontSize: 11 }}
                        >
                          ↔ Ganti
                        </button>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(a);
                          }}
                          title="Hapus assignment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Inline replace panel */}
                    {replacing?.assignment?.id === a.id && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "12px 14px",
                          background: "#fff8f0",
                          border: "1px solid #F2881C40",
                          borderRadius: 8,
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#c96a00",
                          }}
                        >
                          Ganti {a.crew_name} dengan:
                        </span>
                        <select
                          value={replacing.selectedId}
                          onChange={(e) =>
                            setReplacing((r) => ({
                              ...r,
                              selectedId: e.target.value,
                            }))
                          }
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            fontSize: 13,
                            flex: 1,
                            minWidth: 160,
                          }}
                          disabled={replacing.saving}
                        >
                          <option value="">— Pilih crew {a.role} —</option>
                          {replacing.crewList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-primary"
                          onClick={handleConfirmReplace}
                          disabled={replacing.saving || !replacing.selectedId}
                        >
                          {replacing.saving ? (
                            <RefreshCw size={13} className="ci-spin" />
                          ) : (
                            "Konfirmasi"
                          )}
                        </button>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-ghost"
                          onClick={() => setReplacing(null)}
                          disabled={replacing.saving}
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrewCalendar({ onDateClick }) {
  const toast = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [calData, setCalData] = useState(null);
  const [loading, setLoading] = useState(false);

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/admin/crew/assignments/calendar?month=${monthStr}`,
        { auth: true },
      );
      setCalData(res);
    } catch (e) {
      toast.error("Gagal memuat calendar.");
    } finally {
      setLoading(false);
    }
  }, [monthStr]); // eslint-disable-line

  useEffect(() => {
    load();
  }, [load]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);

  const byDate = calData?.by_date ?? {};
  const todayStr = now.toISOString().slice(0, 10);

  return (
    <div>
      {/* Month nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          className="adm-btn adm-btn-sm adm-btn-secondary"
          onClick={prevMonth}
        >
          <ChevronLeft size={14} />
        </button>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            minWidth: 180,
            textAlign: "center",
          }}
        >
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          className="adm-btn adm-btn-sm adm-btn-secondary"
          onClick={nextMonth}
        >
          <ChevronRight size={14} />
        </button>
        <button
          className="adm-btn adm-btn-sm adm-btn-ghost"
          onClick={load}
          disabled={loading}
          style={{ marginLeft: 4 }}
        >
          <RefreshCw size={13} className={loading ? "ci-spin" : ""} />
        </button>
        {calData && (
          <span
            style={{
              fontSize: 12,
              color: "var(--adm-text-muted)",
              marginLeft: 4,
            }}
          >
            {calData.total_assignments} assignment bulan ini
          </span>
        )}
      </div>

      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          marginBottom: 4,
        }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--adm-text-muted)",
              padding: "4px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayData = byDate[dateStr];
          const isToday = dateStr === todayStr;
          const hasCrew = !!dayData;
          const allIn = hasCrew && dayData.checked_in === dayData.total;
          const someIn = hasCrew && dayData.checked_in > 0 && !allIn;

          return (
            <div
              key={dateStr}
              onClick={() =>
                hasCrew && onDateClick(dateStr, dayData.assignments)
              }
              style={{
                minHeight: 72,
                borderRadius: 8,
                border: isToday
                  ? "2px solid var(--adm-accent)"
                  : hasCrew
                    ? "1px solid var(--adm-border-strong)"
                    : "1px solid var(--adm-border)",
                background: isToday
                  ? "#FFF8F0"
                  : hasCrew
                    ? "#fff"
                    : "var(--adm-bg)",
                cursor: hasCrew ? "pointer" : "default",
                padding: "6px 8px",
                transition: "box-shadow 0.15s, transform 0.1s",
                boxShadow: hasCrew ? "0 1px 4px rgba(0,0,0,.06)" : "none",
              }}
              onMouseEnter={(e) => {
                if (hasCrew) {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,.12)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = hasCrew
                  ? "0 1px 4px rgba(0,0,0,.06)"
                  : "none";
                e.currentTarget.style.transform = "none";
              }}
            >
              {/* Day number */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isToday ? 800 : hasCrew ? 700 : 400,
                  color: isToday
                    ? "var(--adm-accent)"
                    : hasCrew
                      ? "#222"
                      : "var(--adm-text-muted)",
                  marginBottom: 4,
                }}
              >
                {day}
                {isToday && (
                  <span
                    style={{
                      fontSize: 9,
                      marginLeft: 4,
                      background: "var(--adm-accent)",
                      color: "#fff",
                      borderRadius: 4,
                      padding: "1px 4px",
                    }}
                  >
                    Hari ini
                  </span>
                )}
              </div>

              {hasCrew && (
                <>
                  {/* Crew count + check-in status */}
                  <div
                    style={{
                      fontSize: 11,
                      color: allIn ? "#2e7d32" : someIn ? "#c96a00" : "#555",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {allIn ? "✓ " : someIn ? "◑ " : ""}
                    {dayData.total} crew
                    {dayData.checked_in > 0 && ` · ${dayData.checked_in} in`}
                  </div>
                  {/* Role dots */}
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {dayData.roles.map((role) => (
                      <span
                        key={role}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: ROLE_COLORS[role] ?? "#888",
                          display: "inline-block",
                          flexShrink: 0,
                          title: roleLabel(role),
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 16,
          flexWrap: "wrap",
          fontSize: 12,
          color: "var(--adm-text-muted)",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700 }}>Legend:</span>
        {Object.entries(ROLE_COLORS).map(([role, color]) => (
          <span
            key={role}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
              }}
            />
            {roleLabel(role)}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11 }}>✓</span> Semua check-in
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11 }}>◑</span> Sebagian check-in
        </span>
      </div>
    </div>
  );
}

// ── Main Crew Page ────────────────────────────────────────────────────────────
export default function Crew() {
  const toast = useToast();
  const confirm = useConfirm();

  const [tab, setTab] = useState("crew"); // crew | assign | checkin
  const [crewList, setCrewList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [boats, setBoats] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [editCrew, setEditCrew] = useState(null); // crew obj or {} for new
  const [assignCrew, setAssignCrew] = useState(null); // crew obj

  // Assign date filter
  const [assignDate, setAssignDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // Day detail modal state
  const [dayDetail, setDayDetail] = useState(null); // { date, assignments }
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanSearching, setScanSearching] = useState(false);
  const [scanProcessing, setScanProcessing] = useState(false);
  const html5QrRef = useRef(null);
  const lastCodeRef = useRef(null);
  const fetchAndCheckinRef = useRef(null);
  const DEBOUNCE_MS = 3000;

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadCrew = useCallback(async () => {
    try {
      const data = await fetchCrew(roleFilter || null);
      setCrewList(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Gagal memuat data crew.");
    }
  }, [roleFilter]); // eslint-disable-line

  const loadSchedules = useCallback(async () => {
    try {
      const [dep, ret] = await Promise.all([
        api.get("/api/schedules/departures"),
        api.get("/api/schedules/returns"),
      ]);
      const all = [
        ...(Array.isArray(dep) ? dep : []).map((s) => ({
          ...s,
          type: "DEPARTURE",
        })),
        ...(Array.isArray(ret) ? ret : []).map((s) => ({
          ...s,
          type: "RETURN",
        })),
      ].sort((a, b) => new Date(a.date) - new Date(b.date));
      setSchedules(all);
    } catch (_) {}
  }, []);

  const loadBoats = useCallback(async () => {
    try {
      const data = await api.get("/api/admin/boats", { auth: true });
      setBoats(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, []);

  const loadAssignments = useCallback(async () => {
    try {
      const data = await fetchAssignments({ date: assignDate });
      setAssignments(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, [assignDate]);

  useEffect(() => {
    Promise.all([loadCrew(), loadSchedules(), loadBoats()]).finally(() =>
      setLoading(false),
    );
  }, []); // eslint-disable-line

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);
  useEffect(() => {
    if (tab === "assign") loadAssignments();
  }, [tab, loadAssignments]);

  // ── QR scanner ────────────────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    if (html5QrRef.current) return;
    if (!Html5Qrcode) {
      const mod = await import("html5-qrcode");
      Html5Qrcode = mod.Html5Qrcode;
    }
    try {
      const qr = new Html5Qrcode("crew-qr-reader");
      html5QrRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 200, height: 200 } },
        (text) => {
          const now = Date.now();
          if (
            lastCodeRef.current?.code === text &&
            now - lastCodeRef.current.ts < DEBOUNCE_MS
          )
            return;
          lastCodeRef.current = { code: text, ts: now };
          playBeep("success");
          fetchAndCheckinRef.current?.(text);
        },
        () => {},
      );
      setScannerReady(true);
    } catch (err) {
      toast.error("Kamera tidak bisa diakses.");
      html5QrRef.current = null;
      setScannerActive(false);
    }
  }, []); // eslint-disable-line

  const stopScanner = useCallback(async () => {
    setScannerReady(false);
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (_) {}
      html5QrRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (scannerActive) startScanner();
    else stopScanner();
    return () => {
      stopScanner();
    };
  }, [scannerActive]); // eslint-disable-line

  const handleScanQr = async (qr) => {
    setScanSearching(true);
    setScanResult(null);
    try {
      const data = await getCheckinByQr(qr);
      setScanResult({ ...data, _scannedQr: qr });
    } catch (e) {
      playBeep("error");
      toast.error(e.message || "QR tidak dikenali.");
    } finally {
      setScanSearching(false);
    }
  };

  fetchAndCheckinRef.current = handleScanQr;

  const handleCrewCheckin = async () => {
    if (!scanResult?._scannedQr) return;
    setScanProcessing(true);
    try {
      await recordCrewCheckin({ qr_code: scanResult._scannedQr });
      toast.success(`✓ ${scanResult.crew.name} checked in`);
      // Refresh result
      const updated = await getCheckinByQr(scanResult._scannedQr);
      setScanResult({ ...updated, _scannedQr: scanResult._scannedQr });
      loadCrew();
    } catch (e) {
      toast.error(e.message || "Check-in gagal.");
    } finally {
      setScanProcessing(false);
    }
  };

  // ── Delete crew ───────────────────────────────────────────────────────────
  const handleDeleteCrew = async (c) => {
    const ok = await confirm({
      title: `Hapus ${c.name}?`,
      message: "Semua assignment juga akan dihapus.",
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCrew(c.id);
      toast.success("Crew dihapus.");
      loadCrew();
    } catch (e) {
      toast.error(e.message || "Gagal menghapus.");
    }
  };

  // ── Delete assignment ──────────────────────────────────────────────────────
  const handleDeleteAssignment = async (a) => {
    const ok = await confirm({
      title: "Hapus assignment?",
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAssignment(a.id);
      toast.success("Assignment dihapus.");
      loadAssignments();
    } catch (e) {
      toast.error(e.message || "Gagal.");
    }
  };

  if (loading) return <div className="adm-loading">Loading crew data…</div>;

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={26} strokeWidth={1.8} /> Crew Management
          </h1>
          <p
            style={{ margin: 0, color: "var(--adm-text-muted)", fontSize: 14 }}
          >
            Data captain, ABK, GRO, dan staff dengan QR ID permanent.
          </p>
        </div>
        {tab === "crew" && (
          <button
            className="adm-btn adm-btn-primary"
            onClick={() => setEditCrew({})}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Tambah Crew
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="adm-tabs" style={{ marginBottom: 24 }}>
        {[
          { key: "crew", label: "Crew List", icon: <Users size={14} /> },
          {
            key: "assign",
            label: "Assignments",
            icon: <CalendarDays size={14} />,
          },
          {
            key: "checkin",
            label: "QR Check-in",
            icon: <ScanLine size={14} />,
          },
        ].map((t) => (
          <button
            key={t.key}
            className={`adm-tab ${tab === t.key ? "adm-tab-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Crew List ── */}
      {tab === "crew" && (
        <>
          {/* Role filter */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {[{ value: "", label: "Semua" }, ...ROLES].map((r) => (
              <button
                key={r.value}
                className={`adm-btn adm-btn-sm ${roleFilter === r.value ? "adm-btn-primary" : "adm-btn-secondary"}`}
                onClick={() => setRoleFilter(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama</th>
                  <th>Role</th>
                  <th>HP</th>
                  <th>NIK / ID</th>
                  <th>QR Code</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {crewList.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="adm-empty"
                      style={{ textAlign: "center", padding: 32 }}
                    >
                      Belum ada crew.
                    </td>
                  </tr>
                )}
                {crewList.map((c) => (
                  <tr key={c.id} style={{ opacity: c.active ? 1 : 0.5 }}>
                    <td
                      style={{
                        color: "var(--adm-text-faint)",
                        fontFamily: "monospace",
                        fontSize: 12,
                      }}
                    >
                      #{String(c.id).padStart(4, "0")}
                    </td>
                    <td className="adm-cell-primary">{c.name}</td>
                    <td>
                      <span
                        className="adm-badge"
                        style={{
                          background: `${roleColor(c.role)}18`,
                          color: roleColor(c.role),
                        }}
                      >
                        {roleLabel(c.role)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.phone || "—"}</td>
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>
                      {c.id_number || "—"}
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: 11,
                          background: "var(--adm-bg)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {c.qr_code}
                      </code>
                    </td>
                    <td>
                      <span
                        className={`adm-badge ${c.active ? "adm-badge-success" : "adm-badge-neutral"}`}
                      >
                        {c.active ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-secondary"
                          onClick={() =>
                            window.open(getCrewQrPdfUrl(c.id), "_blank")
                          }
                          title="Print QR ID Card"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-secondary"
                          onClick={() => setAssignCrew(c)}
                          title="Assign ke schedule"
                        >
                          <CalendarDays size={13} />
                        </button>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-secondary"
                          onClick={() => setEditCrew(c)}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-danger"
                          onClick={() => handleDeleteCrew(c)}
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB: Assignments ── */}
      {tab === "assign" && (
        <div className="adm-card" style={{ padding: 24 }}>
          <CrewCalendar
            onDateClick={(date, assignments) =>
              setDayDetail({ date, assignments })
            }
          />
          <p
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "var(--adm-text-muted)",
            }}
          >
            Klik tanggal yang ada crew untuk melihat detail. Untuk menambah
            assignment, pilih crew di tab "Crew List" lalu klik icon{" "}
            <CalendarDays size={12} style={{ verticalAlign: "middle" }} />.
          </p>
        </div>
      )}

      {/* ── TAB: QR Check-in ── */}
      {tab === "checkin" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "400px 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Scanner card */}
          <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: "1px solid var(--adm-border)",
                background: "var(--adm-bg)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14 }}>
                <Camera
                  size={14}
                  style={{ verticalAlign: "middle", marginRight: 6 }}
                />{" "}
                Crew QR Scanner
              </h3>
              <button
                className={`adm-btn adm-btn-sm ${scannerActive ? "adm-btn-danger" : "adm-btn-primary"}`}
                onClick={() => setScannerActive((v) => !v)}
              >
                {scannerActive ? (
                  <>
                    <CameraOff size={13} style={{ marginRight: 4 }} /> Stop
                  </>
                ) : (
                  <>
                    <Camera size={13} style={{ marginRight: 4 }} /> Start
                  </>
                )}
              </button>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                background: "#000",
              }}
            >
              <div
                id="crew-qr-reader"
                style={{ width: "100%", height: "100%" }}
              />
              {!scannerActive && (
                <div
                  onClick={() => setScannerActive(true)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    background: "linear-gradient(135deg,#1e1e1e,#2a2a2a)",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                  }}
                >
                  <ScanLine size={48} strokeWidth={1.2} />
                  <span style={{ fontSize: 13 }}>Tap untuk mulai kamera</span>
                </div>
              )}
              {scannerActive && scannerReady && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 200,
                      height: 200,
                      border: "3px solid rgba(34,197,94,0.8)",
                      borderRadius: 12,
                      boxShadow: "0 0 20px rgba(34,197,94,0.5)",
                    }}
                  />
                  {scanSearching && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        background: "rgba(0,0,0,0.8)",
                        color: "#fff",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <RefreshCw size={14} className="ci-spin" /> Mencari…
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderTop: "1px solid var(--adm-border)",
                fontSize: 12,
                color: "var(--adm-text-muted)",
                background: "var(--adm-bg)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background:
                    scannerActive && scannerReady ? "#22c55e" : "#9ca3af",
                  boxShadow:
                    scannerActive && scannerReady
                      ? "0 0 8px rgba(34,197,94,0.6)"
                      : "none",
                }}
              />
              {scannerActive && scannerReady
                ? "Kamera aktif — scan QR ID crew"
                : scannerActive
                  ? "Memulai kamera…"
                  : "Kamera mati"}
            </div>

            {/* Manual QR input */}
            <div style={{ padding: "14px 18px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "var(--adm-text-muted)",
                  marginBottom: 8,
                }}
              >
                Input Manual
              </div>
              <form
                style={{ display: "flex", gap: 8 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = e.target.qr.value.trim();
                  if (v) {
                    handleScanQr(v);
                    e.target.reset();
                  }
                }}
              >
                <input
                  name="qr"
                  placeholder="CREW_xxxxxxxxxxxxxxxx"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid var(--adm-border-strong)",
                    borderRadius: "var(--adm-radius-sm)",
                    fontSize: 13,
                  }}
                />
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary adm-btn-sm"
                  disabled={scanSearching}
                >
                  {scanSearching ? (
                    <RefreshCw size={13} className="ci-spin" />
                  ) : (
                    "Cari"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Result */}
          <div>
            {scanResult ? (
              <CrewCheckinResult
                data={scanResult}
                onCheckin={handleCrewCheckin}
                onDismiss={() => setScanResult(null)}
                processing={scanProcessing}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 60,
                  textAlign: "center",
                  border: "2px dashed var(--adm-border-strong)",
                  borderRadius: "var(--adm-radius-lg)",
                  color: "var(--adm-text-faint)",
                }}
              >
                <ScanLine size={40} strokeWidth={1.2} />
                <p style={{ margin: "12px 0 4px", fontSize: 14 }}>
                  Scan QR ID crew
                </p>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                  QR bersifat permanent — tidak berubah antar schedule
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {editCrew !== null && (
        <CrewFormModal
          crew={editCrew?.id ? editCrew : null}
          onClose={() => setEditCrew(null)}
          onSaved={loadCrew}
        />
      )}

      {assignCrew && (
        <AssignModal
          crew={assignCrew}
          schedules={schedules}
          boats={boats}
          onClose={() => setAssignCrew(null)}
          onSaved={() => {
            loadCrew();
            if (tab === "assign") loadAssignments();
          }}
        />
      )}

      {dayDetail && (
        <DayDetailModal
          date={dayDetail.date}
          assignments={dayDetail.assignments}
          onClose={() => setDayDetail(null)}
          onDeleteAssignment={(deletedId) => {
            setDayDetail((prev) =>
              prev
                ? {
                    ...prev,
                    assignments: prev.assignments.filter(
                      (a) => a.id !== deletedId,
                    ),
                  }
                : null,
            );
          }}
        />
      )}
    </div>
  );
}

// ── Shared inline styles ──────────────────────────────────────────────────────
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "90vh",
    overflow: "auto",
    padding: 28,
  },
};
