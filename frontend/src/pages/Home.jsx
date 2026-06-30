import React from "react";
import { Link } from "react-router-dom";
import { CORE_SUBJECTS } from "../components/SubjectIcon";
import TeamSection, { VideoSection, SuccessSection } from "../components/HomeSections";
import { HowToJoinSection, EnrollPerksBanner } from "../components/JoinCTA";
import {
  ResultsSection,
  GallerySection,
  FAQSection,
  ContactSection,
  LiveActivityPopup,
} from "../components/ExtraSections";
import StudentReviewsSection from "../components/StudentReviewsSection";
import SubjectsWeTeachSection from "../components/SubjectsWeTeachSection";

const WHY_CHOOSE = [
  {
    num: "01",
    icon: "👨‍🏫",
    title: "Expert Faculty",
    highlight: "IIT & NEET Mentors",
    desc: "Learn from experienced teachers who simplify tough concepts and focus on board + entrance exam success.",
    color: "#1e40af",
  },
  {
    num: "02",
    icon: "📚",
    title: "Study Material",
    highlight: "Notes & PDFs",
    desc: "Chapter-wise notes, assignments, and previous year papers — uploaded and ready to download instantly.",
    color: "#059669",
  },
  {
    num: "03",
    icon: "🎬",
    title: "Video Lectures",
    highlight: "Watch Anytime",
    desc: "HD recorded classes for every subject. Revise at your own pace from home on your student portal.",
    color: "#7c3aed",
  },
  {
    num: "04",
    icon: "🎯",
    title: "Mock Tests",
    highlight: "Exam Ready",
    desc: "Regular tests modeled on board & JEE/NEET patterns to track progress and build exam confidence.",
    color: "#b45309",
  },
  {
    num: "05",
    icon: "💬",
    title: "Doubt Support",
    highlight: "Personal Care",
    desc: "Small batch sizes mean every student gets attention. Doubts cleared quickly by dedicated faculty.",
    color: "#0ea5e9",
  },
  {
    num: "06",
    icon: "🔐",
    title: "Online Portal",
    highlight: "Pay & Enroll",
    desc: "Secure login, easy Razorpay payments — UPI, cards & net banking. Manage everything in one place.",
    color: "#d4af37",
  },
];

const STATS = [
  { value: "500+", label: "Happy Students" },
  { value: "95%", label: "Success Rate" },
  { value: "50+", label: "Video Lectures" },
];

const TRUST_BADGES = ["✓ Expert Faculty", "✓ Board + Entrance Prep", "✓ 24/7 Study Portal"];

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="logo-showcase logo-showcase-hero">
            <img src="/apex-academy-logo.png" alt="Apex Academy" className="hero-logo" />
          </div>
          <p className="hero-eyebrow">🎓 ADMISSIONS OPEN 2025–26 — LIMITED SEATS</p>
          <h1>
            Your Success Starts at <span>Apex Academy</span>
          </h1>
          <p className="hero-desc">
            Join 500+ students already learning with expert faculty, HD video lectures,
            and board coaching for Class 9th, 10th, 11th & 12th.
          </p>
          <div className="hero-trust">
            {TRUST_BADGES.map((b) => (
              <span key={b} className="trust-badge">{b}</span>
            ))}
          </div>
          <div className="hero-buttons">
            <Link to="/admissions" className="btn btn-primary btn-lg join-glow-btn">
              Apply for Admission →
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg">
              Create Free Account
            </Link>
            <a href="#videos" className="btn btn-outline btn-lg">
              Watch Free Lectures
            </a>
          </div>
          <p className="hero-join-note">✓ No fees to register · ✓ Takes 2 minutes · ✓ Start learning today</p>
          <div className="hero-stats">
            {STATS.map((s) => (
              <div className="hero-stat" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="hero-subjects">
            {CORE_SUBJECTS.map((s) => (
              <div className="hero-subject-item" key={s.key} title={s.title}>
                <img src={s.icon} alt={s.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowToJoinSection />

      <TeamSection />

      <section className="videos-section-wrap" id="videos">
        <VideoSection />
      </section>

      <section className="why-choose-section">
        <div className="why-choose-inner">
          <div className="why-choose-left">
            <p className="section-eyebrow">WHY US</p>
            <h2>Why Choose <span>Apex Academy?</span></h2>
            <p className="why-choose-desc">
              We don't just teach syllabus — we build confidence, discipline, and results.
              Join a coaching institute trusted by hundreds of 11th & 12th students.
            </p>
            <div className="why-choose-stats">
              <div className="why-stat">
                <strong>95%</strong>
                <span>Pass Rate</span>
              </div>
              <div className="why-stat">
                <strong>500+</strong>
                <span>Students</span>
              </div>
              <div className="why-stat">
                <strong>10+</strong>
                <span>Years</span>
              </div>
            </div>
            <Link to="/register" className="btn btn-primary">
              Join Apex Academy →
            </Link>
          </div>

          <div className="why-choose-grid">
            {WHY_CHOOSE.map((f) => (
              <div
                className="why-card"
                key={f.num}
                style={{ "--why-color": f.color }}
              >
                <span className="why-card-num">{f.num}</span>
                <div className="why-card-icon">{f.icon}</div>
                <span className="why-card-tag">{f.highlight}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SubjectsWeTeachSection />

      <EnrollPerksBanner />

      <StudentReviewsSection />

      <ResultsSection />

      <GallerySection />

      <SuccessSection />

      <FAQSection />

      <ContactSection />

      <section className="cta-banner cta-banner-final">
        <div className="cta-inner">
          <p className="cta-eyebrow">DON'T WAIT — SEATS FILLING FAST</p>
          <h2>Join Apex Academy Today</h2>
          <p>500+ students trust us. 95% pass rate. Your turn to succeed starts with one click.</p>
          <div className="cta-checklist">
            <span>✓ Free registration</span>
            <span>✓ Expert faculty</span>
            <span>✓ Video lectures</span>
            <span>✓ Study material</span>
          </div>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg join-glow-btn">
              Join Apex Academy Now →
            </Link>
            <Link to="/courses" className="btn btn-outline btn-lg">
              View Courses
            </Link>
          </div>
        </div>
      </section>

      <LiveActivityPopup />

      <a href="https://wa.me/919692251559" className="whatsapp-float" target="_blank" rel="noreferrer" title="Chat on WhatsApp">
        💬
      </a>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo-showcase logo-showcase-footer">
              <img src="/apex-academy-logo.png" alt="Apex Academy" />
            </div>
          </div>
          <div className="footer-contact">
            <p>📍 Hindol Rd, Dhenkanal, Paneilo, Odisha 759019</p>
            <p>📞 +91 9692251559</p><p>+91 8984580486</p>
            <p>✉ apexacademy509@gmail.com</p>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Apex Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
