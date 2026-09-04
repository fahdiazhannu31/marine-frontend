import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../ui/ToastContext.jsx";
import { api } from "../../../services/api.js";
import { API_URL } from "../../../config/BaseUrl.js";
import {
  ScanLine,
  Camera,
  CameraOff,
  Printer,
  RefreshCw,
  Users,
  Search,
  X,
  FileText,
} from "lucide-react";

let Html5Qrcode = null;
const DEBOUNCE_MS = 3000;

function fmtDate(v) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Result Card ───────────────────────────────────────────────────────────────
function GroupResultCard({ data, token, onDismiss, onPrintAll, printing }) {
  const {
    group_name,
    boat_name,
    trip_date,
    origin,
    destination,
    tickets,
    total,
  } = data;
  const backendBase = API_URL;

  const handlePrintOne = (t) => {
    const url = `${backendBase}/api/group-boarding-pass/pdf?t=${token}&ticket_id=${t.id}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--adm-accent)",
          color: "#fff",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            <Users
              size={15}
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            {group_name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            {boat_name} · {origin} → {destination} · {fmtDate(trip_date)}
          </div>
        </div>
        <button
          className="adm-btn adm-btn-sm"
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            border: "none",
          }}
          onClick={onDismiss}
        >
          <X size={14} />
        </button>
      </div>

      {/* Print All */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--adm-border)",
          background: "#f9f9fb",
        }}
      >
        <button
          className="adm-btn adm-btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onPrintAll}
          disabled={printing}
        >
          {printing ? (
            <>
              <RefreshCw
                size={14}
                className="ci-spin"
                style={{ marginRight: 6 }}
              />{" "}
              Membuka PDF…
            </>
          ) : (
            <>
              <Printer size={14} style={{ marginRight: 6 }} /> Cetak Semua
              Boarding Pass ({total} orang)
            </>
          )}
        </button>
      </div>

      {/* Ticket list */}
      <div style={{ padding: "10px 20px 16px" }}>
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
          Daftar Penumpang
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tickets.map((t, idx) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: "var(--adm-bg)",
                borderRadius: 8,
                border: "1px solid var(--adm-border)",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--adm-accent-soft)",
                  color: "var(--adm-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {t.passenger_name}
                </div>
                <div style={{ fontSize: 11, color: "var(--adm-text-muted)" }}>
                  {t.seat_number && <span>Kursi {t.seat_number} · </span>}
                  <span
                    style={{
                      color: t.ket?.includes("OVERNIGHT")
                        ? "#1800AD"
                        : "#c96a00",
                      fontWeight: 600,
                    }}
                  >
                    {t.ket === "OVERNIGHT" ? "🌙 Menginap" : "☀️ Day Trip"}
                  </span>
                </div>
              </div>
              <button
                className="adm-btn adm-btn-sm adm-btn-secondary"
                onClick={() => handlePrintOne(t)}
                title="Cetak boarding pass individu"
              >
                <FileText size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GroupPrintDesk() {
  const toast = useToast();

  const [scannerActive, setScannerActive] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [result, setResult] = useState(null);
  const [token, setToken] = useState(null);
  const [searching, setSearching] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [hwMode, setHwMode] = useState(false);

  const html5QrRef = useRef(null);
  const lastCodeRef = useRef(null);
  const fetchRef = useRef(null);
  const hwInputRef = useRef(null);

  // Focus HW input
  useEffect(() => {
    if (!hwMode) return;
    const focus = () => {
      if (hwInputRef.current && document.activeElement !== hwInputRef.current)
        hwInputRef.current.focus();
    };
    focus();
    document.addEventListener("click", focus);
    const iv = setInterval(focus, 500);
    return () => {
      document.removeEventListener("click", focus);
      clearInterval(iv);
    };
  }, [hwMode]);

  // Scanner lifecycle
  const startScanner = useCallback(async () => {
    if (html5QrRef.current) return;
    if (!Html5Qrcode) {
      const mod = await import("html5-qrcode");
      Html5Qrcode = mod.Html5Qrcode;
    }
    try {
      const qr = new Html5Qrcode("gp-qr-reader");
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
          fetchRef.current?.(text);
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

  // Extract token from QR — supports both URL format and raw token
  const extractToken = (code) => {
    if (code.includes("/boarding-pass") && code.includes("t=")) {
      try {
        const url = new URL(code);
        return url.searchParams.get("t");
      } catch (_) {
        const m = code.match(/[?&]t=([^&]+)/);
        return m ? m[1] : null;
      }
    }
    // Raw token (base64url)
    if (/^[A-Za-z0-9_-]+$/.test(code) && code.length > 10) return code;
    return null;
  };

  const fetchGroup = async (code) => {
    const tok = extractToken(code);
    if (!tok) {
      toast.error("QR tidak dikenali sebagai boarding pass grup.");
      return;
    }

    setSearching(true);
    setResult(null);
    setToken(null);

    try {
      const data = await api.get(`/api/group-boarding-pass?t=${tok}`, {
        auth: true,
      });
      if (data.error) throw new Error(data.error);
      setResult(data);
      setToken(tok);
      toast.success(
        `✓ Grup ${data.group_name} ditemukan — ${data.total} penumpang`,
      );
    } catch (e) {
      toast.error(e.message || "Grup tidak ditemukan.");
    } finally {
      setSearching(false);
    }
  };

  fetchRef.current = fetchGroup;

  const handlePrintAll = () => {
    if (!result || !token) return;
    setPrinting(true);
    // Build URL with all ticket IDs — backend generates single PDF with all pages
    const ticketIds = result.tickets.map((t) => t.id).join(",");
    const url = `${API_URL}/api/group-boarding-pass/pdf?t=${token}&ticket_ids=${ticketIds}`;
    window.open(url, "_blank", "noopener");
    setTimeout(() => setPrinting(false), 1500);
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Printer size={24} strokeWidth={1.8} /> Print Desk
          </h1>
          <p
            style={{ margin: 0, color: "var(--adm-text-muted)", fontSize: 14 }}
          >
            Scan QR dari email penumpang → cetak boarding pass semua anggota
            grup
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`adm-btn adm-btn-sm ${!hwMode ? "adm-btn-primary" : "adm-btn-secondary"}`}
            onClick={() => setHwMode(false)}
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

      {/* HW Scanner Mode */}
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
              }}
            />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Mode PDA Scanner — Siap Scan
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <input
              ref={hwInputRef}
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualCode.trim() && !searching) {
                  e.preventDefault();
                  fetchGroup(manualCode.trim());
                  setManualCode("");
                }
              }}
              placeholder="← Fokus di sini. Arahkan scanner dan tekan trigger…"
              autoComplete="off"
              disabled={searching}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "2px solid var(--adm-accent)",
                borderRadius: "var(--adm-radius-sm)",
                background: searching ? "var(--adm-bg)" : "#ffffff",
                outline: "none",
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
                <RefreshCw size={14} className="ci-spin" /> Memuat…
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Scanner */}
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
              />
              Scan QR Grup
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
            <div id="gp-qr-reader" style={{ width: "100%", height: "100%" }} />
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
                    width: 220,
                    height: 220,
                    border: "3px solid rgba(242,136,28,0.9)",
                    borderRadius: 12,
                    boxShadow: "0 0 20px rgba(242,136,28,0.4)",
                  }}
                />
                {searching && (
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
                    <RefreshCw size={14} className="ci-spin" /> Memuat…
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
              ? "Kamera aktif — scan QR dari HP penumpang"
              : scannerActive
                ? "Memulai kamera…"
                : "Kamera mati"}
          </div>

          {/* Manual input */}
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
              Input Manual / PDA
            </div>
            <form
              style={{ display: "flex", gap: 8 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode.trim()) {
                  fetchGroup(manualCode.trim());
                  setManualCode("");
                }
              }}
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualCode.trim() && !searching) {
                    e.preventDefault();
                    fetchGroup(manualCode.trim());
                    setManualCode("");
                  }
                }}
                placeholder="Paste URL atau scan kode…"
                disabled={searching}
                autoComplete="off"
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

        {/* Result */}
        <div>
          {result ? (
            <GroupResultCard
              data={result}
              token={token}
              onDismiss={() => {
                setResult(null);
                setToken(null);
              }}
              onPrintAll={handlePrintAll}
              printing={printing}
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
              <Printer size={40} strokeWidth={1.2} />
              <p style={{ margin: "12px 0 4px", fontSize: 14 }}>
                Scan QR dari HP penumpang
              </p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                QR dari email → cetak boarding pass semua anggota grup sekaligus
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
