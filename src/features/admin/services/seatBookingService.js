import { api } from "../../../services/api.js";
import { API_URL } from "../../../config/BaseUrl.js";

/**
 * Helper to extract array from API response
 * API returns either: array[] or {value: array[], Count: number}
 */
function extractData(data) {
  if (Array.isArray(data)) return data;
  if (data && data.value) return data.value;
  if (data && data.data) return data.data;
  return [];
}

/**
 * Fetch all settled bookings (payments with status SETTLED)
 * Includes: payment_id, schedule_departure_id, schedule_return_id,
 * jml_pax, trip_type, boat info, etc
 */
export async function fetchSettledBookings() {
  try {
    const data = await api.get("/api/admin/bookings/settled", { auth: true });
    const bookings = extractData(data);

    // Enrich each booking with capacity info
    return Promise.all(
      bookings.map(async (booking) => {
        try {
          const detail = await fetchBookingDetail(booking.id);
          return {
            ...booking,
            ...detail, // merge capacity, boat_name, trip_type, etc
          };
        } catch (err) {
          console.warn(
            `[seatBookingService] Could not fetch detail for booking ${booking.id}`,
          );
          return booking; // fallback to original booking data
        }
      }),
    );
  } catch (error) {
    console.error("[seatBookingService] fetchSettledBookings failed:", error);
    throw error;
  }
}

/**
 * Fetch boat seat layout for a specific schedule/boat
 * Uses MVC boat-level seat system (not schedule-specific)
 * Response: [ { id, boat_id, seat_number, status } ]
 */
export async function fetchYachtSeats(scheduleId) {
  try {
    // Get boat seats by schedule ID (endpoint will resolve boat from schedule)
    const data = await api.get(
      `/api/admin/boat-seats?schedule_id=${scheduleId}`,
      { auth: false },
    );
    console.log("[seatBookingService] fetchYachtSeats:", data);
    return extractData(data);
  } catch (error) {
    console.error("[seatBookingService] fetchYachtSeats failed:", error);
    throw error;
  }
}

/**
 * Get booking details with seat assignments
 */
export async function fetchBookingDetail(bookingId) {
  try {
    const data = await api.get(`/api/admin/bookings/${bookingId}`, {
      auth: true,
    });
    return data;
  } catch (error) {
    console.error("[seatBookingService] fetchBookingDetail failed:", error);
    throw error;
  }
}

/**
 * Fetch booked seats for a schedule/departure
 * Returns array of {seat_id, payment_id, seat_number}
 *
 * Note: Endpoint is public-read (no auth required) for MVP testing
 * Production: Add auth filter to Routes.php when needed
 */
export async function fetchBookedSeats(scheduleId, paymentId) {
  try {
    const data = await api.get(
      `/api/admin/booked-seats?schedule_id=${scheduleId}&payment_id=${paymentId}`,
      { auth: false },
    );
    console.log("[seatBookingService] fetchBookedSeats success:", data);
    return extractData(data);
  } catch (error) {
    console.warn(
      "[seatBookingService] fetchBookedSeats failed:",
      error.message,
    );
    // Graceful fallback: return empty array if endpoint is down
    return [];
  }
}

/**
 * Check if booking already has seats assigned (prevents re-assignment)
 * Returns true if user already has assigned seats for this schedule
 */
export function checkIfSeatsAlreadyAssigned(bookedSeats, paymentId) {
  return bookedSeats.some((seat) => seat.payment_id === paymentId);
}

/**
 * Validate capacity: total booked seats should not exceed boat capacity
 * Returns { valid: bool, message: string, available: number }
 */
export function validateCapacity(bookedSeats, boatCapacity, jmlPax, paymentId) {
  // Count seats already booked by others (exclude current payment)
  const otherBookedCount = bookedSeats.filter(
    (seat) => seat.payment_id !== paymentId,
  ).length;

  const availableSeats = boatCapacity - otherBookedCount;
  const canAccommodate = jmlPax <= availableSeats;

  return {
    valid: canAccommodate,
    message: canAccommodate
      ? `Available: ${availableSeats} seats (need ${jmlPax})`
      : `Not enough seats: ${availableSeats} available, need ${jmlPax}`,
    available: availableSeats,
  };
}

/**
 * Fetch ticket data for a specific booking
 * Returns complete ticket info: booking, seats, passenger, schedule, QR code
 * This is backend-driven, so can be called unlimited times
 */
export async function fetchTicket(bookingId) {
  try {
    const data = await api.get(`/admin/ticket/${bookingId}`, {
      auth: false, // Read-only endpoint, no auth needed for MVP
    });
    console.log("[seatBookingService] fetchTicket success:", data);
    return data;
  } catch (error) {
    console.error("[seatBookingService] fetchTicket failed:", error);
    throw error;
  }
}

/**
 * Submit seat assignment to MVC /insert-bookedseats endpoint
 * Uses form POST, not REST API (mirrors MVC flow)
 *
 * Expected by MVC controller:
 * - payment_id: number
 * - seats[]: array of seat IDs
 * - schedule_departure_id: number
 * - schedule_return_id: number (optional)
 */
export async function submitBookedSeats(paymentId, seatIds, paymentData) {
  try {
    const formData = new FormData();
    formData.append("payment_id", paymentId);

    // Append seats as array (MVC expects seats[] format)
    seatIds.forEach((seatId) => {
      formData.append("seats[]", seatId);
    });

    // Append schedule IDs from payment data
    formData.append("schedule_departure_id", paymentData.schedule_departure_id);
    if (paymentData.schedule_return_id) {
      formData.append("schedule_return_id", paymentData.schedule_return_id);
    }

    console.log(
      "[seatBookingService] submitBookedSeats - sending to /insert-bookedseats",
      {
        paymentId,
        seatIds,
        schedule_departure_id: paymentData.schedule_departure_id,
        schedule_return_id: paymentData.schedule_return_id,
      },
    );

    // POST to MVC endpoint (form submission, not JSON API)
    const response = await fetch(`${API_URL}/insert-bookedseats`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    console.log(
      "[seatBookingService] Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[seatBookingService] Response error text:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("[seatBookingService] submitBookedSeats success:", result);
    return result;
  } catch (error) {
    console.error("[seatBookingService] submitBookedSeats failed:", error);
    throw error;
  }
}

/**
 * Submit check-in request to backend
 * Updates attendance field in payments table
 *
 * @param {number} bookingId - Payment ID to check-in
 * @returns {Promise} Response with check-in timestamp
 */
export async function checkInBooking(bookingId) {
  try {
    const data = await api.post(
      "/admin/checkin",
      {
        booking_id: bookingId,
      },
      {
        auth: false, // Public endpoint for MVP
      },
    );
    console.log("[seatBookingService] checkInBooking success:", data);
    return data;
  } catch (error) {
    console.error("[seatBookingService] checkInBooking failed:", error);
    throw error;
  }
}
