import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import SiteChrome from "../components/SiteChrome.jsx";
import "./PaymentPage.css";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const [failureReason, setFailureReason] = useState("Payment was cancelled or failed");
  const [loading, setLoading] = useState(true);

  const referenceId = searchParams.get("reference_id");
  const reason = searchParams.get("reason");

  useEffect(() => {
    const reasons = {
      EXPIRED: "Your payment link has expired. Please try booking again.",
      CANCELLED: "You cancelled the payment. Please try again.",
      FAILED: "Payment processing failed. Please check your details and try again.",
      INVALID: "Invalid transaction. Please try booking again.",
    };

    setFailureReason(reasons[reason] || reasons.FAILED);
    setLoading(false);
  }, [reason]);

  return (
    <SiteChrome breadcrumb={["NAMA Marine", "Payment Failed"]}>
      <div className="payment-page payment-failure-page">
        <div className="payment-container">
          <div className="payment-icon failure-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          <h1 className="payment-title">Payment Failed</h1>

          <p className="payment-subtitle">
            {failureReason}
          </p>

          {referenceId && (
            <div className="payment-details">
              <div className="detail-item">
                <span className="detail-label">Reference ID</span>
                <span className="detail-value">{referenceId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value status-failed">FAILED</span>
              </div>
            </div>
          )}

          <div className="payment-message error-message">
            <p>
              If you believe this is an error or need assistance, please contact our support team.
            </p>
          </div>

          <div className="payment-actions">
            <Link to="/packages" className="btn btn-primary">
              Try Booking Again
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
