import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getToken, setToken as persistToken } from "../services/api";
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
} from "../services/authService";

const AuthContext = createContext(null);
const USER_KEY = "nama_marine_user";

function getStoredUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("[AuthContext] Failed to parse stored user:", e);
    return null;
  }
}

function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log("[AuthContext] User saved to localStorage");
  } else {
    localStorage.removeItem(USER_KEY);
    console.log("[AuthContext] User cleared from localStorage");
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("[AuthProvider] Initializing auth...");
        const token = getToken();
        const storedUser = getStoredUser();

        if (!token) {
          console.log("[AuthProvider] No token found");
          setStoredUser(null);
          setStatus("ready");
          return;
        }

        console.log("[AuthProvider] Token found");

        // Jika ada user di localStorage, gunakan itu langsung
        if (storedUser) {
          console.log("[AuthProvider] Using stored user:", storedUser);
          setUser(storedUser);
          setStatus("ready");
          return;
        }

        // Jika tidak ada stored user, coba fetch dari backend
        console.log("[AuthProvider] No stored user, fetching from backend...");
        try {
          const me = await fetchMe();
          console.log("[AuthProvider] Fetched user from backend:", me);
          setUser(me);
          setStoredUser(me);
          setStatus("ready");
        } catch (fetchMeError) {
          console.warn(
            "[AuthProvider] fetchMe failed, creating minimal user object from token",
          );
          // Fallback: create minimal user object
          const minimalUser = { authenticated: true };
          setUser(minimalUser);
          setStoredUser(minimalUser);
          setStatus("ready");
        }
      } catch (error) {
        console.error("[AuthProvider] Auth init failed:", error.message);
        persistToken(null);
        setStoredUser(null);
        setUser(null);
        setStatus("ready");
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      console.log("[AuthProvider] Logging in...");
      const loggedInUser = await loginRequest(credentials);
      console.log("[AuthProvider] Login successful:", loggedInUser);
      setUser(loggedInUser);
      setStoredUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      console.error("[AuthProvider] Login failed:", error.message);
      setUser(null);
      setStoredUser(null);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log("[AuthProvider] Logging out...");
      await logoutRequest();
    } catch (error) {
      console.log(
        "[AuthProvider] Logout request failed (clearing local state anyway)",
      );
    }
    persistToken(null);
    setStoredUser(null);
    setUser(null);
    console.log("[AuthProvider] Local state cleared");
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading: status === "loading",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
