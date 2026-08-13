import { useState, useEffect, useRef } from "react";
import { useToast } from "../ui/ToastContext.jsx";
import { API_URL } from "../../../config/BaseUrl.js";
import { api } from "../../../services/api.js";
import {
  Camera,
  CameraOff,
  Search,
  CheckCheck,
  X,
  Check,
  ScanLine,
} from "lucide-react";

// Dynamic import for html5-qrcode to avoid Vite SSR issues
let Html5Qrcode = null;

// ── Helper functions ─────────────────────────────────────────────────────────
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

// ── GroupCheckinModal ────────────────────────────────────────────────────────
function GroupCheckinModal({ groupData, onClose, onSuccess }) {
  const toast = useToast();
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Auto-select all non-cancelled tickets
    const autoSelect = new Set(
      groupData.tickets
        .filter((t) => parseInt(t.cancelled) !== 1)
        .map((t) => t.id),
    );
    setSelectedTickets(autoSelect);
  }, [groupData]);

  const toggleTicket = (ticketId) => {
    setSelectedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const handleCheckinAll = async () => {
    if (selectedTickets.size === 0) {
      toast.error("No tickets selected for check-in.");
      return;
    }

    setProcessing(true);
    try {
      const ticketIds = Array.from(selectedTickets);
      await api.post(
        "/api/admin/manifest/checkin-bulk",
        { ticket_ids: ticketIds },
        { auth: true },
      );
      toast.success(
        `✓ Checked in ${ticketIds.length} passenger${ticketIds.length > 1 ? "s" : ""}`,
      );
      onSuccess();
    } catch (e) {
      toast.error(e.message || "Check-in failed");
    } finally {
      setProcessing(false);
    }
  };

  const toggleCancelled = async (ticketId) => {
    try {
      await api.post(
        `/api/admin/manifest/tickets/${ticketId}/toggle-cancel`,
        {},
        { auth: true },
      );
      toast.success("Ticket status updated");
      onSuccess(); // Refresh data
    } catch (e) {
      toast.error(e.message || "Failed to update ticket");
    }
  };

  const isCancelled = (t) => parseInt(t.cancelled) === 1;
  const isCheckedIn = (t) => parseInt(t.checked_in) === 1;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="adm-card"
        style={{
          maxWidth: 900,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 24,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "2px solid var(--adm-border)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>
              👥 Group Check-In: {groupData.group_name}
            </h2>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: 13,
                color: "var(--adm-text-muted)",
              }}
            >
              <div>
                <strong>{groupData.tickets.length}</strong> passengers
              </div>
              <div>•</div>
              <div>
                Boat: <strong>{groupData.boat_name}</strong>
              </div>
              <div>•</div>
              <div>
                Date: <strong>{fmtDate(groupData.trip_date)}</strong>
              </div>
              <div>•</div>
              <div>
                Direction: <strong>{groupData.direction}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "var(--adm-text-muted)",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Stats Grid */}
        <div
          className="adm-stat-grid"
          style={{
            marginBottom: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          }}
        >
          <div className="adm-stat-card">
            <div className="adm-stat-label">Total</div>
            <div className="adm-stat-value">{groupData.tickets.length}</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Checked In</div>
            <div className="adm-stat-value" style={{ color: "#2e7d32" }}>
              {groupData.tickets.filter(isCheckedIn).length}
            </div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Pending</div>
            <div className="adm-stat-value" style={{ color: "#e65100" }}>
              {
                groupData.tickets.filter(
                  (t) => !isCheckedIn(t) && !isCancelled(t),
                ).length
              }
            </div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Cancelled</div>
            <div className="adm-stat-value" style={{ color: "#d32f2f" }}>
              {groupData.tickets.filter(isCancelled).length}
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="adm-table-wrap" style={{ marginBottom: 20 }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedTickets.size > 0 &&
                      selectedTickets.size ===
                        groupData.tickets.filter((t) => !isCancelled(t)).length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTickets(
                          new Set(
                            groupData.tickets
                              .filter((t) => !isCancelled(t))
                              .map((t) => t.id),
                          ),
                        );
                      } else {
                        setSelectedTickets(new Set());
                      }
                    }}
                    title="Select/Deselect All"
                  />
                </th>
                <th>Seq</th>
                <th>Passenger Name</th>
                <th>NIK/Passport</th>
                <th>Seat</th>
                <th>KET</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupData.tickets.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    opacity: isCancelled(t) ? 0.6 : 1,
                    background: isCheckedIn(t)
                      ? "#e8f5e9"
                      : isCancelled(t)
                        ? "#ffebee"
                        : undefined,
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTickets.has(t.id)}
                      onChange={() => toggleTicket(t.id)}
                      disabled={isCancelled(t) || isCheckedIn(t)}
                    />
                  </td>
                  <td style={{ color: "var(--adm-text-faint)" }}>{t.seq_no}</td>
                  <td className="adm-cell-primary">{t.passenger_name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {t.id_passport || "-"}
                  </td>
                  <td>
                    {t.seat_number ? (
                      <span className="adm-badge adm-badge-success">
                        {t.seat_number}
                      </span>
                    ) : (
                      <span className="adm-badge adm-badge-neutral">-</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="adm-badge"
                      style={{
                        background: (t.ket || "")
                          .toUpperCase()
                          .includes("OVERNIGHT")
                          ? "#e3f2fd"
                          : (t.ket || "").toUpperCase().includes("DAY")
                            ? "#fff3e0"
                            : "var(--adm-bg)",
                        color: (t.ket || "").toUpperCase().includes("OVERNIGHT")
                          ? "#1565c0"
                          : (t.ket || "").toUpperCase().includes("DAY")
                            ? "#e65100"
                            : "var(--adm-text-muted)",
                      }}
                    >
                      {t.ket || "-"}
                    </span>
                  </td>
                  <td>
                    {isCheckedIn(t) ? (
                      <span className="adm-badge adm-badge-success">
                        ✓ Checked In
                      </span>
                    ) : isCancelled(t) ? (
                      <span className="adm-badge adm-badge-danger">
                        ✕ Cancelled
                      </span>
                    ) : (
                      <span className="adm-badge adm-badge-warning">
                        Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`adm-btn adm-btn-sm ${
                        isCancelled(t) ? "adm-btn-secondary" : "adm-btn-danger"
                      }`}
                      onClick={() => toggleCancelled(t.id)}
                      disabled={isCheckedIn(t)}
                      title={
                        isCheckedIn(t)
                          ? "Cannot cancel checked-in ticket"
                          : isCancelled(t)
                            ? "Uncancel this ticket"
                            : "Cancel this ticket"
                      }
                    >
                      {isCancelled(t) ? "Uncancel" : "Cancel"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 16,
            borderTop: "2px solid var(--adm-border)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--adm-text-muted)" }}>
            {selectedTickets.size > 0 ? (
              <span>
                <strong>{selectedTickets.size}</strong> ticket
                {selectedTickets.size > 1 ? "s" : ""} selected for check-in
              </span>
            ) : (
              <span>No tickets selected</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="adm-btn adm-btn-ghost" onClick={onClose}>
              Close
            </button>
            <button
              className="adm-btn adm-btn-success"
              onClick={handleCheckinAll}
              disabled={processing || selectedTickets.size === 0}
              style={{
                minWidth: 180,
              }}
            >
              {processing
                ? "Processing..."
                : `✓ Check In ${selectedTickets.size > 0 ? `(${selectedTickets.size})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main CheckIn Component ───────────────────────────────────────────────────
export default function CheckIn() {
  const toast = useToast();
  const [scannerActive, setScannerActive] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Initialize QR scanner
  useEffect(() => {
    const initScanner = async () => {
      if (scannerActive && !html5QrCodeRef.current) {
        // Dynamically import Html5Qrcode
        if (!Html5Qrcode) {
          const module = await import("html5-qrcode");
          Html5Qrcode = module.Html5Qrcode;
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        html5QrCodeRef.current = new Html5Qrcode("qr-reader");

        html5QrCodeRef.current
          .start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              // Successfully scanned
              handleScanSuccess(decodedText);
            },
            (errorMessage) => {
              // Scan error (can be ignored, happens frequently during scanning)
            },
          )
          .catch((err) => {
            console.error("Failed to start scanner:", err);
            toast.error("Failed to start camera scanner. Try manual input.");
            setScannerActive(false);
          });
      }
    };

    if (scannerActive) {
      initScanner();
    }

    return () => {
      if (html5QrCodeRef.current && scannerActive) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current = null;
          })
          .catch((err) => console.error("Scanner stop error:", err));
      }
    };
  }, [scannerActive]);

  const handleScanSuccess = async (code) => {
    // Stop scanner
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);

    // Fetch group data
    await fetchGroupData(code);
  };

  const fetchGroupData = async (code) => {
    setLoading(true);
    try {
      // API call to get group data by ticket ID or group name
      const response = await api.get(
        `/api/admin/manifest/group-by-code/${encodeURIComponent(code)}`,
        { auth: true },
      );
      setGroupData(response);
      setManualCode("");
    } catch (e) {
      toast.error(
        e.message || "Group not found. Check the code and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error("Please enter a ticket ID or group name");
      return;
    }
    fetchGroupData(manualCode.trim());
  };

  const handleStartScanner = () => {
    setScannerActive(true);
  };

  const handleStopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current = null;
          setScannerActive(false);
        })
        .catch((err) => {
          console.error("Scanner stop error:", err);
          setScannerActive(false);
        });
    } else {
      setScannerActive(false);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ScanLine size={28} strokeWidth={1.8} /> Check-In Scanner
          </h1>
          <p>
            Scan barcode/QR dari boarding pass atau masukkan kode manual untuk
            check-in grup penumpang.
          </p>
        </div>
      </div>

      <div className="adm-card" style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Scanner Section */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Scan Barcode / QR Code</h3>
          {!scannerActive ? (
            <button
              className="adm-btn adm-btn-primary"
              onClick={handleStartScanner}
              style={{ width: "100%" }}
            >
              <Camera
                size={15}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Start Camera Scanner
            </button>
          ) : (
            <div>
              <div
                id="qr-reader"
                ref={scannerRef}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              />
              <button
                className="adm-btn adm-btn-danger"
                onClick={handleStopScanner}
                style={{ width: "100%" }}
              >
                <CameraOff
                  size={15}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                Stop Scanner
              </button>
            </div>
          )}
        </div>

        {/* Manual Input Section */}
        <div
          style={{
            paddingTop: 24,
            borderTop: "2px solid var(--adm-border)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Manual Input</h3>
          <p
            style={{
              fontSize: 13,
              color: "var(--adm-text-muted)",
              marginBottom: 16,
            }}
          >
            Enter ticket ID, group name, or any identifier from the manifest.
          </p>
          <form onSubmit={handleManualSubmit}>
            <div style={{ display: "flex", gap: 12 }}>
              <input
                type="text"
                placeholder="Enter ticket ID or group name..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid var(--adm-border-strong)",
                  borderRadius: "var(--adm-radius-sm)",
                  fontSize: 14,
                }}
                disabled={loading}
              />
              <button
                type="submit"
                className="adm-btn adm-btn-primary"
                disabled={loading || !manualCode.trim()}
              >
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    <Search
                      size={14}
                      style={{ verticalAlign: "middle", marginRight: 4 }}
                    />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              marginTop: 24,
              padding: 20,
              textAlign: "center",
              color: "var(--adm-text-muted)",
            }}
          >
            <div className="adm-loading">Loading group data...</div>
          </div>
        )}
      </div>

      {/* Group Check-In Modal */}
      {groupData && (
        <GroupCheckinModal
          groupData={groupData}
          onClose={() => setGroupData(null)}
          onSuccess={() => {
            // Refresh group data after check-in
            if (groupData.group_name) {
              fetchGroupData(groupData.group_name);
            } else {
              setGroupData(null);
            }
          }}
        />
      )}
    </div>
  );
}
