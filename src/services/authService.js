import { api, setToken } from "./api";

export async function login({ email, password }) {
  console.log("[authService] Calling login endpoint...");
  const data = await api.post("/api/auth/login", { email, password });
  console.log("[authService] Login response:", data);

  // Backend bisa return { token, user } atau { access_token, user }
  const tokenValue = data.token || data.access_token;

  if (!tokenValue) {
    throw new Error("No token in login response");
  }

  console.log(
    "[authService] Setting token:",
    tokenValue.substring(0, 20) + "...",
  );
  setToken(tokenValue);

  return data.user;
}

export async function register({
  username,
  fullname,
  email,
  phone,
  password,
  passwordConfirm,
}) {
  console.log("[authService] Calling register endpoint...");
  return api.post("/api/auth/register", {
    username,
    fullname,
    email,
    phone,
    password,
    password_confirm: passwordConfirm,
  });
}

export async function fetchMe() {
  console.log("[authService] Calling fetchMe endpoint...");
  const result = await api.get("/api/auth/me", { auth: true });
  console.log("[authService] fetchMe response:", result);
  return result;
}

export async function logout() {
  try {
    console.log("[authService] Calling logout endpoint...");
    await api.post("/api/auth/logout", undefined, { auth: true });
    console.log("[authService] Logout successful");
  } finally {
    setToken(null);
  }
}
