import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../api/api";
import AuthLayout from "../components/AuthLayout";
import { setAuth } from "../utils/auth";

function afterAuthNavigate(navigate, data, redirectTo) {
  if (redirectTo && redirectTo !== "/login") {
    navigate(redirectTo);
  } else {
    navigate("/student");
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from;
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
      const { data } = await API.post("/auth/login", form);
      setAuth(data);
      afterAuthNavigate(navigate, data, redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const isAdmission = redirectTo === "/admissions";

  return (
    <AuthLayout
      variant="login"
      title={isAdmission ? "Sign In to Apply" : "Welcome Back!"}
      subtitle={
        isAdmission
          ? "Student login is required to submit your admission application"
          : "Access your notes, lectures, exams, and student dashboard"
      }
      footerText="New to Apex Academy?"
      footerLink="/register"
      footerState={redirectTo ? { from: redirectTo } : undefined}
      footerLabel="Create a free account"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-card">
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email Address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-field-label-row">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>
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
              "Sign In to Dashboard →"
            )}
          </button>
        </div>

        <div className="auth-staff-section">
          <div className="auth-staff-divider">
            <span>Staff access</span>
          </div>
          <div className="auth-portal-grid">
            <Link to="/admin/login" className="auth-portal-card auth-portal-card--admin">
              <span className="auth-portal-icon" aria-hidden="true">⚙️</span>
              <div className="auth-portal-text">
                <strong>Administrator</strong>
                <small>Upload content & manage admissions</small>
              </div>
              <span className="auth-portal-arrow" aria-hidden="true">→</span>
            </Link>
            <Link to="/superadmin/login" className="auth-portal-card auth-portal-card--super">
              <span className="auth-portal-icon" aria-hidden="true">👑</span>
              <div className="auth-portal-text">
                <strong>Super Admin</strong>
                <small>Users, payments & full control</small>
              </div>
              <span className="auth-portal-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
