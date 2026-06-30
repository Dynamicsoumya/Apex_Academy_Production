import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import AuthLayout from "../components/AuthLayout";
import { setAuth } from "../utils/auth";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    adminSecret: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", {
        ...form,
        role: "admin",
        className: "12th",
        stream: "Science",
      });
      setAuth(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Admin registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Admin Account"
      subtitle="For Apex Academy staff only — requires admin secret key"
      footerText="Already have an admin account?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="name">Full Name</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">👤</span>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Admin name"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email">Admin Email</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">✉</span>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@apexacademy.com"
              required
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
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
          <label htmlFor="adminSecret">Admin Secret Key</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">🔑</span>
            <input
              id="adminSecret"
              type="password"
              value={form.adminSecret}
              onChange={(e) => setForm({ ...form, adminSecret: e.target.value })}
              placeholder="Enter Secret Key"
              required
            />
          </div>
          {/* <small className="auth-hint">Set ADMIN_SECRET in backend/.env file</small> */}
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Admin Account"}
        </button>

        <p className="auth-switch">
          <Link to="/login">← Back to student login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
