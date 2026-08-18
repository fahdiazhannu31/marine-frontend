import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { ApiError } from "../../services/api.js";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal login, coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nama-auth-page">
      <div className="nama-auth-card">
        <h1 className="nama-auth-title">Login</h1>
        <p className="nama-auth-subtitle">
          Masuk untuk melanjutkan booking paket perjalananmu.
        </p>

        <form className="nama-auth-form" onSubmit={handleSubmit}>
          {error && <p className="nama-auth-error">{error}</p>}

          <div className="nama-auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="nama-auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            className="nama-auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="nama-auth-switch">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}
