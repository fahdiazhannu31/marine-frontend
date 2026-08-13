import { useState, useEffect, useCallback } from "react";
import {
  fetchUploads,
  fetchManifestFinal,
  getExportExcelUrl,
} from "../services/manifestUploadService.js";
import { useToast } from "../ui/ToastContext.jsx";
import { API_URL } from "../../../config/BaseUrl.js";
import { getToken } from "../../../services/api.js";
import { Printer, FileSpreadsheet } from "lucide-react";

// ── Boat brand colors ────────────────────────────────────────────────────────
const BOAT_COLORS = [
  { key: "la luna", hex: "#1800ad", text: "#ffffff" },
  { key: "la vela", hex: "#bf0000", text: "#ffffff" },
  { key: "la brisa", hex: "#ff57d0", text: "#ffffff" },
  { key: "mola mola", hex: "#ff914d", text: "#ffffff" },
  { key: "mola-mola", hex: "#ff914d", text: "#ffffff" },
  { key: "la casa", hex: "#a77aff", text: "#ffffff" },
  { key: "alma", hex: "#ffde59", text: "#000000" },
];

function getBoatColor(boatName) {
  const lower = (boatName || "").toLowerCase();
  for (const { key, hex, text } of BOAT_COLORS) {
    if (lower.includes(key)) return { hex, text };
  }
  return { hex: "#1a3a6e", text: "#ffffff" };
}

// ── KET section style ────────────────────────────────────────────────────────
const KET_SECTION_STYLE = {
  OVERNIGHT: { bg: "#e3f2fd", text: "#1565c0", label: "MENGINAP" },
  "DAY TRIP": { bg: "#fff3e0", text: "#e65100", label: "DAY TRIP" },
  STAFF: { bg: "#e8f5e9", text: "#2e7d32", label: "STAFF" },
  FOC: { bg: "#f3e5f5", text: "#6a1b9a", label: "FOC" },
  VENDOR: { bg: "#efebe9", text: "#4e342e", label: "VENDOR" },
};

