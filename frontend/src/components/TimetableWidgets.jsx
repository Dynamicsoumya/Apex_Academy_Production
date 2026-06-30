import React from "react";
import { getSubjectInfo } from "./SubjectIcon";

const THEME_VARS = {
  evening: { accent: "#4f46e5", glow: "rgba(79, 70, 229, 0.12)", soft: "#eef2ff", deep: "#312e81" },
  morning: { accent: "#0284c7", glow: "rgba(2, 132, 199, 0.14)", soft: "#e0f2fe", deep: "#0c4a6e" },
  afternoon: { accent: "#c2410c", glow: "rgba(194, 65, 12, 0.16)", soft: "#fff7ed", deep: "#9a3412" },
};

function subjectStyle(name) {
  const info = getSubjectInfo(name);
  return { "--slot-accent": info.color };
}

export function TimetableWeekGrid({ week, batch, showHeader = true }) {
  const theme = batch?.theme || "evening";
  const vars = THEME_VARS[theme] || THEME_VARS.evening;

  if (!week?.length) {
    return (
      <div className="tt-empty">
        <span>📅</span>
        <p>No timetable slots added yet.</p>
      </div>
    );
  }

  const totalClasses = week.reduce((n, d) => n + d.slots.length, 0);

  return (
    <div
      className={`tt-preview-frame tt-theme-${theme}`}
      style={{
        "--tt-accent": vars.accent,
        "--tt-glow": vars.glow,
        "--tt-soft": vars.soft,
        "--tt-deep": vars.deep,
      }}
    >
      {showHeader && batch && (
        <header className="tt-preview-header">
          <div className="tt-preview-header-main">
            <span className="tt-preview-icon">{batch.icon}</span>
            <div>
              <p className="tt-preview-eyebrow">Weekly Schedule</p>
              <h3>{batch.label || batch.title}</h3>
            </div>
          </div>
          <div className="tt-preview-header-meta">
            {batch.timing && <span className="tt-preview-pill">⏱ {batch.timing}</span>}
            <span className="tt-preview-pill">📚 {totalClasses} classes / week</span>
            <span className="tt-preview-pill">Mon – Sat</span>
          </div>
        </header>
      )}

      <div className={`tt-week-grid tt-theme-${theme}`}>
        {week.map((day) => (
          <div className="tt-day-col" key={day.dayOfWeek}>
            <div className="tt-day-head">
              <strong>{day.dayName}</strong>
              <span>{day.slots.length} class{day.slots.length !== 1 ? "es" : ""}</span>
            </div>
            <div className="tt-day-slots">
              {day.slots.length === 0 ? (
                <p className="tt-no-class">No class</p>
              ) : (
                day.slots.map((slot) => {
                  const info = getSubjectInfo(slot.subject);
                  return (
                    <div
                      className="tt-slot-card"
                      key={slot._id || `${slot.dayOfWeek}-${slot.startTime}-${slot.subject}`}
                      style={subjectStyle(slot.subject)}
                    >
                      <div className="tt-slot-top">
                        <span className="tt-slot-icon" aria-hidden="true">
                          <img src={info.icon} alt="" />
                        </span>
                        <div className="tt-slot-main">
                          <span className="tt-slot-time">{slot.startTime} – {slot.endTime}</span>
                          <strong>{slot.subject}</strong>
                        </div>
                      </div>
                      {(slot.teacher || slot.room) && (
                        <div className="tt-slot-footer">
                          {slot.teacher && <span className="tt-slot-meta">👨‍🏫 {slot.teacher}</span>}
                          {slot.room && <span className="tt-slot-meta">📍 {slot.room}</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HolidayCalendar({ holidays, showBatch = false }) {
  if (!holidays?.length) {
    return (
      <div className="tt-empty tt-empty-holidays">
        <span>🎉</span>
        <p>No upcoming holidays scheduled.</p>
      </div>
    );
  }

  const grouped = holidays.reduce((acc, h) => {
    const key = new Date(h.date).toLocaleString("en-IN", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {});

  return (
    <div className="holiday-calendar">
      {Object.entries(grouped).map(([month, items]) => (
        <div className="holiday-month-group" key={month}>
          <h3 className="holiday-month-title">{month}</h3>
          <div className="holiday-list">
            {items.map((h) => (
              <article className="holiday-card" key={h._id}>
                <div className="holiday-date-badge">
                  <strong>{new Date(h.date).getDate()}</strong>
                  <span>{new Date(h.date).toLocaleString("en-IN", { weekday: "short" })}</span>
                </div>
                <div className="holiday-card-body">
                  <h4>{h.title}</h4>
                  {h.description && <p>{h.description}</p>}
                  {h.endDate && (
                    <span className="holiday-range">
                      Until {new Date(h.endDate).toLocaleDateString("en-IN")}
                    </span>
                  )}
                  {showBatch && h.batches?.length > 0 && (
                    <span className="holiday-batch-tag">
                      {h.batches.includes("all") ? "All batches" : h.batches.join(", ")}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
