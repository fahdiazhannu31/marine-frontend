import { useEffect, useRef } from "react";
import "./GuestTagPrint.css";

/**
 * GuestTagPrint
 *
 * Renders a printable guest baggage tag in a modal overlay.
 * Clicking "Print" fires window.print() which only shows the tag via CSS.
 * Clicking "Close" calls onClose (which also marks tag as printed).
 *
 * Props:
 *   baggage  — manifest_baggage row { group_name, bag_label, bag_count, weight_kg, description }
 *   upload   — manifest_uploads row { boat_name, trip_date, direction, captain_name }
 *   onClose  — callback fired when the user dismisses
 */
export default function GuestTagPrint({ baggage, upload, onClose }) {
  const printRef = useRef(null);

  // Trap ESC key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const tripDate = upload?.trip_date
    ? new Date(upload.trip_date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  const direction =
    upload?.direction === "RETURN" ? "Kepulangan" : "Keberangkatan";

  // ── Dynamic boat color ───────────────────────────────────────
  const boatName = (upload?.boat_name || "").toLowerCase();
  const boatColors = {
    "la luna": "#1800ad",
    "la vela": "#bf0000",
    "la brisa": "#ff57d0",
    "mola mola": "#ff914d",
    "mola-mola": "#ff914d",
    "la casa": "#a77aff",
    alma: "#ffde59",
  };

  let brandColor = "#1a3a6e"; // default
  for (const [key, color] of Object.entries(boatColors)) {
    if (boatName.includes(key)) {
      brandColor = color;
      break;
    }
  }

  // Build tag rows
  const items = [
    { label: "Tamu / Guest", value: baggage.group_name },
    { label: "Kapal", value: upload?.boat_name || "—" },
    { label: "Tanggal", value: tripDate },
    { label: "Arah", value: direction },
    { label: "Label / Tag", value: baggage.bag_label || "—" },
    { label: "Jumlah Tas", value: `${baggage.bag_count} tas` },
    {
      label: "Berat",
      value: baggage.weight_kg ? `${baggage.weight_kg} kg` : "—",
    },
    { label: "Keterangan", value: baggage.description || "—" },
  ];

  return (
    <div
      className="guest-tag-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="guest-tag-modal">
        {/* Screen controls — hidden in print */}
        <div className="guest-tag-controls">
          <span className="guest-tag-title">Guest Tag Preview</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="adm-btn adm-btn-secondary"
              onClick={() => window.print()}
            >
              🖨️ Print
            </button>
            <button className="adm-btn adm-btn-ghost" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* The actual printable tag */}
        <div className="guest-tag-card" ref={printRef}>
          {/* Header band */}
          <div className="guest-tag-header">
            <div className="guest-tag-logo" style={{ color: brandColor }}>
              NAMA Marine
            </div>
            <div className="guest-tag-badge" style={{ background: brandColor }}>
              {direction}
            </div>
          </div>

          {/* Guest name — large */}
          <div className="guest-tag-name">{baggage.group_name}</div>
          <div className="guest-tag-subname">
            {upload?.boat_name || ""} · {tripDate}
          </div>

          {/* Detail rows */}
          <div className="guest-tag-divider" />
          <div className="guest-tag-details">
            {items.slice(4).map(({ label, value }) => (
              <div key={label} className="guest-tag-row">
                <span className="guest-tag-row-label">{label}</span>
                <span className="guest-tag-row-value">{value}</span>
              </div>
            ))}
          </div>

          {/* Footer barcode area */}
          <div className="guest-tag-divider" />
          <div className="guest-tag-footer">
            <div className="guest-tag-barcode">
              {/* ASCII-art style barcode using thin + thick blocks */}
              {"█▌█▌▌█▌█▌██▌█▌▌█▌▌█▌█▌▌█"}
            </div>
            <div className="guest-tag-code">
              {baggage.bag_label || `BAG-${baggage.id}`}
            </div>
          </div>
        </div>

        {/* Multi-bag hint */}
        {baggage.bag_count > 1 && (
          <p className="guest-tag-hint">
            Terdapat <strong>{baggage.bag_count}</strong> tas untuk grup ini.
            Cetak tag yang sama untuk setiap tas.
          </p>
        )}
      </div>
    </div>
  );
}
