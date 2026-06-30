import React from "react";
import { Link } from "react-router-dom";
import { JUNIOR_BATCH_TIMING, JUNIOR_SUBJECTS } from "../utils/academyClasses";

export default function JuniorBatchSection() {
  return (
    <section className="section junior-batch-section" id="junior-batch">
      <div className="junior-batch-bg" aria-hidden="true" />
      <div className="section-header">
        <p className="section-eyebrow">CLASS 9TH & 10TH</p>
        <h2>Evening Batch — {JUNIOR_BATCH_TIMING}</h2>
        <p className="section-sub">
          School board coaching for Class 9th & 10th — all core subjects in one focused evening batch.
        </p>
      </div>

      <div className="junior-batch-hero">
        <div className="junior-batch-info">
          <div className="junior-batch-badge">
            <span className="junior-batch-icon">🌙</span>
            <div>
              <strong>Evening Batch</strong>
              <span>{JUNIOR_BATCH_TIMING} · Mon–Sat · Class 9th & 10th</span>
            </div>
          </div>
          <ul className="junior-batch-perks">
            <li>✓ Math, General Science & Social Science</li>
            <li>✓ MIL & English included</li>
            <li>✓ Weekly tests & board exam focus</li>
            <li>✓ Small batch — personal attention</li>
          </ul>
          <div className="junior-batch-actions">
            <Link to="/courses?stream=School&className=9th" className="btn btn-primary join-glow-btn">
              View 9th / 10th Courses →
            </Link>
            <Link to="/register" className="btn btn-outline junior-batch-link">
              Enroll Now →
            </Link>
          </div>
        </div>

        <div className="junior-subjects-grid">
          {JUNIOR_SUBJECTS.map((s) => (
            <div className="junior-subject-card" key={s.key} style={{ "--subject-color": s.color }}>
              <span className="junior-subject-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
