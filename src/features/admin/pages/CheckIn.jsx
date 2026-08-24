import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../ui/ToastContext.jsx";
import { api } from "../../../services/api.js";
import {
  Camera,
  CameraOff,
  Search,
  CheckCheck,
  X,
  Check,
  ScanLine,
  Users,
  RefreshCw,
  UserCheck,
  Anchor,
} from "lucide-react";
import "./CheckIn.css";

let Html5Qrcode = null;

const ROLE_COLORS = {
  captain: "#1800AD",
  abk: "#0064C8",
  gro: "#009678",
  staff: "#505050",
  other: "#826428",
};

function roleLabel(r) {
  return (
    {
      captain: "Captain",
      abk: "ABK",
      gro: "GRO",
      staff: "Staff",
      other: "Other",
    }[r] ?? r
  );
}

function fmtTime(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

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

// ── Crew Result Card ──────────────────────────────────────────────────────────
function CrewResultCard({ data, onDismiss }) {
  const {
    crew,
    today_assignments,
    checkins_today,
    already_checked_in,
    just_checked_in,
    checked_in_at,
  } = data;
  const color = ROLE_COLORS[crew.role] ?? "#888";

  return (
    <div
      className={`ci-result-card ${already_checked_in && !just_checked_in ? "ci-result-done" : "ci-result-active"}`}
    >
      <div
        className="ci-scanned-passenger"
        style={{ borderLeft: `4px solid ${color}`, background: `${color}10` }}
      >
        <div
          className="ci-scanned-icon"
          style={{ background: `${color}20`, color }}
        >
          {already_checked_in && !just_checked_in ? (
            <UserCheck size={26} />
          ) : (
            <Anchor size={26} />
          )}
        </div>
        <div className="ci-scanned-info">
          <div className="ci-scanned-label" style={{ color }}>
            {just_checked_in
              ? "✓ Crew Check-In Berhasil"
              : already_checked_in
                ? "Sudah Check-In Sebelumnya"
                : "Crew Ditemukan"}
          </div>
          <div className="ci-scanned-name">{crew.name}</div>
          <div className="ci-scanned-meta">
            <span
              className="ci-scanned-seat"
              style={{ background: `${color}15`, color }}
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

      <div
        style={{
          padding: "10px 20px",
          background: just_checked_in ? "#e8f5e9" : "#f5f5f5",
          borderBottom: "1px solid var(--adm-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
        }}
      >
        <Check size={14} color={just_checked_in ? "#2e7d32" : "#888"} />
        <span style={{ color: just_checked_in ? "#2e7d32" : "#666" }}>
          {just_checked_in ? "Check-in pada " : "Sudah check-in: "}
          <strong>{fmtTime(checked_in_at)}</strong>
        </span>
      </div>

      {today_assignments.length > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--adm-border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--adm-text-muted)",
              marginBottom: 8,
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
                fontSize: 13,
                padding: "3px 0",
              }}
            >
              <span style={{ fontWeight: 600 }}>{a.boat_name ?? "—"}</span>
              <span style={{ color: "var(--adm-text-muted)" }}>
                {a.direction}
              </span>
            </div>
          ))}
        </div>
      )}

      {checkins_today.length > 1 && (
        <div
          style={{
            padding: "10px 20px",
            fontSize: 12,
            color: "var(--adm-text-muted)",
          }}
        >
          {checkins_today.length} kali scan hari ini · Pertama:{" "}
          {fmtTime(checkins_today[checkins_today.length - 1]?.checked_in_at)}
        </div>
      )}

      {just_checked_in ? (
        <div
          className="ci-all-done"
          style={{ background: "#e8f5e9", color: "#2e7d32" }}
        >
          <CheckCheck size={14} /> {crew.name} berhasil check-in
        </div>
      ) : (
        <div className="ci-all-done">
          <CheckCheck size={14} /> {crew.name} sudah check-in hari ini
        </div>
      )}
    </div>
  );
}

