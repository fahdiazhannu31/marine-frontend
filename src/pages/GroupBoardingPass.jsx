import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { API_URL } from "../config/BaseUrl.js";

function fmtDate(v) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function GroupBoardingPass() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t") ?? "";
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Token tidak valid.");
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/group-boarding-pass?t=${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handlePrint = (ticket) => {
    setPrinting(ticket.id);
    const url = ticket.boarding_pass_url;
    // Open PDF in new tab — browser will render or prompt download
    window.open(url, "_blank", "noopener");
    setTimeout(() => setPrinting(null), 2000);
  };

  const handlePrintAll = () => {
    if (!data) return;
    data.tickets.forEach((t, i) => {
      setTimeout(
        () => window.open(t.boarding_pass_url, "_blank", "noopener"),
        i * 400,
      );
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading)
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={{ color: "#888", marginTop: 16 }}>Memuat boarding pass…</p>
      </div>
    );

  // ── Error ────────────────────────────────────────────────────────────
  if (error)
    return (
      <div style={styles.center}>
        <div style={styles.errorBox}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: "#c0392b", margin: "0 0 8px" }}>
            Link Tidak Valid
          </h2>
          <p style={{ color: "#666", margin: 0 }}>{error}</p>
        </div>
      </div>
    );

  // ── Success ──────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLogo}>⚓</div>
        <div>
          <h1 style={styles.headerTitle}>NAMA Marine</h1>
          <p style={styles.headerSub}>Boarding Pass — Self Service</p>
        </div>
      </div>

      {/* Trip Info Card */}
      <div style={styles.tripCard}>
        <div style={styles.tripRow}>
          <div style={styles.tripItem}>
            <span style={styles.tripLabel}>Kapal</span>
            <span style={styles.tripValue}>{data.boat_name ?? "-"}</span>
          </div>
          <div style={styles.tripItem}>
            <span style={styles.tripLabel}>Tanggal</span>
            <span style={styles.tripValue}>{fmtDate(data.trip_date)}</span>
          </div>
          <div style={styles.tripItem}>
            <span style={styles.tripLabel}>Rute</span>
            <span style={styles.tripValue}>
              {data.origin} → {data.destination}
            </span>
          </div>
        </div>

        <div style={styles.groupBadge}>
          <span style={{ fontSize: 18, marginRight: 8 }}>👥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {data.group_name}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              {data.total} penumpang
            </div>
          </div>
        </div>
      </div>

      {/* Print All Button */}
      <div style={{ textAlign: "center", margin: "20px 0 8px" }}>
        <button style={styles.btnPrimary} onClick={handlePrintAll}>
          🖨️ Cetak Semua Boarding Pass ({data.total})
        </button>
        <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
          Setiap boarding pass akan terbuka di tab baru
        </p>
      </div>

      {/* Ticket List */}
      <div style={styles.ticketList}>
        {data.tickets.map((t, idx) => (
          <div key={t.id} style={styles.ticketCard}>
            <div style={styles.ticketLeft}>
              <div style={styles.ticketSeq}>{idx + 1}</div>
              <div>
                <div style={styles.ticketName}>{t.passenger_name}</div>
                <div style={styles.ticketMeta}>
                  {t.seat_number && (
                    <span style={styles.seatBadge}>Kursi {t.seat_number}</span>
                  )}
                  <span
                    style={{
                      ...styles.ketBadge,
                      background: t.ket?.includes("OVERNIGHT")
                        ? "#1800AD15"
                        : "#F2881C15",
                      color: t.ket?.includes("OVERNIGHT")
                        ? "#1800AD"
                        : "#c96a00",
                    }}
                  >
                    {t.ket === "OVERNIGHT" ? "🌙 Menginap" : "☀️ Day Trip"}
                  </span>
                  <span style={styles.ticketCode}>{t.ticket_code}</span>
                </div>
              </div>
            </div>
            <button
              style={
                printing === t.id ? styles.btnPrintingActive : styles.btnPrint
              }
              onClick={() => handlePrint(t)}
              disabled={printing === t.id}
            >
              {printing === t.id ? "⏳ Membuka…" : "🎫 Cetak BP"}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>Tunjukkan boarding pass ke petugas saat check-in di dermaga.</p>
        <p style={{ color: "#aaa", fontSize: 11, marginTop: 4 }}>
          © NAMA Marine · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f6fa",
    fontFamily: "Arial, sans-serif",
    paddingBottom: 40,
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f6fa",
    fontFamily: "Arial, sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #eee",
    borderTop: "4px solid #F2881C",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    background: "#fff",
    borderRadius: 12,
    padding: "40px 32px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,.08)",
    maxWidth: 360,
  },
  header: {
    background: "#F2881C",
    color: "#fff",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  headerLogo: {
    fontSize: 36,
    lineHeight: 1,
  },
  headerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },
  headerSub: {
    margin: "2px 0 0",
    fontSize: 13,
    opacity: 0.85,
  },
  tripCard: {
    background: "#fff",
    margin: "16px 16px 0",
    borderRadius: 12,
    padding: "16px 20px",
    boxShadow: "0 2px 10px rgba(0,0,0,.06)",
  },
  tripRow: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottom: "1px solid #f0f0f0",
  },
  tripItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  tripLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#999",
  },
  tripValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#222",
  },
  groupBadge: {
    display: "flex",
    alignItems: "center",
    background: "#F2881C12",
    borderRadius: 8,
    padding: "10px 14px",
    border: "1px solid #F2881C30",
  },
  btnPrimary: {
    background: "#F2881C",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(242,136,28,.3)",
  },
  ticketList: {
    margin: "8px 16px 0",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  ticketCard: {
    background: "#fff",
    borderRadius: 10,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,.06)",
    borderLeft: "3px solid #F2881C",
  },
  ticketLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  ticketSeq: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#F2881C20",
    color: "#F2881C",
    fontWeight: 700,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ticketName: {
    fontWeight: 700,
    fontSize: 15,
    color: "#222",
    marginBottom: 4,
  },
  ticketMeta: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
  },
  seatBadge: {
    background: "#e8f5e9",
    color: "#2e7d32",
    borderRadius: 4,
    padding: "2px 7px",
    fontSize: 11,
    fontWeight: 700,
  },
  ketBadge: {
    borderRadius: 4,
    padding: "2px 7px",
    fontSize: 11,
    fontWeight: 700,
  },
  ticketCode: {
    color: "#aaa",
    fontSize: 11,
    fontFamily: "monospace",
  },
  btnPrint: {
    background: "#fff",
    color: "#F2881C",
    border: "2px solid #F2881C",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  btnPrintingActive: {
    background: "#fef3e2",
    color: "#aaa",
    border: "2px solid #ddd",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "not-allowed",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  footer: {
    textAlign: "center",
    padding: "24px 16px 0",
    color: "#888",
    fontSize: 13,
  },
};
