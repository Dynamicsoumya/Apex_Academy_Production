import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import AuthLayout from "../components/AuthLayout";
import { setAuth } from "../utils/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("authRedirect") === "session_expired") {
      sessionStorage.removeItem("authRedirect");
      setError("Your session expired. Please sign in again.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { ...form, portal: "admin" });
      setAuth(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Administrator Login"
      subtitle="Sign in to the Apex Academy admin panel"
      footerText="Need a new admin account?"
      footerLink="/admin-setup"
      footerLabel="Create admin account"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="email">Admin Email</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">✉</span>
            <input
              id="email"
              type="email"
              placeholder="admin@apexacademy.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">🔒</span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-toggle-pw"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? (
            <span className="auth-loading">
              <span className="auth-spinner" /> Signing in...
            </span>
          ) : (
            "Sign In as Admin"
          )}
        </button>

        <p className="auth-switch">
          <Link to="/login">← Student login</Link>
        </p>
        <p className="auth-switch superadmin-login-link">
          Super Admin? <Link to="/superadmin/login">Super admin login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
