import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TOPPERS = [
  { name: "Aarav S.", score: "98.2%", exam: "12th Board · PCM", year: "2025", rank: "🏆" },
  { name: "Priya M.", score: "NEET 640", exam: "Medical Entrance", year: "2025", rank: "🥇" },
  { name: "Rohan K.", score: "96.8%", exam: "12th Board · PCB", year: "2024", rank: "🏆" },
  { name: "Sneha R.", score: "JEE 94%", exam: "JEE Main", year: "2024", rank: "🥈" },
  { name: "Karan P.", score: "95.5%", exam: "12th Board · PCM", year: "2025", rank: "🏆" },
  { name: "Ananya D.", score: "97.1%", exam: "12th Board · PCM", year: "2024", rank: "🥇" },
];

const FAQS = [
  {
    q: "Which classes do you teach?",
    a: "Class 9th & 10th evening batch (school board). Class 11th & 12th Science morning batch and Arts afternoon batch for +2 board preparation.",
  },
  {
    q: "What subjects are taught in each batch?",
    a: "9th & 10th (5–8 PM): Math, General Science, Social Science, MIL, English. +2 Science (7–10 AM): Physics, Chemistry, Biology, Math, English, MIL. +2 Arts (3–5 PM): Political Science, Economics, History, MIL, English.",
  },
  {
    q: "Where can I find previous year question papers?",
    a: "Click PYQ Papers in the top menu to open the full question bank. Admin uploads board exam papers by class, subject, and year.",
  },
  {
    q: "Is registration really free?",
    a: "Yes! Creating your student account is completely free. You only pay when you enroll in a specific course.",
  },
  {
    q: "Do you provide online video lectures?",
    a: "Absolutely. All enrolled students get access to HD recorded lectures, notes, and study material on their personal dashboard.",
  },
  {
    q: "How do I pay the course fee?",
    a: "We accept online payments via Razorpay — UPI, debit/credit cards, net banking, and wallets are all supported.",
  },
  {
    q: "Do you prepare for JEE and NEET?",
    a: "Yes. Our Science faculty specializes in board exams plus JEE Main/Advanced and NEET preparation with mock tests and practice sheets.",
  },
  {
    q: "What are the batch timings?",
    a: "9th & 10th evening: 5:00–8:00 PM. +2 Science morning: 7:00–10:00 AM. +2 Arts afternoon: 3:00–5:00 PM.",
  },
];

const BATCHES = [
  { time: "7:00 – 10:00 AM", label: "+2 Science Batch", icon: "🌅", note: "Class 11th & 12th · Physics, Chem, Bio, Math, Eng, MIL" },
  { time: "3:00 – 5:00 PM", label: "+2 Arts Batch", icon: "🎨", note: "Class 11th & 12th · Pol. Science, Economics, History, MIL, English" },
  { time: "5:00 – 8:00 PM", label: "9th & 10th Evening", icon: "🌙", note: "Math, General Science, Social Science, MIL, English" },
];

const GALLERY = [
  {
    src: "/images/campus-reception.png",
    caption: "Reception & Counselling Desk",
    tag: "Welcome Desk",
    desc: "Meet our team and get admission guidance",
    featured: true,
  },
  {
    src: "/images/campus-classroom-1.png",
    caption: "Interactive Classroom",
    tag: "Classroom",
    desc: "Whiteboard teaching with focused seating",
  },
  {
    src: "/images/campus-classroom-2.png",
    caption: "Board Exam Ready Setup",
    tag: "Learning Space",
    desc: "Comfortable desks for daily coaching",
  },
  {
    src: "/images/campus-classroom-3.png",
    caption: "Bright Study Environment",
    tag: "Campus",
    desc: "Clean, well-lit rooms for concentration",
  },
];

const CAMPUS_HIGHLIGHTS = [
  { icon: "🎯", label: "Focused Coaching" },
  { icon: "👨‍🏫", label: "Expert Faculty" },
  { icon: "📋", label: "Weekly Tests" },
  { icon: "🏆", label: "100% Result Goal" },
];

export function ResultsSection() {
  return (
    <section className="section results-section">
      <div className="section-header">
        <p className="section-eyebrow">OUR PRIDE</p>
        <h2>Student Results & Toppers</h2>
        <p className="section-sub">Real scores from real students — proof that Apex Academy delivers results</p>
      </div>
      <div className="toppers-grid">
        {TOPPERS.map((t) => (
          <div className="topper-card" key={t.name + t.year}>
            <span className="topper-rank">{t.rank}</span>
            <strong className="topper-score">{t.score}</strong>
            <h4>{t.name}</h4>
            <p>{t.exam}</p>
            <span className="topper-year">Batch {t.year}</span>
          </div>
        ))}
      </div>
      <div className="results-cta">
        <p>You could be our next topper!</p>
        <Link to="/register" className="btn btn-primary join-glow-btn">
          Join Apex Academy →
        </Link>
      </div>
    </section>
  );
}

