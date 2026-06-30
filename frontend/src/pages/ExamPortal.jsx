import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import SubjectIcon from "../components/SubjectIcon";
import Pagination from "../components/Pagination";
import { getStoredUser } from "../utils/auth";
import { paginateItems, EXAM_PAGE_SIZE, EXAM_PAGE_SIZE_OPTIONS } from "../utils/pagination";

const CLASSES = ["10th", "11th", "12th"];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ResultCard({ result, exam, onBack }) {
  const passed = result.passed;
  return (
    <div className={`exam-result-card ${passed ? "exam-result-pass" : "exam-result-fail"}`}>
      <div className="exam-result-icon">{passed ? "🏆" : "📚"}</div>
      <h2>{passed ? "Congratulations! You Passed" : "Keep Practicing"}</h2>
      <p className="exam-result-sub">
        {exam?.title} · {exam?.subject} · Class {exam?.className}
      </p>
      <div className="exam-result-score-ring">
        <strong>{result.percentage}%</strong>
        <span>{result.score} / {result.totalMarks} marks</span>
      </div>
      <div className="exam-result-stats">
        <div><span>Correct</span><strong>{result.correctCount} / {result.totalQuestions}</strong></div>
        <div><span>Pass mark</span><strong>{result.passPercentage}%</strong></div>
        <div><span>Time</span><strong>{formatTime(result.timeTakenSeconds || 0)}</strong></div>
      </div>
      <span className={`exam-result-badge ${passed ? "pass" : "fail"}`}>
        {passed ? "✓ PASSED" : "✗ NOT PASSED"}
      </span>
      <button type="button" className="btn btn-primary btn-lg" onClick={onBack}>
        Back to Exam Portal
      </button>
    </div>
  );
}

