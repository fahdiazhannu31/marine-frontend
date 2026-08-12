import { API_URL } from "../../../config/BaseUrl.js";
import "./BoardingPass.css";

/**
 * BoardingPass
 * Shows a quick on-screen summary of the booking, then hands off the
 * actual printing to the backend: GET /admin/boarding-pass-pdf/{id}
 * generates a REAL PDF with FPDF (same approach as the existing
 * generateTicketPDF in Admin.php) — one unified card per seat, no
 * CSS/print-window quirks, no "split into two floating cards" issue.
 *
 * Props:
 * - booking: ticket data from GET /admin/ticket/{id}
 *   { id, user_name, jml_pax, package_name, date_departure,
 *     boat_departure_name, seats: [{ id, seat_number }] }
 * - onClose: callback when the panel is closed
 */
export default function BoardingPass({ booking = null, onClose = () => {} }) {
  if (!booking) return null;

  const seats =
    booking.seats && booking.seats.length > 0
      ? booking.seats
      : [{ id: "na", seat_number: "-" }];

  const departureDate = booking.date_departure
    ? new Date(booking.date_departure)
    : null;

  const formattedDate = departureDate
    ? departureDate
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
        .toUpperCase()
    : "N/A";

  const boardingTime = departureDate
    ? departureDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "N/A";

  const pdfUrl = `${API_URL}/admin/boarding-pass-pdf/${booking.id}`;

  const handleOpenPdf = () => {
    // Opens the backend-generated PDF (one page per seat) in a new tab.
    // The user can then print or save it directly from the browser's
    // native PDF viewer — no HTML/print-window hacks involved.
    window.open(pdfUrl, "_blank");
  };

  return (
    <div className="bp-wrapper">
      <div className="bp-summary-card">
        <div className="bp-summary-header">
          <span className="bp-summary-icon">⛴</span>
          <div>
            <h3>Boarding Pass Ready</h3>
            <p>Booking #{booking.id} • {formattedDate}</p>
          </div>
        </div>

        <div className="bp-summary-grid">
          <div className="bp-summary-field">
            <span className="bp-summary-label">Group</span>
            <span className="bp-summary-value">
              {booking.group_name || booking.user_name}
            </span>
          </div>
          <div className="bp-summary-field">
            <span className="bp-summary-label">Boarding Time</span>
            <span className="bp-summary-value">{boardingTime}</span>
          </div>
          <div className="bp-summary-field">
            <span className="bp-summary-label">Total Pax</span>
            <span className="bp-summary-value">{booking.jml_pax}</span>
          </div>
          <div className="bp-summary-field">
            <span className="bp-summary-label">Boat</span>
            <span className="bp-summary-value">
              {booking.boat_departure_name || "N/A"}
            </span>
          </div>
          <div className="bp-summary-field">
            <span className="bp-summary-label">To</span>
            <span className="bp-summary-value">
              {booking.package_name || "N/A"}
            </span>
          </div>
          <div className="bp-summary-field">
            <span className="bp-summary-label">Seats &amp; Passengers</span>
            <span className="bp-summary-value bp-seats-list">
              {seats
                .map((s) =>
                  s.passenger_name
                    ? `${s.seat_number} (${s.passenger_name})`
                    : s.seat_number,
                )
                .join(", ")}
            </span>
          </div>
        </div>

        <p className="bp-summary-note">
          PDF akan berisi {seats.length} boarding pass (1 halaman per kursi),
          lengkap dengan QR code untuk check-in.
        </p>
      </div>

      <div className="bp-actions">
        <button className="bp-btn bp-btn-print" onClick={handleOpenPdf}>
          🖨️ Buka &amp; Print Boarding Pass (PDF)
        </button>
        <button className="bp-btn bp-btn-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
