import { api } from "./api";
import { API_URL } from "../config/BaseUrl.js";

const token = () => localStorage.getItem("nama_marine_token");
const authHeader = () => ({ Authorization: `Bearer ${token()}` });

export async function fetchDepartures() {
  return api.get("/api/schedules/departures");
}

export async function fetchReturns() {
  return api.get("/api/schedules/returns");
}

export async function createPayment(payload) {
  console.log("[bookingService] Creating payment with payload:", payload);

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

  const res = await fetch(`${API_URL}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(jsonPayload),
  });

  console.log("[bookingService] Response status:", res.status);
  const ct = res.headers.get("content-type") || "";
  let data = {};
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text();
    data = { error: text || "Empty response from server" };
  }
  console.log("[bookingService] Response body:", data);

  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (!data.checkout_link)
    throw new Error(data.error || "No checkout link returned");
  return data;
}

export async function createManualPayment(payload) {
  console.log(
    "[bookingService] Creating manual payment with payload:",
    payload,
  );

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

  const res = await fetch(`${API_URL}/api/payments/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(jsonPayload),
  });

  console.log("[bookingService] Response status:", res.status);
  const ct = res.headers.get("content-type") || "";
  let data = {};
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text();
    data = { error: text || "Empty response" };
  }
  console.log("[bookingService] Response body:", data);

  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function uploadTransferProof(bookingId, file) {
  console.log(
    "[bookingService] Uploading transfer proof for booking",
    bookingId,
  );

  const formData = new FormData();
  formData.append("proof", file);

  const res = await fetch(`${API_URL}/api/payments/manual/${bookingId}/proof`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchTransactions() {
  return api.get("/api/transactions", { auth: true });
}

export async function getTransactions() {
  console.log("[bookingService] Fetching transactions...");
  return api.get("/api/transactions", { auth: true });
}