export function GallerySection() {
  const [lightbox, setLightbox] = useState(null);
  const featured = GALLERY.find((g) => g.featured);
  const rest = GALLERY.filter((g) => !g.featured);

  const openLightbox = (item) => setLightbox(item);
  const closeLightbox = () => setLightbox(null);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  const renderCard = (item, variant = "default") => (
    <button
      type="button"
      className={`campus-photo-card campus-photo-card--${variant}`}
      key={item.caption}
      onClick={() => openLightbox(item)}
      aria-label={`View ${item.caption}`}
    >
      <img src={item.src} alt={item.caption} loading="lazy" />
      <div className="campus-photo-shine" aria-hidden="true" />
      <div className="campus-photo-overlay">
        <span className="campus-photo-tag">{item.tag}</span>
        <strong>{item.caption}</strong>
        <p>{item.desc}</p>
        <span className="campus-photo-zoom">Click to enlarge ↗</span>
      </div>
    </button>
  );

  return (
    <section className="section gallery-section">
      <div className="gallery-section-bg" aria-hidden="true" />
      <div className="section-header">
        <p className="section-eyebrow">CAMPUS LIFE</p>
        <h2>Inside Apex Academy</h2>
        <p className="section-sub">A glimpse of our classrooms, faculty, and learning environment</p>
      </div>

      <div className="campus-highlights">
        {CAMPUS_HIGHLIGHTS.map((h) => (
          <div className="campus-highlight-chip" key={h.label}>
            <span>{h.icon}</span>
            <span>{h.label}</span>
          </div>
        ))}
      </div>

      <div className="campus-showcase">
        {featured && (
          <div className="campus-featured">{renderCard(featured, "featured")}</div>
        )}
        <div className="campus-stack">{rest.map((item) => renderCard(item))}</div>
      </div>

      {lightbox && (
        <div
          className="campus-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.caption}
          onClick={closeLightbox}
        >
          <button type="button" className="campus-lightbox-close" onClick={closeLightbox} aria-label="Close">
            ×
          </button>
          <div className="campus-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.caption} />
            <div className="campus-lightbox-caption">
              <span>{lightbox.tag}</span>
              <strong>{lightbox.caption}</strong>
              <p>{lightbox.desc}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function BatchTimingsSection() {
  return (
    <section className="batch-section">
      <div className="batch-inner">
        <div className="batch-left">
          <p className="section-eyebrow">SCHEDULE</p>
          <h2>Batch Timing</h2>
          <p>Three batches — 9th/10th evening, +2 Science morning, and +2 Arts afternoon.</p>
          <Link to="/register" className="btn btn-primary">Reserve Your Seat →</Link>
        </div>
        <div className="batch-cards">
          {BATCHES.map((b) => (
            <div className="batch-card" key={b.label}>
              <span className="batch-icon">{b.icon}</span>
              <h4>{b.label}</h4>
              <strong>{b.time}</strong>
              {b.note && <span className="batch-note">{b.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section faq-section">
      <div className="faq-inner">
        <div className="faq-left">
          <p className="section-eyebrow">FAQ</p>
          <h2>Got Questions?</h2>
          <p>Parents and students ask us these all the time. Can't find your answer?</p>
          <a href="https://wa.me/919692251559" className="btn btn-primary" target="_blank" rel="noreferrer">
            💬 Chat on WhatsApp
          </a>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div className={`faq-item ${open === i ? "open" : ""}`} key={f.q}>
              <button type="button" className="faq-question" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="faq-arrow">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Hi Apex Academy! I'm ${form.name}. Phone: ${form.phone}. ${form.message}`;
    window.open(`https://wa.me/919692251559text=${encodeURIComponent(text)}`, "_blank");
    setSent(true);
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <section className="section contact-section" id="contact">
      <div className="contact-inner">
        <div className="contact-info">
          <p className="section-eyebrow">CONTACT US</p>
          <h2>Visit or Reach Out</h2>
          <p>Have questions about admission, fees, or batches? We're happy to help.</p>
          <ul className="contact-details">
            <li>📍 Hindol Rd, Dhenkanal, Paneilo, Odisha 759019</li>
            <li>📞 +91 9692251559</li>
            <li>📞 +91 8984580486</li>
            <li>✉ apexacademy509@gmail.com</li>
            <li>🕐 Mon–Sat: 6 AM – 10 PM</li>
          </ul>
          <div className="contact-social">
            <a href="https://wa.me/919692251559" target="_blank" rel="noreferrer">WhatsApp</a>
            <a href="tel:+91 8984580486">Call Now</a>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <h3>📩 Quick Inquiry</h3>
          {sent && <p className="contact-sent">✅ Opening WhatsApp to send your message!</p>}
          <div className="form-group">
            <label>Your Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Student or parent name" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="10-digit mobile" />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Ask about admission, fees, batch timing..."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Send via WhatsApp →
          </button>
        </form>
      </div>
    </section>
  );
}

export function LiveActivityPopup() {
  const [show, setShow] = useState(false);
  const names = ["Rahul from Delhi", "Sneha from Mumbai", "Amit from Pune", "Kavya from Jaipur"];
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let hideTimer;
    const showTimer = setTimeout(() => {
      setMsg(names[Math.floor(Math.random() * names.length)]);
      setShow(true);
      hideTimer = setTimeout(() => setShow(false), 5000);
    }, 8000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="live-activity-popup">
      <span className="live-dot" />
      <div>
        <strong>{msg}</strong>
        <span>just joined Apex Academy</span>
      </div>
    </div>
  );
}
