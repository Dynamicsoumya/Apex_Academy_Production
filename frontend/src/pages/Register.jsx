import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import AuthLayout from "../components/AuthLayout";
import { setAuth } from "../utils/auth";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    className: "11th",
    stream: "Science",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "className" && (value === "9th" || value === "10th")) {
      setForm((prev) => ({ ...prev, className: value, stream: "School" }));
      return;
    }
    if (name === "className" && (value === "11th" || value === "12th")) {
      setForm((prev) => ({
        ...prev,
        className: value,
        stream: prev.stream === "Arts" ? "Arts" : "Science",
      }));
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const isJuniorClass = form.className === "9th" || form.className === "10th";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", form);
      setAuth(data);
      navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join Apex Academy"
      subtitle="Create your student account and start your journey to excellence"
      footerText="Already have an account?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      <form className="auth-form auth-form-register" onSubmit={handleSubmit}>
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
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email Address</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">✉</span>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="phone">Phone Number</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">📱</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
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
              name="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
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

        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="className">Class</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🎓</span>
              <select id="className" name="className" value={form.className} onChange={handleChange}>
                <option value="9th">9th Standard</option>
                <option value="10th">10th Standard</option>
                <option value="11th">11th Standard</option>
                <option value="12th">12th Standard</option>
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="stream">Stream</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📖</span>
              {isJuniorClass ? (
                <input id="stream" value="School Board" readOnly />
              ) : (
                <select id="stream" name="stream" value={form.stream} onChange={handleChange}>
                  <option value="Science">Science (PCM/PCB)</option>
                  <option value="Arts">Arts</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? (
            <span className="auth-loading">
              <span className="auth-spinner" /> Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
