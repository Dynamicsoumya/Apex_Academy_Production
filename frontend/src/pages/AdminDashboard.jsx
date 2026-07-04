import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import SubjectIcon from "../components/SubjectIcon";
import Pagination from "../components/Pagination";
import { getStoredUser } from "../utils/auth";
import { getAdminNav } from "../utils/adminNav";
import { isSuperAdmin } from "../utils/roles";
import { ACADEMY_CLASSES, subjectsForClass } from "../utils/academyClasses";
import { isPdfDoc, isLectureDoc } from "../utils/documents";
import { mediaUrl } from "../utils/mediaUrl";
import { paginateItems } from "../utils/pagination";

const getNav = (user) => getAdminNav(user);
const staffRole = (user) => (isSuperAdmin(user) ? "superadmin" : "admin");

const PYQ_SUBJECTS = [
  "Mathematics", "General Science", "Social Science", "MIL", "English",
  "Physics", "Chemistry", "Biology", "Accountancy", "Economics",
];

const PYQ_EMPTY = { title: "", description: "", subject: "", className: "10th", examYear: new Date().getFullYear().toString() };

const PREMIUM_EMPTY = {
  title: "",
  description: "",
  subject: "",
  className: "10th",
  price: "",
  contentType: "pdf",
  examYear: new Date().getFullYear().toString(),
  duration: "",
  youtubeUrl: "",
};

const EMPTY = { title: "", description: "", subject: "", className: "10th", duration: "", youtubeUrl: "" };

