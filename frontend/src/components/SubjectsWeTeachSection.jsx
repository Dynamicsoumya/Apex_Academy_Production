import React from "react";
import { Link } from "react-router-dom";
import { BATCH_PROGRAMS } from "../utils/academyClasses";

const THEME_ACCENTS = {
  evening: { accent: "#1e40af", glow: "rgba(30, 64, 175, 0.12)" },
  morning: { accent: "#0ea5e9", glow: "rgba(14, 165, 233, 0.14)" },
  afternoon: { accent: "#b45309", glow: "rgba(180, 83, 9, 0.14)" },
};

export default function SubjectsWeTeachSection() {
  return (
    <section className="section subjects-section" id="batches">
      <div className="subjects-section-bg" aria-hidden="true" />
      <div className="section-header subjects-section-header">
        <p className="section-eyebrow">PROGRAMS</p>
        <h2>Our Batches & Subjects</h2>
        <p className="section-sub">
          Three batches — pick your class and stream. All subjects, timings, and enrollment in one place.
        </p>
      </div>

      <div className="subjects-program-grid">
        {BATCH_PROGRAMS.map((program) => {
          const theme = THEME_ACCENTS[program.theme];
          return (
            <article
              className={`subjects-program-card subjects-program-${program.theme}`}
              key={program.id}
              style={{ "--program-accent": theme.accent, "--program-glow": theme.glow }}
            >
              <div className="subjects-program-top">
                <span className="subjects-program-icon">{program.icon}</span>
                <div>
                  <p className="subjects-program-eyebrow">{program.eyebrow}</p>
                  <h3>{program.title}</h3>
                </div>
              </div>

              <div className="subjects-program-meta">
                <span className="subjects-program-stream">{program.streamLabel}</span>
                <span className="subjects-program-time">
                  <span aria-hidden="true">⏱</span> {program.timing}
                </span>
              </div>

              <div className="subjects-program-pills">
                {program.subjects.map((s) => (
                  <span
                    className="subjects-program-pill"
                    key={s.key}
                    style={{ "--pill-color": s.color }}
                  >
                    <span>{s.icon}</span>
                    {s.title}
                  </span>
                ))}
              </div>

              <Link to={program.coursesLink} className="subjects-program-cta">
                View Courses →
              </Link>
            </article>
          );
        })}
      </div>

      <div className="subjects-section-cta">
        <Link to="/register" className="btn btn-primary btn-lg join-glow-btn">
          Enroll Now — Free Registration
        </Link>
        <Link to="/courses" className="btn btn-outline btn-lg">
          Browse All Courses
        </Link>
      </div>
    </section>
  );
}
