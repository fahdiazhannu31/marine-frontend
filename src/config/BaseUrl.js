// Dev  : VITE_API_URL = "http://localhost:8080"  (set di .env atau .env.local)
// Prod : VITE_API_URL = ""  (set di .env.production → API calls jadi relative /api/...)
export const API_URL = import.meta.env.VITE_API_URL ?? "";
