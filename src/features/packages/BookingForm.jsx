import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchDepartures,
  fetchReturns,
  createPayment,
  createManualPayment,
  uploadTransferProof,
} from "../../services/bookingService.js";
import { formatRupiah } from "./formatRupiah.js";

export default function BookingForm({ pkg }) {
  const { isAuthenticated, user } = useAuth();

  const [departures, setDepartures] = useState([]);
  const [returns, setReturns] = useState([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  const [tripType, setTripType] = useState("departure_only");
  const [departureId, setDepartureId] = useState("");
  const [returnId, setReturnId] = useState("");
  const [pax, setPax] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Group booking: 1 person books on behalf of a group, and each seat gets
  // its own occupant name + NIK (for the passenger manifest).
  const [groupName, setGroupName] = useState("");
  const [passengerNames, setPassengerNames] = useState([""]);
  const [passengerNiks, setPassengerNiks] = useState([""]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // After a manual (bank transfer) booking is created, we show a small
  // upload step right here so the admin has the proof right away.
  const [manualBookingId, setManualBookingId] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofStatus, setProofStatus] = useState("idle"); // idle | uploading | done | error
  const [proofError, setProofError] = useState("");

  // Confirmation modal shown right before "Proceed to Payment" actually
  // triggers the payment/booking API call.
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([fetchDepartures(), fetchReturns()])
      .then(([dep, ret]) => {
        setDepartures(Array.isArray(dep) ? dep : []);
        setReturns(Array.isArray(ret) ? ret : []);
        setScheduleLoaded(true);
      })
      .catch(() => setScheduleLoaded(true));
  }, [isAuthenticated]);

  // Prefill group name with the booker's own name once available.
  useEffect(() => {
    if (user?.fullname && !groupName) {
      setGroupName(user.fullname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Keep the passenger name inputs in sync with the number of pax:
  // grow/shrink the array while preserving whatever was already typed.
  useEffect(() => {
    const count = Math.max(1, Number(pax) || 0);
    setPassengerNames((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
    setPassengerNiks((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
  }, [pax]);

  const pricePerPax = Number(pkg.price_per_pax) || 0;
  const total = useMemo(
    () => pricePerPax * (Number(pax) || 0),
    [pricePerPax, pax],
  );

  if (!isAuthenticated) {
    return (
      <div className="nama-booking-login-note">
        <p>
          Please{" "}
          <Link to="/login" state={{ from: `/packages/${pkg.id}` }}>
            login
          </Link>{" "}
          first to book this package.
        </p>
      </div>
    );
  }

  const handlePassengerNameChange = (index, value) => {
    setPassengerNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handlePassengerNikChange = (index, value) => {
    // NIK is numeric only, max 16 digits (Indonesian NIK length)
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    setPassengerNiks((prev) => {
      const next = [...prev];
      next[index] = digitsOnly;
      return next;
    });
  };

  const buildPayload = () => ({
    user_id: user?.id,
    package_id: pkg.id,
    package_name: pkg.title,
    schedule_departure_id: Number(departureId),
    schedule_return_id: tripType === "round_trip" ? Number(returnId) : null,
    jml_pax: Number(pax),
    amount: total,
    trip_type: tripType,
    // Required by backend for Xendit invoice
    email: user?.email,
    phone: user?.phone,
    fullname: user?.fullname,
    // Group booking fields
    group_name: groupName.trim() || user?.fullname || "",
    passenger_names: passengerNames.map((n) => n.trim()),
    passenger_niks: passengerNiks.map((n) => n.trim()),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!departureId) {
      setError("Please select a departure schedule.");
      return;
    }
    if (tripType === "round_trip" && !returnId) {
      setError("Please select a return schedule.");
      return;
    }
    if (!groupName.trim()) {
      setError("Please enter a group/booker name.");
      return;
    }
    if (passengerNames.some((n) => !n.trim())) {
      setError("Please fill in the name for every passenger/seat.");
      return;
    }
    if (passengerNiks.some((n) => n.trim().length !== 16)) {
      setError(
        "Please fill in a valid 16-digit NIK (national ID number) for every passenger.",
      );
      return;
    }

    // Don't call the payment API yet — show a confirmation summary first.
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    const payload = buildPayload();

    setSubmitting(true);
    setShowConfirm(false);
    try {
      if (paymentMethod === "online") {
        const res = await createPayment(payload);
        window.location.href = res.checkout_link;
      } else {
        const res = await createManualPayment(payload);
        setManualBookingId(res.booking_id || null);
        setSuccess(
          res.message ||
            "Booking created successfully, awaiting payment verification.",
        );
      }
    } catch (err) {
      console.error("[BookingForm] Payment error:", err);

      // Extract error message and Request-ID from error
      let errorMessage = "Failed to create booking, please try again.";
      let requestId = "N/A";

      if (err.message) {
        errorMessage = err.message;
      }

      if (err.data) {
        requestId = err.data.request_id || err.data.requestId || "N/A";
      }

      setError(
        requestId !== "N/A"
          ? `${errorMessage} (Request-ID: ${requestId})`
          : errorMessage,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !manualBookingId) return;

    setProofStatus("uploading");
    setProofError("");
    try {
      await uploadTransferProof(manualBookingId, proofFile);
      setProofStatus("done");
    } catch (err) {
      console.error("[BookingForm] Transfer proof upload error:", err);
      setProofError(err.message || "Failed to upload transfer proof.");
      setProofStatus("error");
    }
  };

  const selectedDeparture = departures.find(
    (s) => String(s.id) === String(departureId),
  );
  const selectedReturn = returns.find(
    (s) => String(s.id) === String(returnId),
  );

  return (
    <form className="nama-booking-form" onSubmit={handleSubmit}>
      <h2>Book This Package</h2>

      {error && <p className="nama-booking-error">{error}</p>}
      {success && <p className="nama-booking-success">{success}</p>}

      {manualBookingId && proofStatus !== "done" && (
        <div className="nama-proof-upload">
          <p className="nama-proof-upload-title">
            Upload Transfer Proof (Booking #{manualBookingId})
          </p>
          <p className="nama-booking-hint">
            Attach a screenshot/photo of your bank transfer receipt (JPG/PNG,
            max 3MB) so the admin can verify it faster.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
          />
          {proofError && <p className="nama-booking-error">{proofError}</p>}
          <button
            type="button"
            className="nama-booking-submit nama-proof-upload-btn"
            disabled={!proofFile || proofStatus === "uploading"}
            onClick={handleUploadProof}
          >
            {proofStatus === "uploading" ? "Uploading..." : "Upload Proof"}
          </button>
        </div>
      )}

      {proofStatus === "done" && (
        <p className="nama-booking-success">
          Transfer proof uploaded. We'll verify it shortly.
        </p>
      )}

      <div className="nama-booking-row">
        <div className="nama-booking-field">
          <label htmlFor="tripType">Trip Type</label>
          <select
            id="tripType"
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
          >
            <option value="departure_only">One Way</option>
            <option value="round_trip">Round Trip</option>
          </select>
        </div>

        <div className="nama-booking-field">
          <label htmlFor="pax">Number of Passengers</label>
          <input
            id="pax"
            type="number"
            min={1}
            value={pax}
            onChange={(e) => setPax(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="nama-booking-row">
        <div className="nama-booking-field">
          <label htmlFor="departure">Departure Schedule</label>
          <select
            id="departure"
            value={departureId}
            onChange={(e) => setDepartureId(e.target.value)}
            required
          >
            <option value="">
              {scheduleLoaded ? "Select schedule" : "Loading..."}
            </option>
            {departures.map((s) => (
              <option key={s.id} value={s.id}>
                {s.boat_name} — {s.date} ({s.total_pax} slots)
              </option>
            ))}
          </select>
        </div>

        {tripType === "round_trip" && (
          <div className="nama-booking-field">
            <label htmlFor="return">Return Schedule</label>
            <select
              id="return"
              value={returnId}
              onChange={(e) => setReturnId(e.target.value)}
              required
            >
              <option value="">
                {scheduleLoaded ? "Select schedule" : "Loading..."}
              </option>
              {returns.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.boat_name} — {s.date} ({s.total_pax} slots)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="nama-booking-field">
        <label htmlFor="groupName">Group / Booker Name</label>
        <input
          id="groupName"
          type="text"
          placeholder="e.g. Aditya's Family Trip"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
        <p className="nama-booking-hint">
          This name identifies the whole group's booking. It defaults to your
          own name but you can change it (e.g. a company or family trip
          name).
        </p>
      </div>

      <div className="nama-booking-field">
        <label>Passenger Names &amp; NIK (1 per seat)</label>
        <div className="nama-passenger-list">
          {passengerNames.map((name, index) => (
            <div className="nama-passenger-row" key={index}>
              <input
                type="text"
                className="nama-passenger-input"
                placeholder={`Passenger ${index + 1} full name`}
                value={name}
                onChange={(e) =>
                  handlePassengerNameChange(index, e.target.value)
                }
                required
              />
              <input
                type="text"
                inputMode="numeric"
                className="nama-passenger-input nama-passenger-nik"
                placeholder="NIK (16 digit)"
                value={passengerNiks[index] || ""}
                onChange={(e) =>
                  handlePassengerNikChange(index, e.target.value)
                }
                maxLength={16}
                required
              />
            </div>
          ))}
        </div>
        <p className="nama-booking-hint">
          Name is what appears on each ticket/boarding pass. NIK is only used
          internally for the passenger manifest and is not printed on the
          ticket.
        </p>
      </div>

      <div className="nama-booking-field">
        <label htmlFor="paymentMethod">Payment Method</label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="online">Online (Xendit)</option>
          <option value="manual">Bank Transfer</option>
        </select>
      </div>

      <div className="nama-booking-total">
        <span>Total</span>
        <span>{formatRupiah(total)}</span>
      </div>

      <button
        className="nama-booking-submit"
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Processing..."
          : paymentMethod === "online"
            ? "Proceed to Payment"
            : "Create Booking"}
      </button>

      <p className="nama-booking-note">
        Slots will be reduced automatically after booking is created.
      </p>

      {showConfirm && (
        <div
          className="nama-confirm-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="nama-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirm Your Booking</h3>
            <p className="nama-confirm-modal-subtitle">
              Please double-check the details below before proceeding to
              payment.
            </p>

            <dl className="nama-confirm-modal-list">
              <dt>Package</dt>
              <dd>{pkg.title}</dd>

              <dt>Trip Type</dt>
              <dd>{tripType === "round_trip" ? "Round Trip" : "One Way"}</dd>

              <dt>Departure</dt>
              <dd>
                {selectedDeparture
                  ? `${selectedDeparture.boat_name} — ${selectedDeparture.date}`
                  : "-"}
              </dd>

              {tripType === "round_trip" && (
                <>
                  <dt>Return</dt>
                  <dd>
                    {selectedReturn
                      ? `${selectedReturn.boat_name} — ${selectedReturn.date}`
                      : "-"}
                  </dd>
                </>
              )}

              <dt>Group / Booker Name</dt>
              <dd>{groupName || "-"}</dd>

              <dt>Passengers ({passengerNames.length})</dt>
              <dd>
                <ol className="nama-confirm-modal-passengers">
                  {passengerNames.map((name, i) => (
                    <li key={i}>
                      {name || "(empty)"} — NIK: {passengerNiks[i] || "-"}
                    </li>
                  ))}
                </ol>
              </dd>

              <dt>Payment Method</dt>
              <dd>
                {paymentMethod === "online"
                  ? "Online (Xendit)"
                  : "Bank Transfer"}
              </dd>

              <dt>Total</dt>
              <dd className="nama-confirm-modal-total">
                {formatRupiah(total)}
              </dd>
            </dl>

            <div className="nama-confirm-modal-actions">
              <button
                type="button"
                className="nama-confirm-modal-btn-no"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Tidak, periksa lagi
              </button>
              <button
                type="button"
                className="nama-confirm-modal-btn-yes"
                onClick={handleConfirmedSubmit}
                disabled={submitting}
              >
                {submitting
                  ? "Processing..."
                  : paymentMethod === "online"
                    ? "Ya, Lanjut ke Pembayaran"
                    : "Ya, Buat Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
