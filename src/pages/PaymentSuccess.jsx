import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import SiteChrome from "../components/SiteChrome.jsx";
import "./PaymentPage.css";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const externalId = searchParams.get("external_id");
  const referenceId = searchParams.get("reference_id");

  useEffect(() => {
    // Simulate fetching booking details from backend
    // In a real app, you'd fetch from /api/transactions with the external_id
    const fetchBookingDetails = async () => {
      try {
        // For now, just show success state
        // Later: const response = await fetch(`/api/bookings/${externalId}`);
        setBookingDetails({
          externalId: externalId || referenceId || "TXN-" + Date.now(),
          status: "PAID",
          amount: 0, // Would come from backend
          packageName: "", // Would come from backend
          bookingDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });
      } catch (err) {
        console.error("Failed to fetch booking details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (externalId || referenceId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [externalId, referenceId]);

  return (
    <SiteChrome breadcrumb={["NAMA Marine", "Payment Success"]}>
      <div className="payment-page payment-success-page">
        <div className="payment-container">
          <div className="payment-icon success-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1 className="payment-title">Payment Successful!</h1>

          <p className="payment-subtitle">
            Thank you for your payment. Your booking has been confirmed.
          </p>

          {bookingDetails && (
            <div className="payment-details">
              <div className="detail-item">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value">{bookingDetails.externalId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value status-paid">
                  {bookingDetails.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Date</span>
                <span className="detail-value">
                  {bookingDetails.bookingDate}
                </span>
              </div>
            </div>
          )}

          <div className="payment-message">
            <p>
              A confirmation email has been sent to your registered email
              address. You can track your booking from your account dashboard.
            </p>
          </div>

          <div className="payment-actions">
            <Link to="/packages" className="btn btn-primary">
              Continue Browsing
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>

          <div className="payment-help">
            <p>
              Need help?{" "}
              <a href="https://linktr.ee/namamarine" target="_blank" rel="noreferrer">
                Contact us on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
