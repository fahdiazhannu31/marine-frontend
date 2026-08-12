import { useRef, useState, useEffect } from "react";
import { formatRupiah } from "../../packages/formatRupiah.js";
import "./TicketPreview3Col.css";

/**
 * Ticket Preview - 3 Column Layout
 * Left: Boat Image | Middle: Ticket Info | Right: QR Code
 *
 * Props:
 * - booking: ticket data from backend (can include boat_image URL)
 * - seats: array of seat assignments
 * - boatImage: URL to boat/yacht photo (optional, overrides booking.boat_image)
 *   → Can be passed directly or fetched from backend via boat_departure_name
 * - onPrint: callback when print clicked
 * - onClose: callback when close clicked
 */
export default function TicketPreview3Col({
  booking = null,
  seats = [],
  boatImage = null,
  onPrint = () => {},
  onClose = () => {},
}) {
  const printRef = useRef();
  const [displayBoatImage, setDisplayBoatImage] = useState(
    boatImage || booking?.boat_image,
  );

  // Auto-fetch boat image from backend if not provided
  useEffect(() => {
    // Priority: boatImage prop > booking.boat_image > fetch from backend
    if (boatImage) {
      setDisplayBoatImage(boatImage);
      return;
    }

    if (booking?.boat_image) {
      setDisplayBoatImage(booking.boat_image);
      return;
    }

    if (!booking?.boat_departure_name) return;

    // Fetch boat image from backend by boat name
    const fetchBoatImage = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(
          `${baseUrl}/api/admin/boat-image?name=${encodeURIComponent(booking.boat_departure_name)}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.image_url) {
            setDisplayBoatImage(data.image_url);
          }
        }
      } catch (error) {
        console.warn("Could not fetch boat image from backend:", error);
        // Fallback to default image or placeholder
        setDisplayBoatImage(null);
      }
    };

    fetchBoatImage();
  }, [booking, boatImage]);

  if (!booking) return null;

  const ticketSeats =
    booking.seats && booking.seats.length > 0 ? booking.seats : seats;

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
          font-family: "Inter", sans-serif;
          line-height: 1.6;
        }

        .ticket-container-3col {
          max-width: 100%;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          min-height: 320px;
          border: none;
          background: #f7f2ea;
          page-break-after: always;
        }

        .ticket-col-boat {
          position: relative;
          background: linear-gradient(135deg, #1a6b7c 0%, #00a8cc 100%);
          overflow: hidden;
        }

        .ticket-col-boat img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ticket-col-boat::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
          pointer-events: none;
        }

        .ticket-col-info {
          background: #f7f2ea;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-left: 1px solid rgba(17, 17, 17, 0.1);
          border-right: 1px solid rgba(17, 17, 17, 0.1);
        }

        .ticket-info-header {
          text-align: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(17, 17, 17, 0.08);
        }

        .ticket-info-brand {
          font-family: "Cormorant Garamond", serif;
          font-size: 20px;
          font-weight: 500;
          color: #111111;
          letter-spacing: 8px;
          line-height: 0.86;
          margin: 0;
        }

        .ticket-info-brand-sub {
          font-size: 7px;
          color: #c95b66;
          font-weight: 700;
          letter-spacing: 6px;
          margin-top: 2px;
        }

        .ticket-info-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          justify-content: center;
        }

        .ticket-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(17, 17, 17, 0.06);
          font-size: 12px;
        }

        .ticket-info-row:last-child {
          border-bottom: none;
        }

        .ticket-info-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: rgba(17, 17, 17, 0.48);
          text-transform: uppercase;
          flex: 0 0 40%;
        }

        .ticket-info-value {
          font-family: "Cormorant Garamond", serif;
          font-size: 13px;
          font-weight: 500;
          color: #111111;
          text-align: right;
          flex: 1;
        }

        .ticket-info-value.amount {
          color: #c95b66;
          font-weight: 600;
        }

        .ticket-col-qr {
          background: #f7f2ea;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .ticket-qr-box {
          padding: 10px;
          border: 2px solid rgba(17, 17, 17, 0.2);
          border-radius: 3px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ticket-qr-img {
          width: 110px;
          height: 110px;
          display: block;
          margin: 0;
        }

        .ticket-qr-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          color: rgba(17, 17, 17, 0.54);
          text-transform: uppercase;
          text-align: center;
          margin-top: 4px;
        }

        .ticket-seats-list {
          font-size: 8px;
          color: rgba(17, 17, 17, 0.62);
          text-align: center;
          margin-top: 6px;
        }

        .ticket-seats-tags {
          display: flex;
          gap: 3px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 4px;
        }

        .ticket-seat-tag {
          padding: 2px 5px;
          border: 1px solid #c95b66;
          border-radius: 2px;
          color: #c95b66;
          font-family: "Cormorant Garamond", serif;
          font-size: 8px;
          font-weight: 500;
        }

        @media print {
          body {
            background: #f7f2ea;
            margin: 0;
            padding: 0;
          }

          .ticket-container-3col {
            max-width: 100%;
            margin: 0;
            border: none;
            box-shadow: none;
            page-break-after: always;
          }
        }
      </style>
    `;

    const printWindow = window.open("", "", "width=1000,height=600");
    printWindow.document.write("<!DOCTYPE html><html><head>");
    printWindow.document.write(styleSheet);
    printWindow.document.write("</head><body>");
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);

    onPrint();
  };

  return (
    <div className="ticket-preview-wrapper">
      <div ref={printRef} className="ticket-container-3col">
        {/* LEFT: Boat Image */}
        <div className="ticket-col-boat">
          {displayBoatImage ? (
            <img src={displayBoatImage} alt="Boat/Yacht" />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#fff",
                fontSize: "24px",
              }}
            >
              🚤
            </div>
          )}
        </div>

        {/* MIDDLE: Ticket Information */}
        <div className="ticket-col-info">
          <div className="ticket-info-header">
            <div className="ticket-info-brand">NAMA</div>
            <div className="ticket-info-brand-sub">MARINE</div>
          </div>

          <div className="ticket-info-body">
            <div className="ticket-info-row">
              <span className="ticket-info-label">Group</span>
              <span className="ticket-info-value">
                {booking.group_name || booking.user_name}
              </span>
            </div>

            {Array.isArray(booking.passenger_names) &&
              booking.passenger_names.length > 0 && (
                <div className="ticket-info-row">
                  <span className="ticket-info-label">Passengers</span>
                  <span className="ticket-info-value">
                    {booking.passenger_names.join(", ")}
                  </span>
                </div>
              )}

            <div className="ticket-info-row">
              <span className="ticket-info-label">Ref</span>
              <span className="ticket-info-value">#{booking.id}</span>
            </div>

            <div className="ticket-info-row">
              <span className="ticket-info-label">Package</span>
              <span className="ticket-info-value">
                {booking.package_name || "N/A"}
              </span>
            </div>

            <div className="ticket-info-row">
              <span className="ticket-info-label">Date</span>
              <span className="ticket-info-value">
                {booking.date_departure
                  ? new Date(booking.date_departure).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "N/A"}
              </span>
            </div>

            <div className="ticket-info-row">
              <span className="ticket-info-label">Boat</span>
              <span className="ticket-info-value">
                {booking.boat_departure_name || booking.boat_name || "N/A"}
              </span>
            </div>

            <div className="ticket-info-row">
              <span className="ticket-info-label">Amount</span>
              <span className="ticket-info-value amount">
                {formatRupiah(booking.amount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: QR Code */}
        <div className="ticket-col-qr">
          {booking.qr_code ? (
            <>
              <div className="ticket-qr-box">
                <img
                  src={booking.qr_code}
                  alt="QR Code"
                  className="ticket-qr-img"
                />
              </div>
              <p className="ticket-qr-label">CHECK-IN</p>
            </>
          ) : (
            <p className="ticket-qr-label">No QR Code</p>
          )}

          {ticketSeats.length > 0 && (
            <>
              <p className="ticket-seats-list">Seats</p>
              <div className="ticket-seats-tags">
                {ticketSeats.map((seat) => (
                  <div key={seat.id} className="ticket-seat-tag">
                    {seat.seat_number}
                    {seat.passenger_name ? ` · ${seat.passenger_name}` : ""}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
