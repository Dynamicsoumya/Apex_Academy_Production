import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import SubjectIcon from "../components/SubjectIcon";
import Pagination from "../components/Pagination";
import { mediaUrl } from "../utils/mediaUrl";
import { paginateItems } from "../utils/pagination";
import API from "../api/api";

const CLASSES = ["all", "9th", "10th", "11th", "12th"];

const SUBJECTS = [
  "Mathematics",
  "General Science",
  "Social Science",
  "MIL",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
  "Accountancy",
  "Economics",
];

export default function Questions() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    API.get("/pyq")
      .then((res) => setPapers(res.data))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(
    () => [...new Set(papers.map((p) => p.examYear))].sort().reverse(),
    [papers]
  );

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (filterClass !== "all" && p.className !== filterClass) return false;
      if (filterSubject && p.subject.toLowerCase() !== filterSubject.toLowerCase()) return false;
      if (filterYear && p.examYear !== filterYear) return false;
      return true;
    });
  }, [papers, filterClass, filterSubject, filterYear]);

  useEffect(() => {
    setPage(1);
  }, [filterClass, filterSubject, filterYear]);

  const pagination = paginateItems(filtered, page);

  return (
    <div className="questions-page">
      <div className="page-banner pyq-banner">
        <div className="page-banner-inner">
          <p className="section-eyebrow">QUESTION BANK</p>
          <h1>Previous Year Questions (PYQ)</h1>
          <p>
            Download board exam question papers for Class 9th, 10th, 11th & 12th.
            Papers are uploaded by Apex Academy admin.
          </p>
          <Link to="/" className="btn btn-outline btn-lg" style={{ marginTop: 16 }}>
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="section questions-section">
        <div className="questions-filters">
          <div className="questions-filter">
            <label htmlFor="q-class">Class</label>
            <select id="q-class" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Classes" : `${c} Standard`}
                </option>
              ))}
            </select>
          </div>
          <div className="questions-filter">
            <label htmlFor="q-subject">Subject</label>
            <select id="q-subject" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="questions-filter">
            <label htmlFor="q-year">Exam Year</label>
            <select id="q-year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="courses-loading">
            <span className="auth-spinner" />
            <p>Loading question papers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Question Papers Found</h3>
            <p>Try changing filters or check back after admin uploads PYQ papers.</p>
          </div>
        ) : (
          <>
            <div className="pyq-grid">
              {pagination.pageItems.map((p) => (
              <article className="pyq-card" key={p._id}>
                <div className="pyq-card-top">
                  <span className="pyq-year-badge">{p.examYear}</span>
                  <span className="pyq-class-badge">Class {p.className}</span>
                </div>
                <div className="pyq-card-icon">📋</div>
                <h3>{p.title}</h3>
                {p.description && <p className="pyq-card-desc">{p.description}</p>}
                <div className="pyq-card-meta">
                  <SubjectIcon subject={p.subject} size="xs" />
                  <span>{p.subject}</span>
                </div>
                <a
                  className="btn btn-primary pyq-download-btn"
                  href={mediaUrl(p.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View / Download PDF →
                </a>
              </article>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
