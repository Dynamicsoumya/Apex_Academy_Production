import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";
import { ADMIN_NAV } from "../utils/adminNav";

const NAV = ADMIN_NAV;

const CLASSES = ["10th", "11th", "12th"];
const SCIENCE_SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "General Science", "English"];

const EMPTY_EXAM = {
  title: "",
  description: "",
  className: "11th",
  subject: "Physics",
  durationMinutes: 30,
  passPercentage: 40,
};

const EMPTY_Q = {
  question: "",
  options: { A: "", B: "", C: "", D: "" },
  correctOption: "A",
  marks: 1,
};

export default function AdminExams() {
  const user = getStoredUser();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [examForm, setExamForm] = useState(EMPTY_EXAM);
  const [qForm, setQForm] = useState(EMPTY_Q);
  const [tab, setTab] = useState("exams");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchExams = () =>
    API.get("/exams", { params: { all: "true" } })
      .then((res) => setExams(res.data))
      .catch(() => setExams([]));

  const fetchResults = () =>
    API.get("/exams/results/all")
      .then((res) => setResults(res.data))
      .catch(() => setResults([]));

  const fetchQuestions = (examId) =>
    API.get(`/exams/${examId}/questions`)
      .then((res) => {
        setQuestions(res.data.questions);
        setSelectedExam(res.data.exam);
      })
      .catch(() => setQuestions([]));

  useEffect(() => {
    fetchExams();
    fetchResults();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const { data } = await API.post("/exams", examForm);
      setMsg("success");
      setExamForm(EMPTY_EXAM);
      fetchExams();
      setSelectedExam(data);
      setTab("questions");
      fetchQuestions(data._id);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) return alert("Select or create an exam first");
    setLoading(true);
    try {
      await API.post(`/exams/${selectedExam._id}/questions`, qForm);
      setQForm(EMPTY_Q);
      fetchQuestions(selectedExam._id);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm("Delete this exam and all questions & results?")) return;
    await API.delete(`/exams/${id}`);
    if (selectedExam?._id === id) {
      setSelectedExam(null);
      setQuestions([]);
    }
    fetchExams();
    fetchResults();
  };

  const handleDeleteQuestion = async (qid) => {
    if (!selectedExam || !window.confirm("Delete this question?")) return;
    await API.delete(`/exams/${selectedExam._id}/questions/${qid}`);
    fetchQuestions(selectedExam._id);
    fetchExams();
  };

  const toggleActive = async (exam) => {
    await API.put(`/exams/${exam._id}`, { isActive: !exam.isActive });
    fetchExams();
  };

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return (
    <DashboardLayout user={user} role="admin" navItems={NAV}>
      <header className="dash-welcome-card exam-admin-hero">
        <div>
          <p className="dash-greeting">Exam Portal Admin</p>
          <h1>MCQ Exams — Class 10th, 11th & 12th Science</h1>
          <p className="dash-welcome-meta">Create exams, add MCQ questions, view student pass/fail results</p>
        </div>
        <div className="dash-welcome-stats">
          <div className="dash-mini-stat"><span>📝</span><strong>{exams.length}</strong><small>Exams</small></div>
          <div className="dash-mini-stat"><span>✅</span><strong>{passedCount}</strong><small>Passed</small></div>
          <div className="dash-mini-stat"><span>📊</span><strong>{results.length}</strong><small>Attempts</small></div>
        </div>
      </header>

      <div className="content-tabs">
        <button type="button" className={`content-tab ${tab === "exams" ? "active" : ""}`} onClick={() => setTab("exams")}>
          📋 Create Exam
        </button>
        <button type="button" className={`content-tab ${tab === "questions" ? "active" : ""}`} onClick={() => setTab("questions")}>
          ❓ Add MCQ Questions
        </button>
        <button type="button" className={`content-tab ${tab === "results" ? "active" : ""}`} onClick={() => setTab("results")}>
          📊 Student Results
        </button>
      </div>

      {tab === "exams" && (
        <>
          <form className="upload-form" onSubmit={handleCreateExam}>
            <h3>📋 Create New MCQ Exam</h3>
            {msg === "success" && (
              <div className="auth-alert" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                ✅ Exam created! Now add MCQ questions in the next tab.
              </div>
            )}
            {msg && msg !== "success" && <div className="auth-alert auth-alert-error"><span>⚠</span> {msg}</div>}

            <div className="upload-grid">
              <div className="form-group upload-full">
                <label>Exam Title</label>
                <input value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} placeholder="e.g. Class 12 Physics — Unit Test 1" required />
              </div>
              <div className="form-group upload-full">
                <label>Description</label>
                <input value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} placeholder="Brief info for students" />
              </div>
              <div className="form-group">
                <label>Class</label>
                <select value={examForm.className} onChange={(e) => setExamForm({ ...examForm, className: e.target.value })}>
                  {CLASSES.map((c) => <option key={c} value={c}>{c} Standard</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}>
                  {SCIENCE_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input type="number" min="5" value={examForm.durationMinutes} onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Pass Percentage (%)</label>
                <input type="number" min="1" max="100" value={examForm.passPercentage} onChange={(e) => setExamForm({ ...examForm, passPercentage: Number(e.target.value) })} />
              </div>
            </div>
            <button className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Exam"}</button>
          </form>

          <div className="dash-toolbar"><h2>All Exams</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Title</th><th>Class</th><th>Subject</th><th>MCQs</th><th>Pass %</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex._id}>
                    <td><strong>{ex.title}</strong></td>
                    <td>{ex.className}</td>
                    <td>{ex.subject}</td>
                    <td>{ex.questionCount || 0}</td>
                    <td>{ex.passPercentage}%</td>
                    <td>
                      <button type="button" className={`type-badge ${ex.isActive ? "" : ""}`} onClick={() => toggleActive(ex)}>
                        {ex.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <button type="button" className="type-badge" style={{ marginRight: 8 }} onClick={() => { setSelectedExam(ex); setTab("questions"); fetchQuestions(ex._id); }}>
                        Add Qs
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteExam(ex._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "questions" && (
        <>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Select Exam to Add Questions</label>
            <select
              value={selectedExam?._id || ""}
              onChange={(e) => {
                const ex = exams.find((x) => x._id === e.target.value);
                setSelectedExam(ex || null);
                if (ex) fetchQuestions(ex._id);
                else setQuestions([]);
              }}
            >
              <option value="">Choose exam...</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.title} — Class {ex.className}</option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <form className="upload-form" onSubmit={handleAddQuestion}>
              <h3>❓ Add MCQ — {selectedExam.title}</h3>
              <div className="upload-grid">
                <div className="form-group upload-full">
                  <label>Question</label>
                  <textarea rows={3} value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} placeholder="Enter the MCQ question" required />
                </div>
                {["A", "B", "C", "D"].map((key) => (
                  <div className="form-group" key={key}>
                    <label>Option {key}</label>
                    <input value={qForm.options[key]} onChange={(e) => setQForm({ ...qForm, options: { ...qForm.options, [key]: e.target.value } })} required />
                  </div>
                ))}
                <div className="form-group">
                  <label>Correct Answer</label>
                  <select value={qForm.correctOption} onChange={(e) => setQForm({ ...qForm, correctOption: e.target.value })}>
                    {["A", "B", "C", "D"].map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Marks</label>
                  <input type="number" min="1" value={qForm.marks} onChange={(e) => setQForm({ ...qForm, marks: Number(e.target.value) })} />
                </div>
              </div>
              <button className="btn btn-primary" disabled={loading}>{loading ? "Adding..." : "Add Question"}</button>
            </form>
          )}

          {questions.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 24 }}>
              <h3>Questions ({questions.length})</h3>
              <table className="table">
                <thead><tr><th>#</th><th>Question</th><th>Answer</th><th>Marks</th><th></th></tr></thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q._id}>
                      <td>{i + 1}</td>
                      <td><strong>{q.question}</strong><small>A: {q.options.A} · B: {q.options.B}</small></td>
                      <td><span className="type-badge">{q.correctOption}</span></td>
                      <td>{q.marks}</td>
                      <td><button className="btn btn-danger" onClick={() => handleDeleteQuestion(q._id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "results" && (
        <>
          <div className="exam-admin-result-summary">
            <div className="exam-result-stat pass"><strong>{passedCount}</strong><span>Passed</span></div>
            <div className="exam-result-stat fail"><strong>{failedCount}</strong><span>Failed</span></div>
            <div className="exam-result-stat"><strong>{results.length}</strong><span>Total Attempts</span></div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>%</th>
                  <th>Result</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center" }}>No student attempts yet</td></tr>
                ) : results.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.user?.name}</strong>
                      <small>{r.user?.email}</small>
                    </td>
                    <td>{r.user?.className}</td>
                    <td>{r.exam?.title}</td>
                    <td>{r.exam?.subject}</td>
                    <td>{r.score}/{r.totalMarks}</td>
                    <td>{r.percentage}%</td>
                    <td>
                      <span className={`exam-result-badge small ${r.passed ? "pass" : "fail"}`}>
                        {r.passed ? "PASS" : "FAIL"}
                      </span>
                    </td>
                    <td>{new Date(r.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/exam-portal" className="btn btn-outline">Preview Student Exam Portal →</Link>
      </p>
    </DashboardLayout>
  );
}
