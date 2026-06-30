import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getStoredUser } from "../utils/auth";
import { PREMIUM_COMING_SOON } from "../utils/features";

const MAIN_LINKS = [
  { to: "/", label: "Home", icon: "🏠", end: true },
  { to: "/courses", label: "Courses", icon: "🎓" },
  { to: "/exam-portal", label: "Exams", icon: "📋" },
  { to: "/career-roadmaps", label: "Careers", icon: "🗺️" },
  { to: "/premium", label: "Premium", icon: "👑", soon: PREMIUM_COMING_SOON },
  { to: "/questions", label: "PYQ", icon: "📝" },
];

function isLinkActive(item, pathname, hash) {
  if (item.hash) {
    const target = item.to.split("#")[1];
    return pathname === "/" && hash === `#${target}`;
  }
  if (item.end) return pathname === "/" && !hash;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  const navLinks = MAIN_LINKS;

  return (
    <header className="site-header">
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand logo-showcase logo-showcase-nav">
            <img src="/apex-academy-logo.png" alt="Apex Academy" className="nav-logo" />
          </Link>

          <button
            type="button"
            className={`nav-toggle ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`nav-panel ${menuOpen ? "open" : ""}`}>
            <div className="nav-links nav-links-main">
              {navLinks.map((item) => {
                const active = isLinkActive(item, location.pathname, location.hash);
                const className = `nav-pill ${active ? "active" : ""}`;

                if (item.hash) {
                  return (
                    <a key={item.to} href={item.to} className={className}>
                      <span className="nav-pill-icon">{item.icon}</span>
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link key={item.to} to={item.to} className={className}>
                    <span className="nav-pill-icon">{item.icon}</span>
                    {item.label}
                    {item.soon && <span className="nav-pill-soon">Soon</span>}
                  </Link>
                );
              })}
            </div>

            <div className="nav-links nav-links-actions">
              {!user && (
                <>
                  <Link to="/register" className="nav-pill nav-pill-cta btn-cta btn-cta-pulse">
                    Join
                  </Link>
                  <Link to="/login" className="nav-pill nav-pill-outline">
                    Login
                  </Link>
                </>
              )}
              {user?.role === "admin" && (
                <Link to="/admin" className="nav-pill nav-pill-admin">
                  <span className="nav-pill-icon">⚙️</span>
                  Admin Panel
                </Link>
              )}
              {user?.role === "student" && (
                <Link to="/student" className="nav-pill nav-pill-dash">
                  <span className="nav-pill-icon">📚</span>
                  Dashboard
                </Link>
              )}
              {user && (
                <button type="button" onClick={logout} className="nav-pill nav-pill-logout">
                  <span className="nav-pill-icon">🚪</span>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
