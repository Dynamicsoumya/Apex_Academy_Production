import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getStoredUser } from "../utils/auth";

export function TopAdmitBanner() {
  return (
    <div className="top-admit-banner">
      <div className="top-admit-inner">
        <span className="admit-pulse">🎓 Admissions Open 2025–26</span>
        <span className="admit-divider">|</span>
        <span>Limited seats — Class 9th to 12th · Science & School Board</span>
        <Link to="/register" className="admit-cta-btn">
          Join Apex Academy →
        </Link>
      </div>
    </div>
  );
}

export function StickyEnrollBar() {
  const [visible, setVisible] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const user = getStoredUser();
  const location = useLocation();

  useEffect(() => {
    if (user) return;

    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const targets = document.querySelectorAll("#contact, .footer");
    const observer = new IntersectionObserver(
      (entries) => setFooterInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.05, rootMargin: "0px 0px -48px 0px" }
    );
    targets.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [user, location.pathname]);

  if (user || !visible || footerInView) return null;

  return (
    <div className="sticky-enroll-bar">
      <div className="sticky-enroll-inner">
        <div className="sticky-enroll-text">
          <strong>Start your success story at Apex Academy</strong>
          <span>Free registration · Expert faculty · Video lectures included</span>
        </div>
        <div className="sticky-enroll-actions">
          <Link to="/register" className="btn btn-primary">
            Join Now — It's Free
          </Link>
          <a href="https://wa.me/919876543210" className="sticky-wa-btn" target="_blank" rel="noreferrer">
            💬 Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { step: "1", title: "Create Free Account", desc: "Register in 2 minutes with your name, class & stream.", icon: "📝" },
  { step: "2", title: "Choose Your Course", desc: "Browse courses for Class 9th to 12th and pick your program.", icon: "🎓" },
  { step: "3", title: "Start Learning", desc: "Access notes, videos & study material from your dashboard.", icon: "🚀" },
];

const PERKS = [
  "✓ Free student account",
  "✓ Instant study material access",
  "✓ HD video lectures",
  "✓ Board + entrance prep",
  "✓ Expert doubt support",
  "✓ Secure online payments",
];

export function HowToJoinSection() {
  return (
    <section className="join-steps-section">
      <div className="join-steps-inner">
        <div className="section-header">
          <p className="section-eyebrow">GET STARTED</p>
          <h2>Join Apex Academy in 3 Easy Steps</h2>
          <p className="section-sub">Your journey to top marks starts here — enrollment takes less than 5 minutes</p>
        </div>
        <div className="join-steps-grid">
          {STEPS.map((s, i) => (
            <div className="join-step-card" key={s.step}>
              <div className="join-step-icon">{s.icon}</div>
              <span className="join-step-num">Step {s.step}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < STEPS.length - 1 && <span className="join-step-arrow">→</span>}
            </div>
          ))}
        </div>
        <div className="join-steps-cta">
          <Link to="/register" className="btn btn-primary btn-lg join-glow-btn">
            Join Apex Academy Today →
          </Link>
          <p className="join-steps-note">Already a student? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </section>
  );
}

export function EnrollPerksBanner() {
  return (
    <section className="enroll-perks-section">
      <div className="enroll-perks-inner">
        <div className="enroll-perks-left">
          <p className="section-eyebrow">MEMBERSHIP</p>
          <h2>What You Get When You <span>Join Apex Academy</span></h2>
          <p>Everything a serious student needs — all in one powerful online portal.</p>
          <ul className="perks-list">
            {PERKS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account →
          </Link>
        </div>
        <div className="enroll-perks-right">
          <div className="perks-highlight-card">
            <div className="logo-showcase logo-showcase-perks">
              <img src="/apex-academy-logo.png" alt="Apex Academy" className="perks-logo" />
            </div>
            <div className="perks-offer">
              <span className="offer-label">New Student Offer</span>
              <strong>Free Registration</strong>
              <span className="offer-sub">No hidden charges to create your account</span>
            </div>
            <Link to="/register" className="btn btn-primary" style={{ width: "100%" }}>
              Join Now — It's Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CoursesEnrollBanner() {
  const user = getStoredUser();
  if (user) return null;

  return (
    <div className="courses-enroll-banner">
      <div className="courses-enroll-inner">
        <div>
          <strong>🎓 Want to enroll in a course?</strong>
          <p>Create your free Apex Academy account first — then pay securely online.</p>
        </div>
        <Link to="/register" className="btn btn-primary btn-lg">
          Join Apex Academy →
        </Link>
      </div>
    </div>
  );
}
