import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import YachtSeatMap from "../components/YachtSeatMap.jsx";
import TicketPreview from "../components/TicketPreview.jsx";
import BoardingPass from "../components/BoardingPass.jsx";
import ScheduleSelector from "../components/ScheduleSelector.jsx";
import {
  fetchSettledBookings,
  fetchYachtSeats,
  fetchBookedSeats,
  submitBookedSeats,
  checkIfSeatsAlreadyAssigned,
  validateCapacity,
  fetchTicket,
} from "../services/seatBookingService.js";
import { formatRupiah } from "../../packages/formatRupiah.js";
import "./YachtSeatBooking.css";

export default function YachtSeatBooking() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedScheduleType, setSelectedScheduleType] = useState("departure"); // For round trip
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [assignedSeats, setAssignedSeats] = useState([]);
  const [seatsAlreadyAssigned, setSeatsAlreadyAssigned] = useState(false); // Lock state
  const [capacityError, setCapacityError] = useState("");
  const [status, setStatus] = useState("loading");
  const [assignStatus, setAssignStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showTicket, setShowTicket] = useState(false);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [ticketData, setTicketData] = useState(null); // Backend ticket data
  const [resolvedBoatId, setResolvedBoatId] = useState(null); // boat_id resolved from seats data

  // Load settled bookings
  useEffect(() => {
    let cancelled = false;

    fetchSettledBookings()
      .then((data) => {
        if (!cancelled) {
          setBookings(data);
          setStatus("ready");

          const bookingId = searchParams.get("booking_id");
          if (bookingId) {
            const booking = data.find((b) => b.id === parseInt(bookingId));
            if (booking) {
              setSelectedBooking(booking);
              loadSeats(booking);
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setErrorMsg("Failed to load bookings");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const loadSeats = async (booking) => {
    try {
      setSelectedSeats([]);
      setAssignedSeats([]); // Reset assigned seats when loading new booking
      setCapacityError("");

      // Get correct schedule ID based on trip type
      let scheduleId;
      if (booking.trip_type === "round_trip") {
        // For round trip, user must choose departure or return
        if (selectedScheduleType === "return") {
          scheduleId = booking.schedule_return_id;
        } else {
          scheduleId = booking.schedule_departure_id;
        }
      } else {
        // Single trip (departure or return only)
        scheduleId =
          booking.schedule_departure_id || booking.schedule_return_id;
      }

      if (!scheduleId) {
        setErrorMsg("No valid schedule found for this booking");
        return;
      }

      // Fetch seat layout
      const seatsData = await fetchYachtSeats(scheduleId);
      setSeats(seatsData);

      // Resolve boat_id dari seats data (seat table has boat_id)
      const boatIdFromSeats =
        seatsData.length > 0 ? Number(seatsData[0].boat_id) : null;
      setResolvedBoatId(boatIdFromSeats);

      // Fetch already booked seats
      const paymentId = booking.id;
      const bookedData = await fetchBookedSeats(scheduleId, paymentId);
      setBookedSeats(bookedData);

      // Check if this booking already has seats assigned (MVC: seat lock)
      const alreadyAssigned = checkIfSeatsAlreadyAssigned(
        bookedData,
        paymentId,
      );
      setSeatsAlreadyAssigned(alreadyAssigned);

      // If seats already assigned, populate assignedSeats for display
      if (alreadyAssigned) {
        const assignedSeatIds = bookedData
          .filter((seat) => seat.payment_id === paymentId)
          .map((seat) => seat.seat_id);
        setAssignedSeats(assignedSeatIds);
        setErrorMsg(
          "⚠️ Seats already assigned for this booking. Cannot modify.",
        );
      } else {
        setAssignedSeats([]); // Clear if not assigned
      }

      // Validate boat capacity (MVC: must not exceed capacity)
      const boatCapacity = booking.boat_capacity || 30; // fallback default
      const jmlPax = parseInt(booking.jml_pax || booking.pax_count, 10);
      const validation = validateCapacity(
        bookedData,
        boatCapacity,
        jmlPax,
        paymentId,
      );

      if (!validation.valid) {
        setCapacityError(`❌ ${validation.message}`);
      } else {
        setCapacityError(""); // Clear error if valid
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load seats");
    }
  };

  const handleSelectBooking = async (booking) => {
    setSelectedBooking(booking);
    setShowTicket(false); // Reset ticket view when changing booking
    setShowBoardingPass(false); // Reset boarding pass view when changing booking
    setTicketData(null); // Clear ticket data
    setResolvedBoatId(null); // Reset boat layout until seats load
    // For round trip, default to departure
    if (booking.trip_type === "round_trip") {
      setSelectedScheduleType("departure");
    }
    await loadSeats(booking);
  };

  const handleScheduleTypeChange = async (type) => {
    setSelectedScheduleType(type);
    if (selectedBooking) {
      await loadSeats(selectedBooking);
    }
  };

  const handleSeatToggle = (seatId) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      return [...prev, seatId];
    });
  };

  const validateSeats = () => {
    const maxPax = parseInt(
      selectedBooking.jml_pax || selectedBooking.pax_count,
      10,
    );
    const selectedCount = selectedSeats.length;

    console.log("[validateSeats]", {
      maxPax,
      selectedCount,
      type_maxPax: typeof maxPax,
      type_selectedCount: typeof selectedCount,
    });

    if (selectedCount !== maxPax) {
      setErrorMsg(
        `Please select exactly ${maxPax} seats. Currently selected: ${selectedCount}`,
      );
      return false;
    }
    return true;
  };

  const handleAssignSeats = async () => {
    if (!selectedBooking || selectedSeats.length === 0) {
      setErrorMsg("Please select seats");
      return;
    }

    // Check if already assigned (MVC: prevent re-assignment)
    if (seatsAlreadyAssigned) {
      setErrorMsg("❌ Seats already assigned. Cannot modify.");
      return;
    }

    // Validate capacity before assignment
    const boatCapacity = selectedBooking.boat_capacity || 30;
    const jmlPax = parseInt(
      selectedBooking.jml_pax || selectedBooking.pax_count,
      10,
    );
    const capacityValidation = validateCapacity(
      bookedSeats,
      boatCapacity,
      jmlPax,
      selectedBooking.id,
    );

    if (!capacityValidation.valid) {
      setErrorMsg(`❌ ${capacityValidation.message}`);
      return;
    }

    // Mirror MVC validation: jml_pax === selected seats count
    if (!validateSeats()) {
      return;
    }

    setAssignStatus("loading");
    setErrorMsg("");

    try {
      // Submit to MVC endpoint (form POST, not REST)
      await submitBookedSeats(
        selectedBooking.id,
        selectedSeats,
        selectedBooking,
      );

      setAssignedSeats(selectedSeats);
      setAssignStatus("success");
      setShowTicket(true);
      setSeatsAlreadyAssigned(true); // Lock after assignment

      setTimeout(() => setAssignStatus("idle"), 3000);
      await loadSeats(selectedBooking); // Refresh to show new booked seats
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to assign seats");
      setAssignStatus("error");
    }
  };

  const handlePrintTicket = async () => {
    if (!selectedBooking) {
      setErrorMsg("No booking selected");
      return;
    }

    try {
      setAssignStatus("loading");
      // Fetch fresh ticket data from backend (not from React state)
      const response = await fetchTicket(selectedBooking.id);
      // Extract data from { status, data } response
      setTicketData(response.data || response);
      setShowTicket(true);
      setAssignStatus("success");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load ticket");
      setAssignStatus("error");
    }
  };

  const handlePrintBoardingPass = async () => {
    if (!selectedBooking) {
      setErrorMsg("No booking selected");
      return;
    }

    try {
      setAssignStatus("loading");
      // Fetch fresh ticket data from backend (includes qr_code + seats)
      const response = await fetchTicket(selectedBooking.id);
      setTicketData(response.data || response);
      setShowBoardingPass(true);
      setShowTicket(false);
      setAssignStatus("success");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load boarding pass");
      setAssignStatus("error");
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1>Yacht Seat Booking</h1>
          <p>Assign seats to settled transactions and generate tickets.</p>
        </div>
      </div>

      {status === "error" && (
        <div className="adm-alert adm-alert-danger">
          {errorMsg || "Failed to load bookings"}
        </div>
      )}

      {status === "loading" && (
        <div className="adm-loading">Loading bookings...</div>
      )}

      {status === "ready" && (
        <div className="booking-layout">
            {/* Left: Bookings list */}
            <section className="bookings-section">
              <h2>Settled Bookings</h2>

              {bookings.length === 0 ? (
                <p className="adm-empty">No settled bookings found</p>
              ) : (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <button
                      key={booking.id}
                      className={`booking-card ${
                        selectedBooking?.id === booking.id ? "active" : ""
                      }`}
                      onClick={() => handleSelectBooking(booking)}
                    >
                      <div className="booking-info">
                        <div className="booking-id">#{booking.id}</div>
                        <div className="booking-user">
                          {booking.group_name || booking.user_name}
                        </div>
                        <div className="booking-pax">
                          {booking.jml_pax || booking.pax_count} pax
                        </div>
                        {booking.boat_name && (
                          <div className="booking-boat">
                            🚢 {booking.boat_name}
                          </div>
                        )}
                        {booking.trip_type === "round_trip" && (
                          <div className="booking-trip">🔄 Round Trip</div>
                        )}
                        <div className="booking-price">
                          {formatRupiah(booking.amount)}
                        </div>
                      </div>
                      <div className="booking-status">
                        <span className="status-badge status-settled">
                          {booking.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Right: Seat assignment */}
            {selectedBooking && (
              <section className="seat-assignment-section">
                <div className="assignment-header">
                  <h2>Assign Seats</h2>
                  <p className="booking-summary">
                    Booking #{selectedBooking.id} •{" "}
                    {selectedBooking.jml_pax || selectedBooking.pax_count} pax •{" "}
                    {selectedBooking.group_name || selectedBooking.user_name}
                  </p>
                  {selectedBooking.trip_type === "round_trip" && (
                    <p className="trip-type-badge">🔄 Round Trip</p>
                  )}
                  {selectedBooking.boat_name && (
                    <p className="boat-info">🚢 {selectedBooking.boat_name}</p>
                  )}
                </div>

                {Array.isArray(selectedBooking.passengers) &&
                  selectedBooking.passengers.length > 0 && (
                    <div className="adm-alert adm-alert-info">
                      <strong>Passenger order:</strong> click seats in this
                      order so each name/NIK lines up with the right seat —{" "}
                      {selectedBooking.passengers
                        .map(
                          (p, i) =>
                            `${i + 1}. ${p.name}${p.nik ? ` (NIK: ${p.nik})` : ""}`,
                        )
                        .join("  ·  ")}
                    </div>
                  )}

                {/* Round trip selector */}
                {selectedBooking.trip_type === "round_trip" && (
                  <ScheduleSelector
                    selectedType={selectedScheduleType}
                    onTypeChange={handleScheduleTypeChange}
                  />
                )}

                {/* Capacity check result */}
                {capacityError && (
                  <div className="adm-alert adm-alert-warning">
                    {capacityError}
                  </div>
                )}

                {/* Seat lock warning */}
                {seatsAlreadyAssigned && (
                  <div className="adm-alert adm-alert-warning">
                    🔒 Seats already assigned. Editing disabled.
                  </div>
                )}

                {errorMsg && (
                  <div className="adm-alert adm-alert-danger">
                    {errorMsg}
                  </div>
                )}

                {assignStatus === "success" && (
                  <div className="adm-alert adm-alert-success">
                    Seats assigned successfully!
                  </div>
                )}

                <YachtSeatMap
                  seats={seats}
                  selectedSeats={selectedSeats}
                  onSeatToggle={handleSeatToggle}
                  maxSeats={parseInt(
                    selectedBooking.jml_pax || selectedBooking.pax_count,
                    10,
                  )}
                  paymentId={selectedBooking.id}
                  bookedSeats={bookedSeats}
                  isLocked={seatsAlreadyAssigned}
                  boatId={resolvedBoatId}
                />

                <div className="assignment-actions">
                  <button
                    className="adm-btn adm-btn-primary"
                    onClick={handleAssignSeats}
                    disabled={
                      selectedSeats.length === 0 ||
                      assignStatus === "loading" ||
                      seatsAlreadyAssigned ||
                      !!capacityError ||
                      selectedSeats.length !==
                        parseInt(
                          selectedBooking.jml_pax || selectedBooking.pax_count,
                          10,
                        )
                    }
                  >
                    {seatsAlreadyAssigned
                      ? "🔒 Already Assigned"
                      : assignStatus === "loading"
                        ? "Assigning..."
                        : `Assign Seats (${selectedSeats.length}/${parseInt(selectedBooking.jml_pax || selectedBooking.pax_count, 10)})`}
                  </button>

                  <button
                    className="adm-btn adm-btn-secondary"
                    onClick={handlePrintTicket}
                    disabled={!selectedBooking}
                  >
                    Print Ticket
                  </button>

                  <button
                    className="adm-btn adm-btn-secondary"
                    onClick={handlePrintBoardingPass}
                    disabled={!selectedBooking}
                  >
                    🎫 Print Boarding Pass
                  </button>
                </div>

                {showTicket && ticketData && (
                  <TicketPreview
                    booking={ticketData}
                    seats={ticketData.seats || []}
                    onPrint={() => {}}
                    onClose={() => setShowTicket(false)}
                  />
                )}

                {showBoardingPass && ticketData && (
                  <BoardingPass
                    booking={ticketData}
                    onClose={() => setShowBoardingPass(false)}
                  />
                )}
              </section>
            )}
          </div>
        )}
    </div>
  );
}
