import { useRef } from "react";
import { formatRupiah } from "../../packages/formatRupiah.js";
import "./TicketPreview.css";

/**
 * Ticket Preview Component - NAMA Marine Luxury Design
 * Renders ticket with brand colors, serif fonts, and premium layout
 *
 * Receives complete ticket data from backend:
 * {
 *   id, user_name, email, jml_pax, amount, qr_code,
 *   boat_name, date_departure, date_return,
 *   seats: [ { id, seat_number } ]
 * }
 *
 * Design: Luxury yacht charter aesthetic with Cormorant Garamond + Inter
 */
/**
 * Props:
 * - booking: ticket data dari backend
 * - seats: array of seat assignments
 * - onPrint: callback saat print
 * - onClose: callback saat close
 * - templateImage: (optional) image URL untuk ticket template berbasis foto
 *   Jika ada, akan render ticket foto + overlay data
 */
export default function TicketPreview({
  booking = null,
  seats = [],
  onPrint = () => {},
  onClose = () => {},
  templateImage = null,
}) {
  const printRef = useRef();

  if (!booking) return null;

  // Use backend seats if available, fallback to local
  const ticketSeats =
    booking.seats && booking.seats.length > 0 ? booking.seats : seats;

  // Tentukan render mode: image-based atau HTML design
  const useImageTemplate = templateImage && templateImage.trim() !== "";

  const handlePrint = () => {
    if (!printRef.current) return;

    const styleSheet = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700;800&display=swap");

        body {
          width: 100%;
          padding: 0;
          margin: 0;
          background: #f7f2ea;
          color: #111111;
          font-family: "Inter", "TT Chocolates", sans-serif;
          line-height: 1.6;
        }

        /* HTML-based design mode */
        .ticket-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 54px 48px;
          border: 1px solid rgba(17, 17, 17, 0.16);
          border-radius: 8px;
          background: #f7f2ea;
          color: #111111;
        }

        /* Image-based template mode */
        .ticket-image-wrapper {
          position: relative;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          background: #ffffff;
        }

        .ticket-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }

        .ticket-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ticket-image-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
          pointer-events: none;
        }

        .ticket-image-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .ticket-image-passenger {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ticket-image-passenger .label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .ticket-image-passenger .name {
          font-family: "Cormorant Garamond", serif;
          font-size: 36px;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .ticket-image-ref {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ticket-image-ref .label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .ticket-image-ref .number {
          font-family: "Cormorant Garamond", serif;
          font-size: 28px;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: 1px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .ticket-image-middle {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          text-align: center;
        }

        .ticket-image-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ticket-image-info .label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .ticket-image-info .value {
          font-family: "Cormorant Garamond", serif;
          font-size: 20px;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.3px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .ticket-image-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .ticket-image-seats {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ticket-image-seats .label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .ticket-image-seats .tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ticket-image-seats .tag {
          padding: 4px 8px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-family: "Cormorant Garamond", serif;
          font-size: 11px;
          font-weight: 500;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .ticket-image-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .ticket-image-qr img {
          width: 100px;
          height: 100px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 2px;
          background: #ffffff;
          padding: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .ticket-image-qr p {
          margin: 0;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        /* HTML design styles */
        .ticket-header {
          text-align: center;
          margin-bottom: 44px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(17, 17, 17, 0.12);
        }

        .ticket-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 18px;
        }

        .ticket-brand-main {
          margin: 0;
          color: #111111;
          font-family: "Cormorant Garamond", serif;
          font-size: 52px;
          font-weight: 500;
          letter-spacing: 16px;
          line-height: 0.86;
        }

        .ticket-brand-sub {
          display: block;
          margin-top: 8px;
          color: #c95b66;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 12px;
          line-height: 1;
        }

        .ticket-subtitle {
          margin: 0;
          color: #111111;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .ticket-divider {
          height: 1px;
          background: rgba(17, 17, 17, 0.1);
          margin: 28px 0;
        }

        .ticket-reference {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 42px;
          padding: 0 0;
        }

        .ticket-ref-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.8px;
          color: rgba(17, 17, 17, 0.54);
          text-transform: uppercase;
        }

        .ticket-ref-number {
          color: #111111;
          font-family: "Cormorant Garamond", serif;
          font-size: 28px;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .ticket-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 42px;
        }

        .ticket-info-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 18px;
          border: 1px solid rgba(17, 17, 17, 0.08);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.56);
        }

        .card-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.6px;
          color: rgba(17, 17, 17, 0.48);
          text-transform: uppercase;
        }

        .card-value {
          margin: 0;
          color: #111111;
          font-family: "Cormorant Garamond", serif;
          font-size: 24px;
          font-weight: 500;
          letter-spacing: -0.5px;
          line-height: 0.92;
        }

        .card-meta {
          margin: 0;
          color: rgba(17, 17, 17, 0.62);
          font-size: 12px;
          line-height: 1.4;
        }

        .card-badge {
          display: inline-block;
          margin-top: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(201, 91, 102, 0.1);
          color: #c95b66;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          width: fit-content;
        }

        .card-amount {
          margin: 8px 0 0;
          color: #c95b66;
          font-family: "Cormorant Garamond", serif;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .ticket-qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 42px 0;
          padding: 32px 0;
        }

        .qr-label {
          margin: 0 0 16px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.8px;
          color: rgba(17, 17, 17, 0.54);
          text-transform: uppercase;
        }

        .qr-container {
          padding: 16px;
          border: 1px solid rgba(17, 17, 17, 0.12);
          border-radius: 4px;
          background: #ffffff;
        }

        .qr-image {
          display: block;
          width: 160px;
          height: 160px;
          border: none;
          padding: 0;
          margin: 0;
        }

        .qr-instruction {
          margin: 14px 0 0;
          font-size: 11px;
          color: rgba(17, 17, 17, 0.62);
          line-height: 1.4;
        }

        .ticket-seats-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 32px 0;
          padding: 20px;
          border: 1px solid rgba(201, 91, 102, 0.16);
          border-radius: 4px;
          background: rgba(201, 91, 102, 0.06);
        }

        .seats-label {
          margin: 0;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.6px;
          color: #c95b66;
          text-transform: uppercase;
        }

        .seats-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0;
        }

        .seat-tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 36px;
          padding: 0 12px;
          border: 1px solid #c95b66;
          border-radius: 3px;
          background: transparent;
          color: #c95b66;
          font-family: "Cormorant Garamond", serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .ticket-footer {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-top: 28px;
          border-top: 1px solid rgba(17, 17, 17, 0.12);
          text-align: center;
        }

        .footer-terms {
          margin: 0;
          font-size: 12px;
          color: rgba(17, 17, 17, 0.62);
          line-height: 1.6;
        }

        .footer-issued {
          margin: 0;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.6px;
          color: rgba(17, 17, 17, 0.48);
          text-transform: uppercase;
        }

        @media print {
          body {
            background: #f7f2ea;
            margin: 0;
            padding: 0;
          }

          .ticket-container {
            max-width: 100%;
            margin: 0;
            padding: 48px;
            border: none;
            border-radius: 0;
            page-break-after: always;
            box-shadow: none;
          }

          .ticket-image-wrapper {
            max-width: 100%;
          }
        }
      </style>
    `;

    const printWindow = window.open("", "", "width=800,height=900");
    printWindow.document.write("<!DOCTYPE html><html><head>");
    printWindow.document.write(styleSheet);
    printWindow.document.write("</head><body>");
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    // Tunggu fonts & images load sebelum print
    setTimeout(() => {
      printWindow.print();
    }, 500);

    onPrint();
  };

  return (
    <div className="ticket-preview-wrapper">
      <div
        ref={printRef}
        className={
          useImageTemplate ? "ticket-image-wrapper" : "ticket-container"
        }
      >
        {useImageTemplate ? (
          // ===== MODE 2: Image-based template =====
          <div className="ticket-image-container">
            <img src={templateImage} alt="Ticket Template" />
            <div className="ticket-image-overlay">
              {/* Top: Passenger + Reference */}
              <div className="ticket-image-top">
                <div className="ticket-image-passenger">
                  <span className="label">Group</span>
                  <div className="name">
                    {booking.group_name || booking.user_name}
                  </div>
                  <span className="label" style={{ marginTop: "12px" }}>
                    Booking Ref
                  </span>
                  <div style={{ fontSize: "18px", color: "#ffffff" }}>
                    #{booking.id}
                  </div>
                </div>
                <div className="ticket-image-ref">
                  <span className="label">Email</span>
                  <div style={{ fontSize: "11px", color: "#ffffff" }}>
                    {booking.email}
                  </div>
                </div>
              </div>

              {/* Middle: Package, Date, Amount */}
              <div className="ticket-image-middle">
                <div className="ticket-image-info">
                  <span className="label">Package</span>
                  <div className="value">{booking.package_name || "N/A"}</div>
                </div>
                <div className="ticket-image-info">
                  <span className="label">Departure</span>
                  <div className="value">
                    {booking.date_departure
                      ? new Date(booking.date_departure).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "N/A"}
                  </div>
                </div>
                <div className="ticket-image-info">
                  <span className="label">Amount</span>
                  <div className="value" style={{ color: "#ffc107" }}>
                    {formatRupiah(booking.amount || 0)}
                  </div>
                </div>
              </div>

              {/* Bottom: Seats + QR */}
              <div className="ticket-image-bottom">
                <div className="ticket-image-seats">
                  <span className="label">Seats</span>
                  <div className="tags">
                    {ticketSeats.length > 0 ? (
                      ticketSeats.map((seat) => (
                        <div key={seat.id} className="tag">
                          {seat.seat_number}
                          {seat.passenger_name ? ` · ${seat.passenger_name}` : ""}
                        </div>
                      ))
                    ) : (
                      <div className="tag">N/A</div>
                    )}
                  </div>
                </div>
                {booking.qr_code && (
                  <div className="ticket-image-qr">
                    <img src={booking.qr_code} alt="QR Code" />
                    <p>Check-in</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // ===== MODE 1: HTML-based design (original) =====
          <>
            {/* Header */}
            <div className="ticket-header">
              <div className="ticket-brand">
                <h1 className="ticket-brand-main">NAMA</h1>
                <small className="ticket-brand-sub">MARINE</small>
              </div>
              <p className="ticket-subtitle">Yacht Charter Ticket</p>
            </div>

            {/* Divider */}
            <div className="ticket-divider"></div>

            {/* Reference */}
            <div className="ticket-reference">
              <span className="ticket-ref-label">Booking Reference</span>
              <span className="ticket-ref-number">#{booking.id}</span>
            </div>

            {/* 3-Column Info Grid */}
            <div className="ticket-info-grid">
              {/* Column 1: Passenger */}
              <div className="ticket-info-card">
                <span className="card-label">Group</span>
                <h3 className="card-value">
                  {booking.group_name || booking.user_name}
                </h3>
                <p className="card-meta">{booking.email}</p>
                <p className="card-meta">
                  {booking.jml_pax || booking.pax_count} pax
                </p>
              </div>

              {/* Column 2: Package & Destination */}
              <div className="ticket-info-card">
                <span className="card-label">Package & Route</span>
                <h3 className="card-value">{booking.package_name || "N/A"}</h3>
                <p className="card-meta">
                  Boat:{" "}
                  {booking.boat_departure_name || booking.boat_name || "N/A"}
                </p>
                {booking.date_return && (
                  <p className="card-meta card-badge">Round Trip</p>
                )}
              </div>

              {/* Column 3: Dates & Amount */}
              <div className="ticket-info-card">
                <span className="card-label">Departure</span>
                <h3 className="card-value">
                  {booking.date_departure
                    ? new Date(booking.date_departure).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )
                    : "N/A"}
                </h3>
                <p className="card-meta">
                  {booking.date_departure
                    ? new Date(booking.date_departure).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        },
                      )
                    : ""}
                </p>
                <p className="card-amount">
                  {formatRupiah(booking.amount || 0)}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="ticket-divider"></div>

            {/* QR Code */}
            {booking.qr_code && (
              <div className="ticket-qr-section">
                <p className="qr-label">Check-in QR Code</p>
                <div className="qr-container">
                  <img
                    src={booking.qr_code}
                    alt="QR Code"
                    className="qr-image"
                  />
                </div>
                <p className="qr-instruction">Scan at check-in counter</p>
              </div>
            )}

            {/* Divider */}
            <div className="ticket-divider"></div>

            {/* Seats */}
            {ticketSeats.length > 0 && (
              <div className="ticket-seats-section">
                <p className="seats-label">Assigned Seats & Passengers</p>
                <div className="seats-grid">
                  {ticketSeats.map((seat) => (
                    <div key={seat.id} className="seat-tag">
                      {seat.seat_number}
                      {seat.passenger_name ? ` — ${seat.passenger_name}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="ticket-footer">
              <p className="footer-terms">
                Please arrive 30 minutes before departure. Present this ticket
                during check-in.
              </p>
              <p className="footer-issued">
                Issued{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="ticket-actions">
        <button className="btn-print" onClick={handlePrint}>
          🖨️ Print Ticket
        </button>
        <button className="btn-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