function fmtDate(v) {
  if (!v) return "-";
  return new Date(v)
    .toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

// ── Section header row ───────────────────────────────────────────────────────
function SectionHeader({ ket, count, color }) {
  const style = KET_SECTION_STYLE[ket] || {
    bg: "#f5f5f5",
    text: "#333",
    label: ket,
  };
  return (
    <tr>
      <td
        colSpan={12}
        style={{
          background: style.bg,
          color: style.text,
          fontWeight: 800,
          fontSize: 13,
          padding: "8px 12px",
          letterSpacing: 1,
          borderTop: `2px solid ${style.text}`,
          borderBottom: `1px solid ${style.text}`,
        }}
      >
        {style.label}
        <span
          style={{
            marginLeft: 16,
            fontWeight: 700,
            fontSize: 12,
            background: style.text,
            color: style.bg,
            padding: "1px 8px",
            borderRadius: 99,
          }}
        >
          {count} PAX
        </span>
        {color && (
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 99,
              background: color.hex,
              marginLeft: 8,
              verticalAlign: "middle",
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          />
        )}
      </td>
    </tr>
  );
}

// ── Ticket row ───────────────────────────────────────────────────────────────
function TicketRow({ ticket, seq, seatVisible }) {
  const isCancelled = parseInt(ticket.cancelled) === 1;
  return (
    <tr
      style={{
        opacity: isCancelled ? 0.55 : 1,
        textDecoration: isCancelled ? "line-through" : "none",
        background: isCancelled ? "#ffebee" : "transparent",
        fontSize: 12,
      }}
    >
      <td style={tdStyle("center")}>{ticket.seq_no}</td>
      <td style={tdStyle("center")}>
        <span
          className="adm-badge"
          style={{
            fontSize: 10,
            padding: "1px 6px",
            ...(KET_SECTION_STYLE[ticket.ket?.toUpperCase()]
              ? {
                  background: KET_SECTION_STYLE[ticket.ket.toUpperCase()].bg,
                  color: KET_SECTION_STYLE[ticket.ket.toUpperCase()].text,
                }
              : {}),
          }}
        >
          {ticket.ket || "—"}
        </span>
      </td>
      <td style={tdStyle()}>{ticket.passenger_name || "—"}</td>
      <td style={{ ...tdStyle(), color: "#555", fontSize: 11 }}>
        {ticket.group_name || "—"}
      </td>
      <td style={{ ...tdStyle(), color: "#777", fontSize: 11 }}>
        {ticket.agent || "—"}
      </td>
      <td style={{ ...tdStyle(), fontSize: 11 }}>{ticket.package || "—"}</td>
      <td style={tdStyle("center")}>{ticket.pax_count || "—"}</td>
      <td style={{ ...tdStyle(), fontSize: 11, color: "#888" }}>
        {ticket.notes || "—"}
      </td>
      <td style={{ ...tdStyle(), fontFamily: "monospace", fontSize: 11 }}>
        {ticket.domicile || "—"}
      </td>
      <td style={{ ...tdStyle(), fontFamily: "monospace", fontSize: 11 }}>
        {ticket.id_passport || "—"}
      </td>
      {seatVisible && (
        <td style={{ ...tdStyle("center") }}>
          {ticket.seat_number ? (
            <span
              className="adm-badge adm-badge-success"
              style={{ fontSize: 11 }}
            >
              {ticket.seat_number}
            </span>
          ) : (
            <span style={{ color: "#ccc" }}>—</span>
          )}
        </td>
      )}
    </tr>
  );
}

const tdStyle = (align = "left") => ({
  padding: "5px 8px",
  borderBottom: "1px solid #e8e8e8",
  borderRight: "1px solid #f0f0f0",
  textAlign: align,
  verticalAlign: "middle",
  whiteSpace: align === "left" ? "normal" : "nowrap",
});

const thStyle = (align = "center") => ({
  padding: "7px 8px",
  textAlign: align,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 0.5,
  whiteSpace: "nowrap",
  borderRight: "1px solid rgba(255,255,255,0.2)",
});

// ── Main page ────────────────────────────────────────────────────────────────
export default function ManifestFinal() {
  const toast = useToast();
  const [uploads, setUploads] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [showSeats, setShowSeats] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    fetchUploads()
      .then(setUploads)
      .catch(() => toast.error("Gagal memuat daftar manifest."))
      .finally(() => setLoadingUploads(false));
  }, []);

  const loadFinal = useCallback(
    async (id) => {
      if (!id) return;
      setLoading(true);
      setData(null);
      try {
        const res = await fetchManifestFinal(id);
        setData(res);
      } catch (e) {
        toast.error(e.message || "Gagal memuat manifest final.");
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (selectedId) loadFinal(selectedId);
  }, [selectedId, loadFinal]);

  const handleExport = async () => {
    if (!selectedId) return;
    const url = getExportExcelUrl(selectedId);
    const token = getToken();
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        // Try to parse error message
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        let errMsg = `Export failed (${res.status})`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errMsg;
        } catch {}
        toast.error(errMsg);
        return;
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `manifest-${selectedId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("Excel berhasil diunduh.");
    } catch (e) {
      toast.error("Gagal mengekspor Excel: " + (e.message || "Unknown error"));
    }
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 200);
  };

  const upload = data?.upload;
  const sections = data?.sections || [];
  const totalPax = data?.total || 0;
  const boatColor = getBoatColor(upload?.boat_name || "");

  // Flatten all tickets for stats
  const allTickets = sections.flatMap((s) => s.tickets);

  return (
    <div className="adm-page" style={{ maxWidth: "100%" }}>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="adm-page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>📋 Manifest Final</h1>
          <p>Tampilkan dan ekspor manifest penumpang dalam format final.</p>
        </div>
        {data && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="adm-btn adm-btn-secondary" onClick={handlePrint}>
              <Printer
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Print
            </button>
            <button className="adm-btn adm-btn-success" onClick={handleExport}>
              <FileSpreadsheet
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Export Excel (.xlsx)
            </button>
          </div>
        )}
      </div>

      {/* ── Upload selector ─────────────────────────────────────── */}
      <div className="adm-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--adm-text-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Pilih Manifest
            </label>
            {loadingUploads ? (
              <div className="adm-loading" style={{ fontSize: 13 }}>
                Loading uploads…
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid var(--adm-border-strong)",
                  borderRadius: "var(--adm-radius-sm)",
                  fontSize: 13,
                  background: "var(--adm-surface)",
                  color: "var(--adm-text)",
                }}
              >
                <option value="">— Pilih manifest —</option>
                {uploads.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.id} · {u.boat_name} · {u.direction} ·{" "}
                    {new Date(u.trip_date || u.created_at).toLocaleDateString(
                      "id-ID",
                    )}{" "}
                    · {u.total_pax} pax · {u.status}
                  </option>
                ))}
              </select>
            )}
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              cursor: "pointer",
              marginTop: 20,
            }}
          >
            <input
              type="checkbox"
              checked={showSeats}
              onChange={(e) => setShowSeats(e.target.checked)}
            />
            Tampilkan Kolom Kursi
          </label>
        </div>
      </div>

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div
          className="adm-loading"
          style={{ textAlign: "center", padding: 40 }}
        >
          Loading manifest final…
        </div>
      )}

      {/* ── Manifest content ─────────────────────────────────────── */}
      {data && upload && (
        <div
          id="manifest-print-area"
          style={{
            background: "#fff",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            border: "1px solid #ddd",
          }}
        >
          {/* ── Colored header band ──────────────────────────────── */}
          <div
            style={{
              background: boatColor.hex,
              color: boatColor.text,
              padding: "18px 24px 14px",
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              MANIFEST PENUMPANG{" "}
              {upload.direction === "RETURN" ? "KEPULANGAN" : "KEBERANGKATAN"}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
              {fmtDate(upload.trip_date)}
            </div>

            {/* Meta grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "8px 24px",
                fontSize: 12,
              }}
            >
              {[
                { label: "KAPAL", value: upload.boat_name },
                { label: "ASAL", value: upload.origin || "—" },
                { label: "TUJUAN", value: upload.destination || "—" },
                { label: "NAHKODA", value: upload.captain_name || "—" },
                {
                  label: "CREW",
                  value: (() => {
                    try {
                      return JSON.parse(upload.abk_names || "[]").join(", ");
                    } catch {
                      return upload.abk_names || "—";
                    }
                  })(),
                },
                { label: "GRO", value: upload.gro_name || "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{ fontWeight: 700, opacity: 0.75, minWidth: 70 }}
                  >
                    {label}
                  </span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stats strip ─────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "2px solid #e0e0e0",
              background: "#fafafa",
            }}
          >
            {[
              {
                label: "OVERNIGHT",
                value:
                  upload.overnight_count ??
                  sections.find((s) => s.ket === "OVERNIGHT")?.count ??
                  0,
                color: "#1565c0",
                bg: "#e3f2fd",
              },
              {
                label: "DAY TRIP",
                value:
                  upload.daytrip_count ??
                  sections.find((s) => s.ket === "DAY TRIP")?.count ??
                  0,
                color: "#e65100",
                bg: "#fff3e0",
              },
              {
                label: "STAFF",
                value:
                  upload.staff_count ??
                  sections.find((s) => s.ket === "STAFF")?.count ??
                  0,
                color: "#2e7d32",
                bg: "#e8f5e9",
              },
              {
                label: "FOC",
                value:
                  upload.foc_count ??
                  sections.find((s) => s.ket === "FOC")?.count ??
                  0,
                color: "#6a1b9a",
                bg: "#f3e5f5",
              },
              {
                label: "VENDOR",
                value:
                  upload.vendor_count ??
                  sections.find((s) => s.ket === "VENDOR")?.count ??
                  0,
                color: "#4e342e",
                bg: "#efebe9",
              },
              {
                label: "TOTAL",
                value: totalPax,
                color: "#fff",
                bg: boatColor.hex,
                bold: true,
              },
            ]
              .filter((s) => s.label === "TOTAL" || Number(s.value) > 0)
              .map(({ label, value, color, bg, bold }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: bg,
                    borderRight: "1px solid #e0e0e0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: color === "#fff" ? boatColor.text : color,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: color === "#fff" ? boatColor.text : color,
                      opacity: 0.8,
                      letterSpacing: 0.5,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
          </div>

          {/* ── Table ────────────────────────────────────────────── */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{ background: boatColor.hex, color: boatColor.text }}
                >
                  {[
                    "NO",
                    "KET",
                    "NAMA PENUMPANG",
                    "GRUP",
                    "AGENT",
                    "PACKAGE",
                    "PAX",
                    "NOTES",
                    "DOMISILI",
                    "ID / PASPORT",
                  ].map((h) => (
                    <th key={h} style={thStyle()}>
                      {h}
                    </th>
                  ))}
                  {showSeats && <th style={thStyle()}>KURSI</th>}
                </tr>
              </thead>
              <tbody>
                {sections
                  .filter((s) => s.count > 0)
                  .map((section) => (
                    <>
                      <SectionHeader
                        key={`hdr-${section.ket}`}
                        ket={section.ket}
                        count={section.count}
                        color={boatColor}
                      />
                      {section.tickets.map((t, i) => (
                        <TicketRow
                          key={t.id}
                          ticket={t}
                          seq={i + 1}
                          seatVisible={showSeats}
                        />
                      ))}
                    </>
                  ))}
              </tbody>
            </table>
          </div>

          {/* ── Footer ───────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "24px 32px",
              borderTop: "1px solid #e0e0e0",
              gap: 24,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 48 }}>
                {upload.trip_date
                  ? new Date(upload.trip_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </div>
              <div
                style={{
                  borderTop: "1.5px solid #333",
                  paddingTop: 6,
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: 1,
                  minWidth: 160,
                  textAlign: "center",
                }}
              >
                {(upload.captain_name || "NAHKODA").toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Print styles ─────────────────────────────────────────── */}
      <style>{`
        @media print {
          body > *:not(#root) { display: none !important; }
          .adm-shell { display: block !important; }
          .adm-sidebar, .adm-mobile-toggle, .adm-page-header button,
          .adm-card:first-child, .adm-sidebar-backdrop { display: none !important; }
          #manifest-print-area {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          @page { margin: 8mm; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}
