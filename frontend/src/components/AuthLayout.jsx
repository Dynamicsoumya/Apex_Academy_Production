import React from "react";
import { Link } from "react-router-dom";

const DEFAULT_FEATURES = [
  { icon: "📚", text: "Expert-curated study material" },
  { icon: "🎯", text: "Board & entrance exam focus" },
  { icon: "🔐", text: "Secure student portal" },
];

const LOGIN_HIGHLIGHTS = [
  { value: "9th–12th", label: "Classes" },
  { value: "PCM · PCB", label: "Science streams" },
  { value: "500+", label: "Study resources" },
];

export default function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLabel,
  footerState,
  variant,
  features = DEFAULT_FEATURES,
}) {
  return (
    <div className={`auth-page${variant ? ` auth-page--${variant}` : ""}`}>
      <div className="auth-brand-panel">
        <div className="auth-brand-bg" />
        <div className="auth-brand-content">
          <Link to="/" className="auth-logo-link logo-showcase logo-showcase-auth">
            <img src="/apex-academy-logo.png" alt="Apex Academy" className="auth-logo" />
          </Link>
          <p className="auth-brand-tagline">
            Where ambition meets excellence — premium coaching for 11th & 12th students in Dhenkanal, Odisha.
          </p>

          {variant === "login" && (
            <div className="auth-highlight-grid">
              {LOGIN_HIGHLIGHTS.map((item) => (
                <div key={item.label} className="auth-highlight-chip">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          <ul className="auth-features">
            {features.map((f) => (
              <li key={f.text}>
                <span className="auth-feature-icon">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-brand-footer">
          <p>Trusted by students across Science & School Board programs</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            {variant === "login" && <span className="auth-welcome-badge">Student Portal</span>}
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
          {footerText && (
            <p className="auth-switch auth-register-cta">
              {footerText}{" "}
              <Link to={footerLink} state={footerState}>{footerLabel}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
