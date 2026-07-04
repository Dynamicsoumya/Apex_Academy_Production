import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { staffRoleLabel } from "../utils/roles";

export default function DashboardLayout({ user, role, navItems, children, wide = false }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portalLabel =
    role === "superadmin" ? "Super Admin Portal" : role === "admin" ? "Admin Portal" : "Student Portal";

  const isNavActive = (item) => {
    const current = `${location.pathname}${location.hash}`;
    if (item.to.includes("#")) return current === item.to;
    if (item.to === "/admin") return location.pathname === "/admin";
    if (item.to === "/student") return location.pathname === "/student";
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  };

  return (
    <div className={`dash-layout dash-layout--portal ${wide ? "dash-layout--wide" : ""}`}>
      {menuOpen && (
        <button
          type="button"
          className="dash-sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside className={`dash-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="dash-sidebar-brand">
          <Link to="/" className="dash-brand-link">
            <img src="/apex-academy-logo.png" alt="Apex Academy" className="dash-sidebar-logo" />
          </Link>
          <span className="dash-sidebar-tagline">{portalLabel}</span>
        </div>

        <div className="dash-user-card">
          <div className="dash-avatar">{initials || "?"}</div>
          <div className="dash-user-info">
            <p className="dash-user-name">{user?.name}</p>
            <span className="dash-user-meta">
              {role === "student" && user?.className ? `Class ${user.className}` : "Apex Academy"}
            </span>
            <span className={`dash-role-badge dash-role-${role}`}>
              {staffRoleLabel(role)}
            </span>
          </div>
        </div>

        <div className="dash-nav-scroll">
          <nav className="dash-nav">
            {navItems.map((item, index) => {
              if (item.type === "group") {
                return (
                  <p key={`group-${item.label}-${index}`} className="dash-nav-group">
                    {item.label}
                  </p>
                );
              }

              const isActive = isNavActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`dash-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="dash-nav-icon">{item.icon}</span>
                  <span className="dash-nav-label">{item.label}</span>
                  {isActive && <span className="dash-nav-active-dot" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="dash-sidebar-footer">
          <p>📍 Dhenkanal, Odisha</p>
          <p>
            Need help?{" "}
            <a href="https://wa.me/919692251559" target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
          </p>
        </div>
      </aside>

      <main className="dash-main">
        <button
          type="button"
          className="dash-mobile-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open dashboard menu"
        >
          <span>☰</span> Menu
        </button>
        <div className="dash-page">{children}</div>
      </main>
    </div>
  );
}