// ── Passenger Result Card ─────────────────────────────────────────────────────
function ResultCard({
  result,
  scannedId,
  onCheckinAll,
  onDismiss,
  processing,
}) {
  if (!result) return null;

  const { group_name, tickets, boat_name, trip_date, direction } = result;
  const scanned = tickets.find((t) => Number(t.id) === scannedId);
  const total = tickets.length;
  const checkedIn = tickets.filter((t) => parseInt(t.checked_in) === 1).length;
  const cancelled = tickets.filter((t) => parseInt(t.cancelled) === 1).length;
  const pending = total - checkedIn - cancelled;
  const allDone = pending === 0;

  const isIn = (t) => parseInt(t.checked_in) === 1;
  const isCan = (t) => parseInt(t.cancelled) === 1;

  return (
    <div
      className={`ci-result-card ${allDone ? "ci-result-done" : "ci-result-active"}`}
    >
      {scanned && (
        <div
          className={`ci-scanned-passenger ${isIn(scanned) ? "ci-scanned-in" : isCan(scanned) ? "ci-scanned-cancelled" : "ci-scanned-pending"}`}
        >
          <div className="ci-scanned-icon">
            {isIn(scanned) ? (
              <UserCheck size={26} />
            ) : isCan(scanned) ? (
              <X size={26} />
            ) : (
              <ScanLine size={26} />
            )}
          </div>
          <div className="ci-scanned-info">
            <div className="ci-scanned-label">
              {isIn(scanned)
                ? "✓ Sudah Check-In"
                : isCan(scanned)
                  ? "✕ Tiket Dibatalkan"
                  : "Tiket Ditemukan"}
            </div>
            <div className="ci-scanned-name">{scanned.passenger_name}</div>
            <div className="ci-scanned-meta">
              {scanned.seat_number && (
                <span className="ci-scanned-seat">{scanned.seat_number}</span>
              )}
              <span>
                {boat_name} · {direction === "RETURN" ? "Return" : "Departure"}
              </span>
            </div>
          </div>
          <button className="ci-result-dismiss" onClick={onDismiss}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="ci-group-header">
        <Users size={14} />
        <span>
          Grup: <strong>{group_name}</strong>
        </span>
        <span className="ci-group-date">{fmtDate(trip_date)}</span>
      </div>

      <div className="ci-result-stats">
        <div className="ci-stat">
          <span className="ci-stat-val">{total}</span>
          <span className="ci-stat-lbl">Total</span>
        </div>
        <div className="ci-stat ci-stat-green">
          <span className="ci-stat-val">{checkedIn}</span>
          <span className="ci-stat-lbl">Checked In</span>
        </div>
        <div className="ci-stat ci-stat-orange">
          <span className="ci-stat-val">{pending}</span>
          <span className="ci-stat-lbl">Pending</span>
        </div>
        <div className="ci-stat ci-stat-red">
          <span className="ci-stat-val">{cancelled}</span>
          <span className="ci-stat-lbl">Cancelled</span>
        </div>
      </div>

      <div className="ci-result-tickets">
        {tickets.map((t) => {
          const scannedRow = Number(t.id) === scannedId;
          return (
            <div
              key={t.id}
              className={`ci-ticket-row ${isIn(t) ? "ci-ticket-in" : isCan(t) ? "ci-ticket-cancelled" : "ci-ticket-pending"} ${scannedRow ? "ci-ticket-scanned" : ""}`}
            >
              <span className="ci-ticket-dot">
                {isIn(t) ? (
                  <Check size={11} />
                ) : isCan(t) ? (
                  <X size={11} />
                ) : (
                  "·"
                )}
              </span>
              <span className="ci-ticket-name">
                {t.passenger_name}
                {scannedRow && <span className="ci-ticket-this"> ← ini</span>}
              </span>
              {t.seat_number && (
                <span className="ci-ticket-seat">{t.seat_number}</span>
              )}
              <span className="ci-ticket-status">
                {isIn(t) ? "In" : isCan(t) ? "Batal" : "Pending"}
              </span>
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="ci-all-done">
          <CheckCheck size={15} /> Semua penumpang sudah check-in
        </div>
      ) : (
        <button
          className="ci-checkin-btn"
          onClick={onCheckinAll}
          disabled={processing}
        >
          {processing ? (
            <>
              <RefreshCw size={14} className="ci-spin" /> Processing…
            </>
          ) : (
            <>
              <CheckCheck size={14} /> Check-In Semua yang Pending ({pending}{" "}
              orang)
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main CheckIn ──────────────────────────────────────────────────────────────
export default function CheckIn() {
  const toast = useToast();

  const [scannerActive, setScannerActive] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [result, setResult] = useState(null); // passenger
  const [crewResult, setCrewResult] = useState(null); // crew
  const [scannedId, setScannedId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lastCode, setLastCode] = useState("");
  const [scanLog, setScanLog] = useState([]);
  const [manualCode, setManualCode] = useState("");
  const [searching, setSearching] = useState(false);
  // hwMode = dedicated hardware-scanner mode: no camera, input always focused
  const [hwMode, setHwMode] = useState(false);

  const html5QrRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const lastCodeRef = useRef(null);
  const fetchAndCheckinRef = useRef(null);
  const hwInputRef = useRef(null);
  const DEBOUNCE_MS = 3000;

  // ── Keep HW input always focused when hwMode is on ──────────────────────
  useEffect(() => {
    if (!hwMode) return;
    const focus = () => {
      if (hwInputRef.current && document.activeElement !== hwInputRef.current) {
        hwInputRef.current.focus();
      }
    };
    focus();
    document.addEventListener("click", focus);
    const iv = setInterval(focus, 500);
    return () => {
      document.removeEventListener("click", focus);
      clearInterval(iv);
    };
  }, [hwMode]);

  // ── Scanner lifecycle ───────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    if (html5QrRef.current) return;
    if (!Html5Qrcode) {
      const mod = await import("html5-qrcode");
      Html5Qrcode = mod.Html5Qrcode;
    }
    try {
      const qr = new Html5Qrcode("ci-qr-reader");
      html5QrRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 220, height: 220 } },
        (text) => {
          const now = Date.now();
          if (
            lastCodeRef.current?.code === text &&
            now - lastCodeRef.current.ts < DEBOUNCE_MS
          )
            return;
          lastCodeRef.current = { code: text, ts: now };
          playBeep("success");
          fetchAndCheckinRef.current?.(text, true);
        },
        () => {},
      );
      setScannerReady(true);
    } catch (err) {
      console.error(err);
      toast.error("Kamera tidak bisa diakses. Gunakan input manual.");
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

  // ── Unified fetch + auto check-in ──────────────────────────────────────
  const fetchAndCheckin = async (code, autoCheckin = true) => {
    setSearching(true);
    setResult(null);
    setCrewResult(null);
    setScannedId(null);
    clearDismissTimer();
    setLastCode(code);

    try {
      const data = await api.get(
        `/api/admin/manifest/group-by-code/${encodeURIComponent(code)}`,
        { auth: true },
      );

      // ── Crew QR ──
      if (data.type === "crew") {
        setCrewResult(data);
        setScanLog((prev) => [
          {
            id: Date.now(),
            type: "crew",
            name: data.crew.name,
            role: data.crew.role,
            alreadyIn: data.already_checked_in,
            ts: new Date(),
          },
          ...prev.slice(0, 29),
        ]);

        if (data.just_checked_in) {
          toast.success(
            `✓ ${data.crew.name} (${roleLabel(data.crew.role)}) checked in`,
          );
        } else {
          toast.info(`${data.crew.name} sudah check-in sebelumnya`);
        }
        dismissTimerRef.current = setTimeout(() => setCrewResult(null), 6000);
        return;
      }

      // ── Passenger QR ──
      const sid = data.scanned_ticket_id
        ? Number(data.scanned_ticket_id)
        : null;
      setScannedId(sid);

      if (autoCheckin && sid) {
        const ticket = data.tickets.find((t) => Number(t.id) === sid);
        if (
          ticket &&
          parseInt(ticket.checked_in) !== 1 &&
          parseInt(ticket.cancelled) !== 1
        ) {
          await api.post(
            "/api/admin/manifest/checkin-bulk",
            { ticket_ids: [sid] },
            { auth: true },
          );
          data.tickets = data.tickets.map((t) =>
            Number(t.id) === sid ? { ...t, checked_in: 1 } : t,
          );
          setScanLog((prev) => [
            {
              id: Date.now(),
              type: "passenger",
              name: ticket.passenger_name,
              group: data.group_name,
              boat: data.boat_name,
              seat: ticket.seat_number,
              ts: new Date(),
            },
            ...prev.slice(0, 29),
          ]);
          toast.success(`✓ ${ticket.passenger_name} checked in`);
        } else if (ticket && parseInt(ticket.checked_in) === 1) {
          toast.info(`${ticket.passenger_name} sudah check-in sebelumnya`);
        } else if (!ticket && sid) {
          await api.post(
            "/api/admin/manifest/checkin-bulk",
            { ticket_ids: [sid] },
            { auth: true },
          );
          toast.success("✓ Penumpang checked in");
        }
      }

      setResult(data);
      const pending = data.tickets.filter(
        (t) => parseInt(t.checked_in) !== 1 && parseInt(t.cancelled) !== 1,
      ).length;
      dismissTimerRef.current = setTimeout(
        () => setResult(null),
        pending === 0 ? 5000 : 8000,
      );
    } catch (e) {
      playBeep("error");
      toast.error(e.message || "QR tidak dikenali.");
    } finally {
      setSearching(false);
    }
  };

  fetchAndCheckinRef.current = fetchAndCheckin;

  // ── Check-in all pending ────────────────────────────────────────────────
  const handleCheckinAll = async () => {
    if (!result) return;
    const pendingIds = result.tickets
      .filter(
        (t) => parseInt(t.checked_in) !== 1 && parseInt(t.cancelled) !== 1,
      )
      .map((t) => t.id);
    if (!pendingIds.length) return;
    setProcessing(true);
    try {
      await api.post(
        "/api/admin/manifest/checkin-bulk",
        { ticket_ids: pendingIds },
        { auth: true },
      );
      playBeep("success");
      toast.success(`✓ ${pendingIds.length} penumpang checked in`);
      const updated = await api.get(
        `/api/admin/manifest/group-by-code/${encodeURIComponent(lastCode || result.group_name)}`,
        { auth: true },
      );
      setResult(updated);
      clearDismissTimer();
      dismissTimerRef.current = setTimeout(() => setResult(null), 5000);
    } catch (e) {
      playBeep("error");
      toast.error(e.message || "Check-in gagal.");
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    // Manual form submit = no auto-checkin (just lookup)
    // Hardware scanner uses onKeyDown Enter above with autoCheckin=true
    fetchAndCheckin(manualCode.trim(), false);
    setManualCode("");
  };

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  useEffect(() => () => clearDismissTimer(), []);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="ci-page">
      <div className="adm-page-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ScanLine size={26} strokeWidth={1.8} /> Check-In Scanner
          </h1>
          <p
            style={{ margin: 0, color: "var(--adm-text-muted)", fontSize: 14 }}
          >
            Scan QR boarding pass penumpang <strong>atau</strong> QR ID crew —
            otomatis check-in
          </p>
        </div>
        {/* Mode toggle: camera vs hardware scanner (PDA) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className={`adm-btn adm-btn-sm ${!hwMode ? "adm-btn-primary" : "adm-btn-secondary"}`}
            onClick={() => {
              setHwMode(false);
            }}
          >
            <Camera size={13} style={{ marginRight: 4 }} /> Kamera
          </button>
          <button
            className={`adm-btn adm-btn-sm ${hwMode ? "adm-btn-primary" : "adm-btn-secondary"}`}
            onClick={() => {
              setHwMode(true);
              setScannerActive(false);
            }}
          >
            <Search size={13} style={{ marginRight: 4 }} /> PDA Scanner
          </button>
        </div>
      </div>

      {/* ── Hardware Scanner Mode (CASHCOW PDA / HID scanner) ── */}
      {hwMode && (
        <div
          style={{
            marginBottom: 24,
            padding: "20px 24px",
            border: "2px solid var(--adm-accent)",
            borderRadius: "var(--adm-radius-lg)",
            background: "linear-gradient(135deg, #fff8f0, #ffffff)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px rgba(34,197,94,.7)",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Mode PDA Scanner — Siap Scan
            </span>
          </div>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              color: "var(--adm-text-muted)",
            }}
          >
            Input terfokus otomatis. Arahkan scanner ke QR boarding pass atau QR
            ID crew, tekan trigger — langsung check-in.
          </p>
          <div style={{ position: "relative" }}>
            <input
              ref={hwInputRef}
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualCode.trim() && !searching) {
                  e.preventDefault();
                  const code = manualCode.trim();
                  setManualCode("");
                  fetchAndCheckin(code, true);
                }
              }}
              placeholder="← Fokus di sini. Arahkan scanner dan tekan trigger…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              disabled={searching}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "2px solid var(--adm-accent)",
                borderRadius: "var(--adm-radius-sm)",
                background: searching ? "var(--adm-bg)" : "#ffffff",
                outline: "none",
                boxShadow: "0 0 0 4px rgba(242,136,28,.12)",
              }}
            />
            {searching && (
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--adm-accent)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={14} className="ci-spin" /> Processing…
              </div>
            )}
          </div>
          {manualCode && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: "var(--adm-text-muted)",
              }}
            >
              Kode: <code>{manualCode}</code> — tekan Enter atau trigger untuk
              proses
            </p>
          )}
        </div>
      )}

      <div className="ci-layout">
        {/* ── Scanner column ── */}
        <div className="ci-scanner-col">
          <div className="adm-card ci-scanner-card">
            <div className="ci-scanner-header">
              <h3 style={{ margin: 0 }}>
                <Camera
                  size={15}
                  style={{ verticalAlign: "middle", marginRight: 6 }}
                />
                QR Scanner
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

            <div className="ci-scanner-viewport">
              <div id="ci-qr-reader" className="ci-qr-reader" />
              {!scannerActive && (
                <div
                  className="ci-scanner-idle"
                  onClick={() => setScannerActive(true)}
                >
                  <ScanLine size={48} strokeWidth={1.2} />
                  <span>Tap untuk mulai kamera</span>
                </div>
              )}
              {scannerActive && scannerReady && (
                <div className="ci-scanner-overlay">
                  <div className="ci-scan-corners" />
                  {searching && (
                    <div className="ci-scanner-searching">
                      <RefreshCw size={16} className="ci-spin" /> Checking…
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ci-scanner-status">
              <span
                className={`ci-status-dot ${scannerActive && scannerReady ? "ci-dot-green" : "ci-dot-gray"}`}
              />
              {scannerActive && scannerReady
                ? "Aktif — scan boarding pass atau QR ID crew"
                : scannerActive
                  ? "Memulai kamera…"
                  : "Kamera mati"}
            </div>

            <div className="ci-manual">
              <div className="ci-manual-label">
                <Search size={13} /> Hardware scanner / input manual
              </div>
              <form className="ci-manual-form" onSubmit={handleManualSearch}>
                <input
                  type="text"
                  placeholder="Arahkan scanner atau ketik kode…"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    // Hardware scanners (HID mode) emit Enter after the code —
                    // auto-submit without needing to click the button
                    if (e.key === "Enter" && manualCode.trim() && !searching) {
                      e.preventDefault();
                      fetchAndCheckin(manualCode.trim(), true);
                      setManualCode("");
                    }
                  }}
                  disabled={searching}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary adm-btn-sm"
                  disabled={searching || !manualCode.trim()}
                >
                  {searching ? (
                    <RefreshCw size={13} className="ci-spin" />
                  ) : (
                    <Search size={13} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Result column ── */}
        <div className="ci-result-col">
          {crewResult ? (
            <CrewResultCard
              data={crewResult}
              onDismiss={() => {
                clearDismissTimer();
                setCrewResult(null);
              }}
            />
          ) : result ? (
            <ResultCard
              result={result}
              scannedId={scannedId}
              onCheckinAll={handleCheckinAll}
              onDismiss={() => {
                clearDismissTimer();
                setResult(null);
              }}
              processing={processing}
            />
          ) : (
            <div className="ci-waiting">
              <ScanLine size={40} strokeWidth={1.2} />
              <p>Scan boarding pass atau QR ID crew</p>
              <p style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>
                Satu scanner untuk penumpang &amp; crew
              </p>
            </div>
          )}

          {/* Scan log */}
          {scanLog.length > 0 && (
            <div className="adm-card ci-log">
              <h4 className="ci-log-title">
                <CheckCheck size={14} /> Baru Saja Check-In
              </h4>
              <div className="ci-log-list">
                {scanLog.map((entry) => (
                  <div key={entry.id} className="ci-log-row">
                    <div
                      className="ci-log-icon"
                      style={
                        entry.type === "crew"
                          ? {
                              background: `${ROLE_COLORS[entry.role] ?? "#888"}20`,
                              color: ROLE_COLORS[entry.role] ?? "#888",
                            }
                          : undefined
                      }
                    >
                      {entry.type === "crew" ? (
                        <Anchor size={12} />
                      ) : (
                        <Check size={12} />
                      )}
                    </div>
                    <div className="ci-log-info">
                      <div className="ci-log-name">
                        {entry.name}
                        {entry.type === "crew" && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              color: ROLE_COLORS[entry.role] ?? "#888",
                              textTransform: "uppercase",
                            }}
                          >
                            {roleLabel(entry.role)}
                          </span>
                        )}
                      </div>
                      <div className="ci-log-sub">
                        {entry.type === "crew"
                          ? entry.alreadyIn
                            ? "Sudah check-in sebelumnya"
                            : "Check-in berhasil"
                          : `${entry.group}${entry.seat ? ` · Kursi ${entry.seat}` : ""} · ${entry.boat}`}
                      </div>
                    </div>
                    <div className="ci-log-time">{fmtTime(entry.ts)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
