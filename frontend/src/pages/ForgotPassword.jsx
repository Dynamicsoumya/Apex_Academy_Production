import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/auth/forgot-password", {
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and choose a new password"
      footerText="Remember your password?"
      footerLink="/login"
      footerLabel="Back to sign in"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="auth-alert auth-alert-success" role="status">
            <span>✓</span> {success}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="email">Email Address</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">✉</span>
            <input
              id="email"
              type="email"
              placeholder="your registered email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">New Password</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">🔒</span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              autoComplete="new-password"
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

        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">🔒</span>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button className="auth-submit" type="submit" disabled={loading || Boolean(success)}>
          {loading ? (
            <span className="auth-loading">
              <span className="auth-spinner" /> Updating...
            </span>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
