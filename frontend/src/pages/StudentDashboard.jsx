import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardReviewsBlock from "../components/DashboardReviewsBlock";
import SubjectIcon from "../components/SubjectIcon";
import Pagination from "../components/Pagination";
import { mediaUrl } from "../utils/mediaUrl";
import { getStoredUser } from "../utils/auth";
import { isPdfDoc, isLectureDoc } from "../utils/documents";
import { paginateItems } from "../utils/pagination";
import { ACADEMY_CLASSES } from "../utils/academyClasses";
import { PREMIUM_COMING_SOON } from "../utils/features";

const NAV = [
  { type: "group", label: "My Learning" },
  { to: "/student", icon: "📚", label: "Overview" },
  { to: "/timetable", icon: "📅", label: "Timetable" },
  { to: "/student#dash-pdfs", icon: "📄", label: "PDF Notes" },
  { to: "/student#dash-lectures", icon: "🎬", label: "Video Lectures" },
  { to: "/exam-portal", icon: "📋", label: "Exam Portal" },
  { to: "/admissions", icon: "✨", label: "Admissions" },
  { to: "/student#dash-reviews", icon: "⭐", label: "Reviews" },
  { type: "group", label: "Explore" },
  { to: "/career-roadmaps", icon: "🗺️", label: "Career Roadmaps" },
  { to: "/questions", icon: "📝", label: "PYQ Papers" },
  { to: "/courses", icon: "🎓", label: "Courses" },
  { to: "/", icon: "🏠", label: "Back to Home" },
];