function UploadForm({ type, onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isLecture = type === "lecture";
  const classSubjects = subjectsForClass(form.className);

  const handleClassChange = (className) => {
    const nextSubjects = subjectsForClass(className).map((s) => s.title.toLowerCase());
    const keepSubject = nextSubjects.includes(form.subject.toLowerCase());
    setForm({ ...form, className, subject: keepSubject ? form.subject : "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return setMsg("Please select or enter a subject.");
    if (!isLecture && !file) return setMsg("Please select a PDF file.");
    if (isLecture && !file && !form.youtubeUrl.trim()) {
      return setMsg("Upload a video file OR paste a YouTube link.");
    }

    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("materialType", type);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("subject", form.subject);
    fd.append("className", form.className);
    if (isLecture) {
      if (form.duration) fd.append("duration", form.duration);
      if (form.youtubeUrl) fd.append("youtubeUrl", form.youtubeUrl);
    }
    if (file) fd.append("file", file);

    try {
      const { data } = await API.post("/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg("success");
      setForm(EMPTY);
      setFile(null);
      e.target.reset();
      onSuccess(data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h3>{isLecture ? "🎬 Upload Video Lecture" : "📄 Upload PDF / Notes"}</h3>
      <p className="upload-form-hint">
        For Class 9th & 10th — Math, Science, Social Science, MIL, English · For 11th & 12th — PCM/PCB Science subjects
      </p>
      {msg === "success" && (
        <div className="auth-alert" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          ✅ {isLecture ? "Lecture" : "PDF"} uploaded successfully!
        </div>
      )}
      {msg && msg !== "success" && (
        <div className="auth-alert auth-alert-error"><span>⚠</span> {msg}</div>
      )}

      <div className="upload-grid">
        <div className="form-group">
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={isLecture ? "e.g. Physics — Laws of Motion" : "e.g. Chemistry Chapter 3 Notes"}
            required
          />
        </div>

        <div className="form-group">
          <label>Subject</label>
          <div className="subject-picker">
            {classSubjects.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`subject-pick-btn ${form.subject.toLowerCase() === s.title.toLowerCase() ? "active" : ""}`}
                onClick={() => setForm({ ...form, subject: s.title })}
                style={{ "--subject-color": s.color }}
              >
                <SubjectIcon subject={s.title} size="sm" />
                <span>{s.title}</span>
              </button>
            ))}
          </div>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Or type subject name"
            style={{ marginTop: 10 }}
          />
        </div>

        <div className="form-group upload-full">
          <label>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description"
          />
        </div>

        <div className="form-group">
          <label>Class</label>
          <select value={form.className} onChange={(e) => handleClassChange(e.target.value)}>
            {ACADEMY_CLASSES.map((c) => (
              <option key={c} value={c}>{c} Standard</option>
            ))}
          </select>
        </div>

        {isLecture ? (
          <>
            <div className="form-group">
              <label>Duration (optional)</label>
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 45 min"
              />
            </div>
            <div className="form-group">
              <label>YouTube Link (optional)</label>
              <input
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="form-group upload-full">
              <label>Or Upload Video File (MP4, WebM — max 500MB)</label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </>
        ) : (
          <div className="form-group upload-full">
            <label>PDF / Document File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              required={!file}
            />
          </div>
        )}
      </div>

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Uploading..." : isLecture ? "Upload Lecture" : "Upload PDF"}
      </button>
    </form>
  );
}

function PremiumUploadForm({ onSuccess }) {
  const [form, setForm] = useState(PREMIUM_EMPTY);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isVideo = form.contentType === "video";
  const isPyq = form.contentType === "pyq";
  const classSubjects = subjectsForClass(form.className);

  const handleClassChange = (className) => {
    const nextSubjects = subjectsForClass(className).map((s) => s.title.toLowerCase());
    const keepSubject = nextSubjects.includes(form.subject.toLowerCase());
    setForm({ ...form, className, subject: keepSubject ? form.subject : "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return setMsg("Please select or enter a subject.");
    if (!form.price || Number(form.price) < 1) return setMsg("Enter a valid price (min ₹1).");
    if (!isVideo && !file) return setMsg("Please select a PDF file.");
    if (isVideo && !file && !form.youtubeUrl.trim()) {
      return setMsg("Upload a video file OR paste a YouTube link.");
    }
    if (isPyq && !form.examYear.trim()) return setMsg("Exam year is required for PYQ.");

    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("contentType", form.contentType);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("subject", form.subject);
    fd.append("className", form.className);
    fd.append("price", form.price);
    if (isPyq) fd.append("examYear", form.examYear);
    if (isVideo) {
      if (form.duration) fd.append("duration", form.duration);
      if (form.youtubeUrl) fd.append("youtubeUrl", form.youtubeUrl);
    }
    if (file) fd.append("file", file);

    try {
      const { data } = await API.post("/premium", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg("success");
      setForm(PREMIUM_EMPTY);
      setFile(null);
      e.target.reset();
      onSuccess(data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="upload-form premium-upload-form" onSubmit={handleSubmit}>
      <h3>👑 Add Premium Content (Paid)</h3>
      <p className="upload-form-hint">
        Students can see this content but must purchase to open. Set name and price — payments via Google Pay, PhonePe, Paytm & UPI.
      </p>
      {msg === "success" && (
        <div className="auth-alert" style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}>
          ✅ Premium content added! Students will see it locked until they pay.
        </div>
      )}
      {msg && msg !== "success" && (
        <div className="auth-alert auth-alert-error"><span>⚠</span> {msg}</div>
      )}

      <div className="upload-grid">
        <div className="form-group">
          <label>Content Type</label>
          <select
            value={form.contentType}
            onChange={(e) => setForm({ ...form, contentType: e.target.value })}
          >
            <option value="pdf">PDF Notes</option>
            <option value="video">Video Lecture</option>
            <option value="pyq">PYQ Question Paper</option>
          </select>
        </div>

        <div className="form-group">
          <label>Price (₹)</label>
          <input
            type="number"
            min="1"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="e.g. 99"
            required
          />
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Premium Physics PYQ Pack"
            required
          />
        </div>

        <div className="form-group">
          <label>Subject</label>
          <div className="subject-picker">
            {classSubjects.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`subject-pick-btn ${form.subject.toLowerCase() === s.title.toLowerCase() ? "active" : ""}`}
                onClick={() => setForm({ ...form, subject: s.title })}
                style={{ "--subject-color": s.color }}
              >
                <SubjectIcon subject={s.title} size="sm" />
                <span>{s.title}</span>
              </button>
            ))}
          </div>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Or type subject name"
            style={{ marginTop: 10 }}
          />
        </div>

        <div className="form-group upload-full">
          <label>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What students get after purchase"
          />
        </div>

        <div className="form-group">
          <label>Class</label>
          <select value={form.className} onChange={(e) => handleClassChange(e.target.value)}>
            {ACADEMY_CLASSES.map((c) => (
              <option key={c} value={c}>{c} Standard</option>
            ))}
          </select>
        </div>

        {isPyq && (
          <div className="form-group">
            <label>Exam Year</label>
            <input
              value={form.examYear}
              onChange={(e) => setForm({ ...form, examYear: e.target.value })}
              placeholder="e.g. 2024"
              required
            />
          </div>
        )}

        {isVideo ? (
          <>
            <div className="form-group">
              <label>Duration (optional)</label>
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 45 min"
              />
            </div>
            <div className="form-group">
              <label>YouTube Link (optional)</label>
              <input
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="form-group upload-full">
              <label>Or Upload Video File</label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </>
        ) : (
          <div className="form-group upload-full">
            <label>PDF / Document File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              required={!file}
            />
          </div>
        )}
      </div>

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Uploading..." : "Add Premium Content"}
      </button>
    </form>
  );
}

function PyqUploadForm({ onSuccess }) {
  const [form, setForm] = useState(PYQ_EMPTY);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return setMsg("Please select or enter a subject.");
    if (!file) return setMsg("Please select a question paper PDF.");

    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("subject", form.subject);
    fd.append("className", form.className);
    fd.append("examYear", form.examYear);
    fd.append("file", file);

    try {
      const { data } = await API.post("/pyq", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg("success");
      setForm(PYQ_EMPTY);
      setFile(null);
      e.target.reset();
      onSuccess(data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h3>📝 Upload Previous Year Question Paper</h3>
      {msg === "success" && (
        <div className="auth-alert" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          ✅ Question paper uploaded! Students can see it in the Question section.
        </div>
      )}
      {msg && msg !== "success" && (
        <div className="auth-alert auth-alert-error"><span>⚠</span> {msg}</div>
      )}

      <div className="upload-grid">
        <div className="form-group">
          <label>Paper Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. 10th Board Math — 2024"
            required
          />
        </div>

        <div className="form-group">
          <label>Exam Year</label>
          <input
            value={form.examYear}
            onChange={(e) => setForm({ ...form, examYear: e.target.value })}
            placeholder="e.g. 2024"
            required
          />
        </div>

        <div className="form-group">
          <label>Class</label>
          <select value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })}>
            <option value="9th">9th Standard</option>
            <option value="10th">10th Standard</option>
            <option value="11th">11th Standard</option>
            <option value="12th">12th Standard</option>
          </select>
        </div>

        <div className="form-group">
          <label>Subject</label>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
            <option value="">Select subject</option>
            {PYQ_SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group upload-full">
          <label>Description (optional)</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Full board paper with solutions"
          />
        </div>

        <div className="form-group upload-full">
          <label>Question Paper PDF</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>
      </div>

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Uploading..." : "Upload Question Paper"}
      </button>
    </form>
  );
}

export default function AdminDashboard() {
  const user = getStoredUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [pyqPapers, setPyqPapers] = useState([]);
  const [premiumItems, setPremiumItems] = useState([]);
  const [tab, setTab] = useState("pdf");
  const [listPage, setListPage] = useState(1);
  const [fetchError, setFetchError] = useState("");
  const [editingPrice, setEditingPrice] = useState(null);

  const selectTab = (next) => {
    setTab(next);
    if (next === "premium") {
      navigate("/admin#premium", { replace: true });
    } else if (location.hash) {
      navigate("/admin", { replace: true });
    }
  };

  useEffect(() => {
    if (location.hash === "#premium") {
      setTab("premium");
      requestAnimationFrame(() => {
        document.getElementById("admin-content-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash]);

  const fetchDocs = () =>
    API.get("/documents")
      .then((res) => {
        setDocs(res.data);
        setFetchError("");
      })
      .catch((err) => {
        setFetchError(err.response?.data?.message || "Failed to load uploads. Please re-login.");
      });

  const fetchPyq = () =>
    API.get("/pyq")
      .then((res) => setPyqPapers(res.data))
      .catch(() => setPyqPapers([]));

  const fetchPremium = () =>
    API.get("/premium", { params: { all: "true" } })
      .then((res) => setPremiumItems(res.data))
      .catch(() => setPremiumItems([]));

  useEffect(() => {
    fetchDocs();
    fetchPyq();
    fetchPremium();
  }, []);

  useEffect(() => {
    setListPage(1);
  }, [tab]);

  const handleUploadSuccess = (newDoc) => {
    if (newDoc) {
      setDocs((prev) => [newDoc, ...prev.filter((d) => d._id !== newDoc._id)]);
    }
    fetchDocs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await API.delete(`/documents/${id}`);
    fetchDocs();
  };

  const handlePyqSuccess = (newPaper) => {
    if (newPaper) {
      setPyqPapers((prev) => [newPaper, ...prev.filter((p) => p._id !== newPaper._id)]);
    }
    fetchPyq();
  };

  const handleDeletePyq = async (id) => {
    if (!window.confirm("Delete this question paper?")) return;
    await API.delete(`/pyq/${id}`);
    fetchPyq();
  };

  const handlePremiumSuccess = (newItem) => {
    if (newItem) {
      setPremiumItems((prev) => [newItem, ...prev.filter((p) => p._id !== newItem._id)]);
    }
    fetchPremium();
  };

  const handleDeletePremium = async (id) => {
    if (!window.confirm("Delete this premium item?")) return;
    try {
      await API.delete(`/premium/${id}`);
      setPremiumItems((prev) => prev.filter((p) => p._id !== id));
      fetchPremium();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete premium item");
    }
  };

  const handleUpdatePrice = async (id, price) => {
    const parsed = Number(price);
    if (!parsed || parsed < 1) return alert("Enter valid price (min ₹1)");
    await API.put(`/premium/${id}`, { price: parsed });
    setEditingPrice(null);
    fetchPremium();
  };

  const pdfs = docs.filter(isPdfDoc);
  const lectures = docs.filter(isLectureDoc);
  const shown = tab === "pdf" ? pdfs : tab === "lecture" ? lectures : tab === "pyq" ? pyqPapers : premiumItems;
  const pagination = paginateItems(shown, listPage);
  const pageItems = pagination.pageItems;

  return (
    <DashboardLayout user={user} role={staffRole(user)} navItems={getNav(user)} wide>
      <div className="dash-hero dash-hero-admin">
        <div className="dash-hero-bg" aria-hidden="true" />
        <div className="dash-hero-inner">
          <div className="dash-hero-text">
            <p className="dash-greeting">Admin Panel</p>
            <h1>Content Manager</h1>
            <p className="dash-hero-note">Upload PDFs, video lectures, and previous year question papers for students.</p>
          </div>
          <div className="dash-stat-cards dash-stat-cards-hero">
            <div className="dash-stat-card dash-stat-card--pdf">
              <span className="dash-stat-icon">📄</span>
              <div><strong>{pdfs.length}</strong><span>PDFs</span></div>
            </div>
            <div className="dash-stat-card dash-stat-card--lecture">
              <span className="dash-stat-icon">🎬</span>
              <div><strong>{lectures.length}</strong><span>Lectures</span></div>
            </div>
            <div className="dash-stat-card dash-stat-card--gold">
              <span className="dash-stat-icon">📝</span>
              <div><strong>{pyqPapers.length}</strong><span>PYQ Papers</span></div>
            </div>
            <div className="dash-stat-card dash-stat-card--gold">
              <span className="dash-stat-icon">👑</span>
              <div><strong>{premiumItems.length}</strong><span>Premium</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-tabs" id="admin-content-tabs">
        <button type="button" className={`content-tab ${tab === "pdf" ? "active" : ""}`} onClick={() => selectTab("pdf")}>
          📄 PDFs & Notes
        </button>
        <button type="button" className={`content-tab ${tab === "lecture" ? "active" : ""}`} onClick={() => selectTab("lecture")}>
          🎬 Video Lectures
        </button>
        <button type="button" className={`content-tab ${tab === "pyq" ? "active" : ""}`} onClick={() => selectTab("pyq")}>
          📝 PYQ Papers
        </button>
        <button type="button" className={`content-tab ${tab === "premium" ? "active" : ""}`} onClick={() => selectTab("premium")}>
          👑 Premium (Paid)
        </button>
      </div>

      {tab === "pyq" ? (
        <PyqUploadForm onSuccess={handlePyqSuccess} />
      ) : tab === "premium" ? (
        <PremiumUploadForm onSuccess={handlePremiumSuccess} />
      ) : (
        <UploadForm key={tab} type={tab} onSuccess={handleUploadSuccess} />
      )}

      {fetchError && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: 20 }}>
          <span>⚠</span> {fetchError}
        </div>
      )}

      <div className="dash-toolbar">
        <h2>
          {tab === "pdf" ? "Uploaded PDFs" : tab === "lecture" ? "Uploaded Lectures" : tab === "pyq" ? "Uploaded PYQ Papers" : "Premium Content"}
        </h2>
        <span className="dash-count">
          {shown.length} items · Page {pagination.page}/{pagination.totalPages}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state dash-empty">
          <div className="empty-icon">{tab === "pdf" ? "📭" : tab === "lecture" ? "🎬" : tab === "pyq" ? "📝" : "👑"}</div>
          <h3>No {tab === "pdf" ? "PDFs" : tab === "lecture" ? "Lectures" : tab === "pyq" ? "PYQ Papers" : "Premium Items"} Yet</h3>
          <p>Upload using the form above.</p>
        </div>
      ) : tab === "premium" ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.title}</strong>
                      {p.description && <small>{p.description}</small>}
                    </td>
                    <td><span className="type-badge">{p.contentType}</span></td>
                    <td>{p.subject}</td>
                    <td>{p.className}</td>
                    <td>
                      {editingPrice === p._id ? (
                        <span className="premium-price-edit">
                          <input
                            type="number"
                            min="1"
                            defaultValue={p.price}
                            id={`price-${p._id}`}
                            style={{ width: 80 }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginLeft: 6, padding: "4px 10px" }}
                            onClick={() => {
                              const val = document.getElementById(`price-${p._id}`).value;
                              handleUpdatePrice(p._id, val);
                            }}
                          >
                            Save
                          </button>
                        </span>
                      ) : (
                        <>
                          ₹{p.price}{" "}
                          <button type="button" className="type-badge" onClick={() => setEditingPrice(p._id)}>
                            Edit
                          </button>
                        </>
                      )}
                    </td>
                    <td>
                      {p.fileUrl && (
                        <a href={mediaUrl(p.fileUrl)} target="_blank" rel="noreferrer" className="type-badge" style={{ marginRight: 8 }}>
                          View
                        </a>
                      )}
                      <button className="btn btn-danger" onClick={() => handleDeletePremium(p._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            onPageChange={setListPage}
          />
        </>
      ) : tab === "pyq" ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Year</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.title}</strong>
                      {p.description && <small>{p.description}</small>}
                    </td>
                    <td>{p.subject}</td>
                    <td>{p.className}</td>
                    <td>{p.examYear}</td>
                    <td>
                      <a href={mediaUrl(p.fileUrl)} target="_blank" rel="noreferrer" className="type-badge" style={{ marginRight: 8 }}>
                        View
                      </a>
                      <button className="btn btn-danger" onClick={() => handleDeletePyq(p._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            onPageChange={setListPage}
          />
        </>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <strong>{d.title}</strong>
                      {d.description && <small>{d.description}</small>}
                      {d.duration && <small>⏱ {d.duration}</small>}
                    </td>
                    <td>
                      <div className="doc-subject-row">
                        <SubjectIcon subject={d.subject} size="xs" />
                        <span className="doc-subject-badge">{d.subject}</span>
                      </div>
                    </td>
                    <td>{d.className}</td>
                    <td>
                      <span className="type-badge">
                        {d.materialType === "lecture"
                          ? d.youtubeId ? "YouTube" : "Video File"
                          : "PDF"}
                      </span>
                    </td>
                    <td>
                      <a href={mediaUrl(d.fileUrl)} target="_blank" rel="noreferrer" className="type-badge" style={{ marginRight: 8 }}>
                        View
                      </a>
                      <button className="btn btn-danger" onClick={() => handleDelete(d._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            onPageChange={setListPage}
          />
        </>
      )}
    </DashboardLayout>
  );
}
