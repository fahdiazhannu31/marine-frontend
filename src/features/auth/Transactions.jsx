import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import SiteChrome from "../../components/SiteChrome.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getTransactions } from "../../services/bookingService.js";
import { formatRupiah } from "../packages/formatRupiah.js";
import "./Transactions.css";

export default function Transactions() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, settled, failed

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getTransactions();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to load transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate]);

  const filteredTransactions = transactions.filter((txn) => {
    if (filter === "all") return true;
    return txn.status?.toUpperCase() === filter.toUpperCase();
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { class: "badge-pending", label: "Pending" },
      PAID: { class: "badge-paid", label: "Paid" },
      SETTLED: { class: "badge-settled", label: "Settled" },
      FAILED: { class: "badge-failed", label: "Failed" },
      "ON VERIFICATION": { class: "badge-verification", label: "Awaiting Verification" },
    };
    return statusMap[status?.toUpperCase()] || { class: "badge-default", label: status || "Unknown" };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SiteChrome breadcrumb={["NAMA Marine", "My Transactions"]}>
      <div className="transactions-page">
        <div className="transactions-header">
          <div>
            <h1>Your Transactions</h1>
            <p>Track and manage all your bookings and payments</p>
          </div>
        </div>

        <div className="transactions-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Transactions
          </button>
          <button
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === "settled" ? "active" : ""}`}
            onClick={() => setFilter("settled")}
          >
            Settled
          </button>
          <button
            className={`filter-btn ${filter === "failed" ? "active" : ""}`}
            onClick={() => setFilter("failed")}
          >
            Failed
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <p>Loading your transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>
              {filter === "all"
                ? "You haven't made any bookings yet."
                : `No ${filter} transactions found.`}
            </p>
            <a href="/packages" className="btn-browse">
              Browse Packages
            </a>
          </div>
        ) : (
          <div className="transactions-list">
            <div className="transaction-header-row">
              <div className="col-date">Date</div>
              <div className="col-package">Package</div>
              <div className="col-pax">PAX</div>
              <div className="col-amount">Amount</div>
              <div className="col-status">Status</div>
              <div className="col-action">Details</div>
            </div>

            {filteredTransactions.map((txn) => {
              const badge = getStatusBadge(txn.status);
              return (
                <div key={txn.id} className="transaction-row">
                  <div className="col-date">{formatDate(txn.created_at)}</div>
                  <div className="col-package">
                    <div className="package-info">
                      <span className="package-name">{txn.package_name}</span>
                      <span className="transaction-id">{txn.external_id}</span>
                    </div>
                  </div>
                  <div className="col-pax">{txn.jml_pax} pax</div>
                  <div className="col-amount">{formatRupiah(txn.amount)}</div>
                  <div className="col-status">
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="col-action">
                    <button className="btn-view-detail">View</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteChrome>
  );
}