function LecturePlayer({ lecture, onClose }) {
  return (
    <div className="lecture-modal" onClick={onClose}>
      <div className="lecture-modal-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lecture-close" onClick={onClose}>✕</button>
        <h3>{lecture.title}</h3>
        <p className="lecture-modal-sub">
          {lecture.subject} · {lecture.className}
          {lecture.duration ? ` · ${lecture.duration}` : ""}
        </p>
        <div className="lecture-player-box">
          {lecture.youtubeId ? (
            <iframe
              title={lecture.title}
              src={`https://www.youtube.com/embed/${lecture.youtubeId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video controls src={mediaUrl(lecture.fileUrl)} />
          )}
        </div>
        {lecture.description && <p className="lecture-modal-desc">{lecture.description}</p>}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const user = getStoredUser();
  const location = useLocation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [pdfPage, setPdfPage] = useState(1);
  const [lecturePage, setLecturePage] = useState(1);
  const [activeLecture, setActiveLecture] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = filterClass === "all" ? {} : { className: filterClass };
    API.get("/documents", { params })
      .then((res) => {
        setDocs(res.data);
        setFetchError("");
      })
      .catch((err) => {
        setFetchError(err.response?.data?.message || "Failed to load content.");
      })
      .finally(() => setLoading(false));
  }, [filterClass]);

  useEffect(() => {
    setPdfPage(1);
    setLecturePage(1);
  }, [filterClass]);

  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, loading]);

  const pdfs = docs.filter(isPdfDoc);
  const lectures = docs.filter(isLectureDoc);
  const pdfPagination = paginateItems(pdfs, pdfPage);
  const lecturePagination = paginateItems(lectures, lecturePage);
  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <DashboardLayout user={user} role="student" navItems={NAV}>
      {activeLecture && (
        <LecturePlayer lecture={activeLecture} onClose={() => setActiveLecture(null)} />
      )}

      <header className="dash-welcome-card">
        <div className="dash-welcome-top">
          <div>
            <p className="dash-greeting">Student Dashboard</p>
            <h1>Hello, {firstName} 👋</h1>
            <p className="dash-welcome-meta">
              Class <strong>{user?.className}</strong> · <strong>{user?.stream}</strong>
            </p>
          </div>
          <div className="dash-welcome-stats">
            <div className="dash-mini-stat">
              <span>📄</span>
              <strong>{pdfs.length}</strong>
              <small>PDFs</small>
            </div>
            <div className="dash-mini-stat">
              <span>🎬</span>
              <strong>{lectures.length}</strong>
              <small>Lectures</small>
            </div>
          </div>
        </div>
        <div className="dash-welcome-filter">
          <label htmlFor="classFilter">Show material for</label>
          <select id="classFilter" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="all">All Classes</option>
            {ACADEMY_CLASSES.map((c) => (
              <option key={c} value={c}>{c} Standard</option>
            ))}
          </select>
        </div>
      </header>

      {fetchError && (
        <div className="auth-alert auth-alert-error dash-alert">
          <span>⚠</span> {fetchError}
        </div>
      )}

      {loading ? (
        <div className="courses-loading dash-loading">
          <span className="auth-spinner" />
          <p>Loading your study material...</p>
        </div>
      ) : (
        <>
          <section className="dash-section dash-section-card" id="dash-pdfs">
            <div className="dash-section-head">
              <div className="dash-section-title">
                <span className="dash-section-icon">📄</span>
                <div>
                  <h2>PDF Notes</h2>
                  <p>Download chapter-wise study material</p>
                </div>
              </div>
              <span className="dash-section-count">{pdfs.length} files</span>
            </div>

            {pdfs.length === 0 ? (
              <div className="empty-state dash-empty">
                <div className="empty-icon">📭</div>
                <h3>No PDFs Yet</h3>
                <p>No notes uploaded{filterClass === "all" ? "" : ` for Class ${filterClass}`} yet.</p>
              </div>
            ) : (
              <>
                <div className="doc-list">
                  {pdfPagination.pageItems.map((d) => (
                    <div className="doc-card" key={d._id}>
                      <div className="doc-card-top">
                        <div className="doc-subject-row">
                          <SubjectIcon subject={d.subject} size="sm" />
                          <span className="doc-subject-badge">{d.subject}</span>
                        </div>
                        <span className="doc-class-tag">Class {d.className}</span>
                      </div>
                      <h3>{d.title}</h3>
                      <p>{d.description}</p>
                      <a
                        className="doc-download-btn"
                        href={mediaUrl(d.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📄 View / Download
                      </a>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={pdfPagination.page}
                  totalPages={pdfPagination.totalPages}
                  total={pdfPagination.total}
                  rangeStart={pdfPagination.rangeStart}
                  rangeEnd={pdfPagination.rangeEnd}
                  onPageChange={setPdfPage}
                />
              </>
            )}
          </section>

          <section className="dash-section dash-section-card" id="dash-lectures">
            <div className="dash-section-head">
              <div className="dash-section-title">
                <span className="dash-section-icon">🎬</span>
                <div>
                  <h2>Video Lectures</h2>
                  <p>Watch and revise class recordings</p>
                </div>
              </div>
              <span className="dash-section-count">{lectures.length} videos</span>
            </div>

            {lectures.length === 0 ? (
              <div className="empty-state dash-empty">
                <div className="empty-icon">🎬</div>
                <h3>No Lectures Yet</h3>
                <p>No video lectures{filterClass === "all" ? "" : ` for Class ${filterClass}`} yet.</p>
              </div>
            ) : (
              <>
                <div className="lecture-grid">
                  {lecturePagination.pageItems.map((l) => (
                    <div className="lecture-card" key={l._id}>
                      <div className="lecture-thumb" onClick={() => setActiveLecture(l)}>
                        {l.youtubeId ? (
                          <img
                            src={`https://img.youtube.com/vi/${l.youtubeId}/mqdefault.jpg`}
                            alt={l.title}
                          />
                        ) : (
                          <div className="lecture-thumb-placeholder">🎬</div>
                        )}
                        <span className="lecture-play-btn">▶</span>
                        {l.duration && <span className="lecture-duration">{l.duration}</span>}
                      </div>
                      <div className="lecture-card-body">
                        <div className="doc-subject-row">
                          <SubjectIcon subject={l.subject} size="xs" />
                          <span className="doc-subject-badge">{l.subject}</span>
                          <span className="doc-class-tag">Class {l.className}</span>
                        </div>
                        <h3>{l.title}</h3>
                        <p>{l.description}</p>
                        <button
                          type="button"
                          className="doc-download-btn"
                          onClick={() => setActiveLecture(l)}
                        >
                          ▶ Watch Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={lecturePagination.page}
                  totalPages={lecturePagination.totalPages}
                  total={lecturePagination.total}
                  rangeStart={lecturePagination.rangeStart}
                  rangeEnd={lecturePagination.rangeEnd}
                  onPageChange={setLecturePage}
                />
              </>
            )}
          </section>
        </>
      )}

      <section className="dash-section dash-section-card" id="dash-reviews">
        <DashboardReviewsBlock />
      </section>
    </DashboardLayout>
  );
}
