import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import AuthLayout from "../components/AuthLayout";
import { setAuth } from "../utils/auth";

export default function SuperAdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    superAdminSecret: "",
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
        role: "superadmin",
        className: "12th",
        stream: "Science",
      });
      setAuth(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Super admin registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="superadmin"
      title="Create Super Admin Account"
      subtitle="Platform owner access — requires super admin secret key from backend .env"
      footerText="Already have a super admin account?"
      footerLink="/superadmin/login"
      footerLabel="Sign in"
    >
      <form className="auth-form auth-form--superadmin" onSubmit={handleSubmit}>
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
              placeholder="Super admin name"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email">Super Admin Email</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">✉</span>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="superadmin@apexacademy.com"
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
          <label htmlFor="superAdminSecret">Super Admin Secret Key</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">🔑</span>
            <input
              id="superAdminSecret"
              type="password"
              value={form.superAdminSecret}
              onChange={(e) => setForm({ ...form, superAdminSecret: e.target.value })}
              placeholder="Enter SUPERADMIN_SECRET"
              required
            />
          </div>
          <small className="auth-hint">
            Must match <code>SUPERADMIN_SECRET</code> in <code>backend/.env</code> — not ADMIN_SECRET or JWT_SECRET. Restart backend after editing .env.
          </small>
        </div>

        <button className="auth-submit auth-submit--superadmin" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Super Admin Account"}
        </button>

        <p className="auth-switch">
          <Link to="/superadmin/login">← Super admin login</Link>
          {" · "}
          <Link to="/admin/login">Admin login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
