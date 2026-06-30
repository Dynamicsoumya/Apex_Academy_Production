import React from "react";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: "📚", text: "Expert-curated study material" },
  { icon: "🎯", text: "Board & entrance exam focus" },
  { icon: "🔐", text: "Secure student portal" },
];

export default function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-bg" />
        <div className="auth-brand-content">
          <Link to="/" className="auth-logo-link logo-showcase logo-showcase-auth">
            <img src="/apex-academy-logo.png" alt="Apex Academy" className="auth-logo" />
          </Link>
          <p className="auth-brand-tagline">
            Where ambition meets excellence — premium coaching for 11th & 12th students.
          </p>
          <ul className="auth-features">
            {FEATURES.map((f) => (
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
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
          {footerText && (
            <p className="auth-switch">
              {footerText}{" "}
              <Link to={footerLink}>{footerLabel}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