function TakeExam({ examId, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [startedAt] = useState(Date.now());

  const loadExam = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get(`/exams/${examId}/start`);
      setExam(data.exam);
      setQuestions(data.questions);
      setTimeLeft((data.exam.durationMinutes || 30) * 60);
    } catch (err) {
      const msg = err.response?.data?.message || "Could not load exam";
      if (err.response?.data?.result) {
        onDoneRef.current(err.response.data.result, err.response?.data?.exam);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (!auto && !window.confirm("Submit your answers? You cannot change them after.")) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedOption: answers[q._id] || null,
        })),
        timeTakenSeconds: Math.round((Date.now() - startedAt) / 1000),
      };
      const { data } = await API.post(`/exams/${examId}/submit`, payload);
      onDoneRef.current(data.result, exam);
    } catch (err) {
      alert(err.response?.data?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [answers, exam, examId, questions, startedAt]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitting) {
      handleSubmit(true);
    }
  }, [timeLeft, questions.length, submitting, handleSubmit]);

  if (loading) {
    return (
      <div className="courses-loading exam-loading">
        <span className="auth-spinner" />
        <p>Loading exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state exam-empty">
        <div className="empty-icon">⚠️</div>
        <h3>{error}</h3>
        <button type="button" className="btn btn-primary" onClick={onDone}>Back</button>
      </div>
    );
  }

  const q = questions[current];
  const answered = questions.filter((x) => answers[x._id]).length;

  return (
    <div className="exam-take-wrap">
      <div className="exam-take-header">
        <div>
          <h2>{exam.title}</h2>
          <p>{exam.subject} · Class {exam.className} · Pass: {exam.passPercentage}%</p>
        </div>
        <div className={`exam-timer ${timeLeft <= 60 ? "urgent" : ""}`}>
          ⏱ {formatTime(Math.max(0, timeLeft))}
        </div>
      </div>

      <div className="exam-progress-bar">
        <div style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="exam-progress-text">
        Question {current + 1} of {questions.length} · {answered} answered
      </p>

      <div className="exam-question-card">
        <h3>{q.question}</h3>
        <div className="exam-options">
          {["A", "B", "C", "D"].map((key) => (
            <button
              key={key}
              type="button"
              className={`exam-option ${answers[q._id] === key ? "selected" : ""}`}
              onClick={() => setAnswers({ ...answers, [q._id]: key })}
            >
              <span className="exam-option-key">{key}</span>
              <span>{q.options[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="exam-nav-btns">
        <button type="button" className="btn btn-outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
          ← Previous
        </button>
        {current < questions.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => setCurrent(current + 1)}>
            Next →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => handleSubmit(false)}>
            {submitting ? "Submitting..." : "Submit Exam ✓"}
          </button>
        )}
      </div>

      <div className="exam-q-dots">
        {questions.map((x, i) => (
          <button
            key={x._id}
            type="button"
            className={`exam-q-dot ${i === current ? "active" : ""} ${answers[x._id] ? "answered" : ""}`}
            onClick={() => setCurrent(i)}
            title={`Question ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ExamPortal() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?._id;
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState(user?.className || "all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(EXAM_PAGE_SIZE);
  const [resultView, setResultView] = useState(null);
  const [resultExam, setResultExam] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [exRes, histRes] = await Promise.all([
        API.get("/exams", { params: filterClass === "all" ? {} : { className: filterClass } }),
        userId ? API.get("/exams/my/history").catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setExams(exRes.data);
      setHistory(histRes.data);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [filterClass, userId]);

  useEffect(() => {
    if (!examId) fetchData();
  }, [examId, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [filterClass, pageSize]);

  const pagination = useMemo(
    () => paginateItems(exams, page, pageSize),
    [exams, page, pageSize]
  );

  const handleDone = useCallback((result, exam) => {
    setResultView(result);
    setResultExam(exam);
    navigate("/exam-portal");
  }, [navigate]);

  if (!user) {
    return (
      <div className="exam-portal-page">
        <div className="page-banner exam-portal-banner">
          <div className="page-banner-inner">
            <p className="section-eyebrow">ONLINE EXAM PORTAL</p>
            <h1>MCQ Practice Tests</h1>
            <p>Class 10th, 11th & 12th Science — login to attempt exams and see your pass/fail result instantly.</p>
            <Link to="/login" className="btn btn-primary btn-lg">Login to Start</Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="exam-portal-page">
        <div className="section exam-section">
          <div className="empty-state">
            <h3>Admin: Manage exams from the Exam Admin panel</h3>
            <Link to="/admin/exams" className="btn btn-primary">Go to Exam Admin →</Link>
          </div>
        </div>
      </div>
    );
  }

  if (examId && !resultView) {
    return (
      <div className="exam-portal-page">
        <div className="section exam-section">
          <TakeExam examId={examId} onDone={handleDone} />
        </div>
      </div>
    );
  }

  return (
    <div className="exam-portal-page">
      <div className="page-banner exam-portal-banner">
        <div className="page-banner-inner">
          <p className="section-eyebrow">ONLINE EXAM PORTAL</p>
          <h1>MCQ Practice Tests</h1>
          <p>
            Hello {user.name?.split(" ")[0]}! Class <strong>{user.className}</strong> Science exams —
            attempt MCQs and get instant <strong>Pass / Fail</strong> results.
          </p>
        </div>
      </div>

      <div className="section exam-section">
        {resultView && (
          <ResultCard
            result={resultView}
            exam={resultExam}
            onBack={() => { setResultView(null); fetchData(); }}
          />
        )}

        <div className="exam-portal-grid-head">
          <h2>Available Exams</h2>
          <div className="exam-portal-grid-filters">
            <label className="exam-portal-filter">
              <span>Class</span>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                <option value="all">All Classes</option>
                {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </label>
            <label className="exam-portal-filter">
              <span>Per page</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {EXAM_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="courses-loading"><span className="auth-spinner" /><p>Loading exams...</p></div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Exams Yet</h3>
            <p>Your teacher will add MCQ exams soon. Check back later!</p>
          </div>
        ) : (
          <>
            <div className="exam-list-grid">
              {pagination.pageItems.map((exam) => (
              <article className={`exam-list-card ${exam.attempted ? "attempted" : ""}`} key={exam._id}>
                <div className="exam-list-card-top">
                  <SubjectIcon subject={exam.subject} size="sm" />
                  <span className="exam-class-tag">Class {exam.className}</span>
                </div>
                <h3>{exam.title}</h3>
                <p>{exam.description || `${exam.subject} MCQ test`}</p>
                <ul className="exam-meta-list">
                  <li>📝 {exam.questionCount} MCQs</li>
                  <li>⏱ {exam.durationMinutes} min</li>
                  <li>✓ Pass: {exam.passPercentage}%</li>
                </ul>
                {exam.attempted && exam.myResult ? (
                  <div className="exam-attempted-row">
                    <span className={`exam-result-badge small ${exam.myResult.passed ? "pass" : "fail"}`}>
                      {exam.myResult.passed ? "PASSED" : "FAILED"} — {exam.myResult.percentage}%
                    </span>
                  </div>
                ) : exam.questionCount > 0 ? (
                  <Link to={`/exam-portal/${exam._id}`} className="btn btn-primary exam-start-btn">
                    Start Exam →
                  </Link>
                ) : (
                  <span className="exam-soon-tag">Questions coming soon</span>
                )}
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

        {history.length > 0 && (
          <div className="exam-history-section">
            <h2>Your Results History</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td><strong>{h.exam?.title}</strong></td>
                      <td>{h.exam?.subject}</td>
                      <td>{h.exam?.className}</td>
                      <td>{h.score}/{h.totalMarks} ({h.percentage}%)</td>
                      <td>
                        <span className={`exam-result-badge small ${h.passed ? "pass" : "fail"}`}>
                          {h.passed ? "PASS" : "FAIL"}
                        </span>
                      </td>
                      <td>{new Date(h.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
