import React from "react";
import { Link } from "react-router-dom";
import { BATCH_PROGRAMS } from "../utils/academyClasses";

const SENIOR_PROGRAMS = BATCH_PROGRAMS.filter((p) => p.id !== "junior");

export default function SeniorBatchSection() {
  return (
    <section className="section senior-batch-section" id="senior-batch">
      <div className="senior-batch-bg" aria-hidden="true" />
      <div className="section-header">
        <p className="section-eyebrow">+2 PROGRAM · CLASS 11TH & 12TH</p>
        <h2>Science & Arts Batches</h2>
        <p className="section-sub">
          Choose your +2 stream — morning Science or afternoon Arts — both batches cover every subject you need for board exams.
        </p>
      </div>

      <div className="senior-programs-grid">
        {SENIOR_PROGRAMS.map((program) => (
          <article className={`senior-program-card senior-program-${program.theme}`} key={program.id}>
            <div className="senior-program-card-top">
              <span className="senior-program-icon">{program.icon}</span>
              <div>
                <p className="senior-program-eyebrow">{program.eyebrow}</p>
                <h3>{program.title}</h3>
                <p className="senior-program-timing">{program.timing} · Mon–Sat</p>
              </div>
            </div>

            <span className="senior-program-stream">{program.streamLabel}</span>

            <div className="senior-program-subjects">
              {program.subjects.map((s) => (
                <span className="senior-subject-pill" key={s.key} style={{ "--pill-color": s.color }}>
                  <span>{s.icon}</span>
                  {s.title}
                </span>
              ))}
            </div>

            <Link to={program.coursesLink} className="btn btn-primary">
              View {program.stream} Courses →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
