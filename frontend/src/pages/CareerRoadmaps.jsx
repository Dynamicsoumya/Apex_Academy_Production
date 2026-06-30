import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getStoredUser } from "../utils/auth";
import {
  CAREER_CATEGORIES,
  CAREER_ROADMAPS,
  recommendedCategory,
  roadmapsForCategory,
  progressStorageKey,
} from "../data/careerRoadmaps";

function loadProgress(roadmapId) {
  try {
    const raw = localStorage.getItem(progressStorageKey(roadmapId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(roadmapId, progress) {
  localStorage.setItem(progressStorageKey(roadmapId), JSON.stringify(progress));
}

export default function CareerRoadmaps() {
  const user = getStoredUser();
  const defaultCategory = user?.role === "student"
    ? recommendedCategory(user.stream, user.className)
    : "all";

  const [category, setCategory] = useState(defaultCategory);
  const [selectedId, setSelectedId] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [progress, setProgress] = useState({});

  const filtered = useMemo(() => roadmapsForCategory(category), [category]);

  const selected = useMemo(
    () => CAREER_ROADMAPS.find((r) => r.id === selectedId) || filtered[0] || null,
    [selectedId, filtered]
  );

  useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setProgress(loadProgress(selected.id));
    setExpandedStep(selected.steps[0]?.id || null);
  }, [selected]);

  const toggleStep = (stepId) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId));
  };

  const toggleComplete = (stepId) => {
    const next = { ...progress, [stepId]: !progress[stepId] };
    setProgress(next);
    if (selected) saveProgress(selected.id, next);
  };

  const completedCount = selected
    ? selected.steps.filter((s) => progress[s.id]).length
    : 0;
  const progressPct = selected
    ? Math.round((completedCount / selected.steps.length) * 100)
    : 0;

  const isRecommended = (roadmap) => {
    if (user?.role !== "student") return false;
    const rec = recommendedCategory(user.stream, user.className);
    return roadmap.category === rec || (rec === "foundation" && roadmap.category === "foundation");
  };

  return (
    <div className="cr-page">
      <section className="cr-hero">
        <div className="cr-hero-inner">
          <p className="section-eyebrow">PLAN YOUR FUTURE</p>
          <h1>Interactive Career Roadmaps</h1>
          <p className="cr-hero-sub">
            Explore step-by-step paths from Class 9 to your dream career. Click milestones,
            track your progress, and see what to focus on at each stage.
          </p>
          {user?.role === "student" && (
            <div className="cr-hero-badge">
              <span>👋</span>
              Personalized for Class <strong>{user.className}</strong> · <strong>{user.stream}</strong>
            </div>
          )}
          {!user && (
            <div className="cr-hero-actions">
              <Link to="/register" className="btn btn-primary">Join Apex Academy</Link>
              <Link to="/courses" className="btn btn-outline">View Courses</Link>
            </div>
          )}
        </div>
      </section>

      <div className="cr-body">
        <div className="cr-category-tabs">
          {CAREER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cr-cat-tab ${category === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="cr-layout">
          <aside className="cr-path-list">
            <h2>Career Paths</h2>
            <p className="cr-path-list-sub">{filtered.length} roadmaps in this category</p>
            <div className="cr-path-cards">
              {filtered.map((roadmap) => {
                const active = selected?.id === roadmap.id;
                const rec = isRecommended(roadmap);
                return (
                  <button
                    key={roadmap.id}
                    type="button"
                    className={`cr-path-card ${active ? "active" : ""}`}
                    style={{ "--cr-accent": roadmap.color }}
                    onClick={() => setSelectedId(roadmap.id)}
                  >
                    <span className="cr-path-icon">{roadmap.icon}</span>
                    <div className="cr-path-card-text">
                      <strong>{roadmap.title}</strong>
                      <small>{roadmap.tagline}</small>
                    </div>
                    {rec && <span className="cr-rec-badge">For you</span>}
                  </button>
                );
              })}
            </div>
          </aside>

          {selected && (
            <main className="cr-detail">
              <header className="cr-detail-header" style={{ background: selected.gradient }}>
                <div className="cr-detail-header-text">
                  <span className="cr-detail-icon">{selected.icon}</span>
                  <div>
                    <h2>{selected.title}</h2>
                    <p>{selected.tagline}</p>
                    <span className="cr-duration">⏱ {selected.duration}</span>
                  </div>
                </div>
                <div className="cr-progress-ring" style={{ "--pct": progressPct }}>
                  <svg viewBox="0 0 36 36">
                    <path
                      className="cr-ring-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="cr-ring-fill"
                      strokeDasharray={`${progressPct}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="cr-progress-label">{progressPct}%</span>
                </div>
              </header>

              <div className="cr-meta-row">
                <div className="cr-meta-chip">
                  <strong>Key exams</strong>
                  <span>{selected.exams.join(" · ")}</span>
                </div>
                <div className="cr-meta-chip">
                  <strong>Core skills</strong>
                  <span>{selected.skills.join(" · ")}</span>
                </div>
              </div>

              <div className="cr-apex-tip">
                <span>💡</span>
                <p><strong>Apex tip:</strong> {selected.apexTip}</p>
              </div>

              <section className="cr-timeline-section">
                <h3>Your roadmap milestones</h3>
                <p className="cr-timeline-hint">
                  Click a step to expand details · Check off steps as you complete them
                </p>

                <ol className="cr-timeline">
                  {selected.steps.map((step, index) => {
                    const open = expandedStep === step.id;
                    const done = !!progress[step.id];
                    return (
                      <li
                        key={step.id}
                        className={`cr-milestone ${open ? "open" : ""} ${done ? "done" : ""}`}
                      >
                        <div className="cr-milestone-rail">
                          <span className="cr-milestone-num">{index + 1}</span>
                          {index < selected.steps.length - 1 && <span className="cr-milestone-line" />}
                        </div>

                        <div className="cr-milestone-body">
                          <button
                            type="button"
                            className="cr-milestone-head"
                            onClick={() => toggleStep(step.id)}
                            aria-expanded={open}
                          >
                            <div>
                              <span className="cr-phase">{step.phase}</span>
                              <strong>{step.title}</strong>
                              <p>{step.summary}</p>
                            </div>
                            <span className="cr-chevron">{open ? "▲" : "▼"}</span>
                          </button>

                          {open && (
                            <div className="cr-milestone-panel">
                              <span className="cr-step-duration">{step.duration}</span>
                              <ul>
                                {step.details.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                              <label className="cr-check-label">
                                <input
                                  type="checkbox"
                                  checked={done}
                                  onChange={() => toggleComplete(step.id)}
                                />
                                Mark this milestone as complete
                              </label>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <div className="cr-cta-bar">
                <p>Ready to start preparing with expert guidance?</p>
                <Link to="/register" className="btn btn-primary">Enroll at Apex Academy</Link>
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
