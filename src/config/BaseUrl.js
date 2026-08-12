// API base URL strategy:
//
// Development  : VITE_API_URL = "http://localhost:8080"
//                → full URL, points to CI4 dev server on port 8080
//
// Production   : VITE_API_URL = ""  (empty string, set in .env.production)
//                → relative URL, e.g. "/api/auth/login"
//                → Nginx on the same server handles /api/ → CI4
//
// The safeguard below strips any trailing /api suffix that might have been
// accidentally set, so we never produce double /api/api/ URLs.

let base = import.meta.env.VITE_API_URL ?? "";

// Safety: trim trailing slash
base = base.replace(/\/+$/, "");

// Safety: if someone set VITE_API_URL="/api" by mistake, strip it —
// paths already start with /api/
if (base === "/api" || base === "/api/") {
  base = "";
}

export const API_URL = base;
