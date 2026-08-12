import { api } from "./api";

export async function fetchDepartures() {
  return api.get("/api/schedules/departures");
}

export async function fetchReturns() {
  return api.get("/api/schedules/returns");
}

export async function createPayment(payload) {
  console.log("[bookingService] Creating payment with payload:", payload);

  // Send as JSON (not FormData) for /api/payments endpoint
  const jsonPayload = {
    package_id: payload.package_id,
    package_name: payload.package_name,
    schedule_departure_id: payload.schedule_departure_id,
    schedule_return_id: payload.schedule_return_id,
    jml_pax: payload.jml_pax,
    amount: payload.amount,
    trip_type: payload.trip_type,
    group_name: payload.group_name,
    passenger_names: payload.passenger_names,
    passenger_niks: payload.passenger_niks,
  };

  return fetch("http://localhost:8080/api/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("nama_marine_token")}`,
    },
    body: JSON.stringify(jsonPayload),
  })
    .then(async (res) => {
      console.log("[bookingService] Response status:", res.status);
      const contentType = res.headers.get("content-type");
      console.log("[bookingService] Response content-type:", contentType);

      let data = {};
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
          console.log("[bookingService] Response body (JSON):", data);
        } catch (e) {
          console.error("[bookingService] Failed to parse JSON:", e);
          data = { error: "Invalid JSON response from server" };
        }
      } else {
        const text = await res.text();
        console.log("[bookingService] Response body (text):", text);
        if (text) {
          data = { error: text };
        } else {
          data = { error: "Empty response from server" };
        }
      }

      if (!res.ok) {
        const err = new Error(
          data.error || data.message || `HTTP ${res.status}`,
        );
        err.status = res.status;
        err.data = data;
        throw err;
      }
      if (!data.checkout_link)
        throw new Error(data.error || "No checkout link returned");
      return data;
    })
    .catch((err) => {
      console.error("[bookingService] Payment creation failed:", err);
      throw err;
    });
}

export async function createManualPayment(payload) {
  console.log(
    "[bookingService] Creating manual payment with payload:",
    payload,
  );

  // Convert to JSON format for API endpoint
  const jsonPayload = {
    package_id: payload.package_id,
    package_name: payload.package_name,
    schedule_departure_id: payload.schedule_departure_id,
    schedule_return_id: payload.schedule_return_id,
    jml_pax: payload.jml_pax,
    amount: payload.amount,
    trip_type: payload.trip_type,
    group_name: payload.group_name,
    passenger_names: payload.passenger_names,
    passenger_niks: payload.passenger_niks,
  };

  return fetch("http://localhost:8080/api/payments/manual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("nama_marine_token")}`,
    },
    body: JSON.stringify(jsonPayload),
  })
    .then(async (res) => {
      console.log("[bookingService] Response status:", res.status);
      const contentType = res.headers.get("content-type");
      console.log("[bookingService] Response content-type:", contentType);

      let data = {};
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
          console.log("[bookingService] Response body (JSON):", data);
        } catch (e) {
          console.error("[bookingService] Failed to parse JSON:", e);
          data = { error: "Invalid JSON response from server" };
        }
      } else {
        const text = await res.text();
        console.log("[bookingService] Response body (text):", text);
        if (text) {
          data = { error: text };
        } else {
          data = { error: "Empty response from server" };
        }
      }

      if (!res.ok) {
        const err = new Error(
          data.error || data.message || `HTTP ${res.status}`,
        );
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    })
    .catch((err) => {
      console.error("[bookingService] Manual payment creation failed:", err);
      throw err;
    });
}

export async function uploadTransferProof(bookingId, file) {
  console.log("[bookingService] Uploading transfer proof for booking", bookingId);

  const formData = new FormData();
  formData.append("proof", file);

  return fetch(
    `http://localhost:8080/api/payments/manual/${bookingId}/proof`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("nama_marine_token")}`,
      },
      body: formData,
    },
  )
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    })
    .catch((err) => {
      console.error("[bookingService] Transfer proof upload failed:", err);
      throw err;
    });
}

export async function fetchTransactions() {
  return api.get("/api/transactions", { auth: true });
}

export async function getTransactions() {
  console.log("[bookingService] Fetching transactions...");

  const token = localStorage.getItem("nama_marine_token");
  if (!token) {
    throw new Error("Not authenticated");
  }

  return fetch("http://localhost:8080/api/transactions", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (res) => {
      console.log("[bookingService] Response status:", res.status);
      const data = await res.json();
      console.log("[bookingService] Transactions:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch transactions");
      }

      return data;
    })
    .catch((err) => {
      console.error("[bookingService] Failed to fetch transactions:", err);
      throw err;
    });
}
