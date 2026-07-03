import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import { getStoredUser } from "../utils/auth";
import { ADMISSION_COURSES, APPLICATION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../utils/admissionCourses";
import AdmissionPaymentPanel from "../components/AdmissionPaymentPanel";

const STEPS = ["Student", "Parents", "Course", "Photos", "Confirm"];

const OFFLINE_STEPS = [
  { icon: "📝", title: "Submit application", text: "You receive a unique Application ID instantly." },
  { icon: "📱", title: "Scan & pay via UPI", text: "Use PhonePe or Google Pay QR — pay the admission fee." },
  { icon: "🧾", title: "Upload screenshot", text: "Upload the payment success screenshot for verification." },
  { icon: "✅", title: "Admin verifies", text: "Our team confirms payment and your admission." },
];

const EMPTY = {
  studentName: "",
  address: "",
  fatherName: "",
  motherName: "",
  parentPhone: "",
  className: "11th",
  stream: "Science",
  courseId: "senior-science-11th",
  studentPhone: "",
  studentEmail: "",
};

function PhotoPreview({ file, label }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) {
    return (
      <div className="adm-photo-placeholder">
        <span>📷</span>
        <p>{label}</p>
      </div>
    );
  }

  return <img src={url} alt={label} className="adm-photo-preview" />;
}

function OfflineInstructions({ fee, compact = false }) {
  return (
    <div className={`adm-offline-panel ${compact ? "adm-offline-panel--compact" : ""}`}>
      <div className="adm-offline-panel-head">
        <span className="adm-offline-panel-icon" aria-hidden="true">🏫</span>
        <div>
          <p className="adm-offline-panel-eyebrow">Offline admission fee</p>
          <h3>Pay at Apex Academy Center</h3>
          <p className="adm-offline-panel-sub">
            Pay ₹{fee} via PhonePe / Google Pay QR, upload payment screenshot, or visit our Dhenkanal center.
          </p>
        </div>
      </div>

      <ol className="adm-offline-timeline">
        {OFFLINE_STEPS.map((item, i) => (
          <li key={item.title}>
            <span className="adm-offline-timeline-num">{i + 1}</span>
            <span className="adm-offline-timeline-icon" aria-hidden="true">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="adm-offline-info-grid">
        <div className="adm-offline-info-card">
          <span>📍</span>
          <div>
            <strong>Visit us</strong>
            <p>Apex Academy, Dhenkanal, Odisha</p>
            <a
              href="https://maps.google.com/?q=Apex+Academy+Dhenkanal+Odisha"
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
        <div className="adm-offline-info-card">
          <span>🕐</span>
          <div>
            <strong>Office hours</strong>
            <p>Mon – Sat · 8:00 AM – 6:00 PM</p>
            <p className="adm-offline-muted">Sunday closed</p>
          </div>
        </div>
      </div>

      <div className="adm-offline-bring">
        <p>What to bring</p>
        <div className="adm-offline-tags">
          <span>Application ID</span>
          <span>Student Aadhaar / ID</span>
          <span>Passport photo</span>
          <span>Parent / guardian</span>
        </div>
      </div>

      <a
        href="https://wa.me/919692251559?text=Hi%20Apex%20Academy%2C%20I%20submitted%20my%20admission%20application."
        target="_blank"
        rel="noreferrer"
        className="adm-offline-wa-btn"
      >
        💬 WhatsApp us before visiting
      </a>
    </div>
  );
}

export default function AdmissionPortal() {
  const user = getStoredUser();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    ...EMPTY,
    studentName: user?.name || "",
    studentEmail: user?.email || "",
    studentPhone: user?.phone || "",
    className: user?.className || "11th",
    stream: user?.stream || "Science",
  });
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [parentPhoto, setParentPhoto] = useState(null);
  const [feeInfo, setFeeInfo] = useState({ admissionFee: 500 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [trackId, setTrackId] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [myApp, setMyApp] = useState(null);

  useEffect(() => {
    API.get("/admissions/fee")
      .then((res) => setFeeInfo(res.data))
      .catch(() => {});
    API.get("/admissions/my")
      .then((res) => {
        const list = res.data || [];
        setMyApp(list.find((a) => a.status !== "rejected") || list[0] || null);
      })
      .catch(() => setMyApp(null));
  }, []);

  const refreshMyApp = () => {
    API.get("/admissions/my")
      .then((res) => {
        const list = res.data || [];
        const app = list.find((a) => a.status !== "rejected") || list[0] || null;
        setMyApp(app);
        if (result && app) setResult(app);
      })
      .catch(() => {});
  };

  const selectedCourse = ADMISSION_COURSES.find((c) => c.id === form.courseId) || ADMISSION_COURSES[0];

  const setCourseId = (courseId) => {
    const course = ADMISSION_COURSES.find((c) => c.id === courseId);
    if (!course) return;
    setForm((prev) => ({
      ...prev,
      courseId,
      className: course.className,
      stream: course.stream,
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.studentName.trim() || !form.address.trim() || !form.studentPhone.trim()) {
        return "Fill student name, address, and phone.";
      }
    }
    if (step === 1) {
      if (!form.fatherName.trim() && !form.motherName.trim()) {
        return "Enter at least one parent name.";
      }
      if (!form.parentPhone.trim()) return "Enter parent contact number.";
    }
    if (step === 2 && !form.courseId) return "Select a course.";
    if (step === 3 && !studentPhoto) return "Student photo is required.";
    return "";
  };

  const handleNext = () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      Object.entries({
        studentName: form.studentName,
        address: form.address,
        fatherName: form.fatherName,
        motherName: form.motherName,
        parentPhone: form.parentPhone,
        className: selectedCourse.className,
        stream: selectedCourse.stream,
        course: selectedCourse.program,
        studentPhone: form.studentPhone,
        studentEmail: form.studentEmail,
        paymentMode: "offline",
      }).forEach(([k, v]) => fd.append(k, v));

      fd.append("studentPhoto", studentPhoto);
      if (parentPhoto) fd.append("parentPhoto", parentPhoto);

      const { data: admission } = await API.post("/admissions", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(admission);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackError("");
    setTrackResult(null);
    try {
      const { data } = await API.get("/admissions/track", {
        params: { applicationId: trackId.trim(), phone: trackPhone.trim() },
      });
      setTrackResult(data);
    } catch (err) {
      setTrackError(err.response?.data?.message || "Application not found");
    }
  };

  if (result) {
    const isComplete = result.status === "approved" && ["offline_verified", "paid"].includes(result.paymentStatus);

    return (
      <div className="adm-page">
        <section className="adm-success-card adm-success-card--wide">
          {isComplete ? (
            <>
              <div className="adm-success-icon">🎓</div>
              <h1>Admission Complete!</h1>
              <p className="adm-app-id adm-app-id--big">
                Your Admission ID: <strong>{result.applicationId}</strong>
              </p>
              <p className="adm-success-hint">Payment verified by admin. Save this ID for office visits and records.</p>
            </>
          ) : (
            <>
              <div className="adm-success-icon">🎉</div>
              <h1>Application Submitted!</h1>
              <p className="adm-app-id">
                Application ID: <strong>{result.applicationId}</strong>
              </p>
              <p className="adm-success-hint">Step 1: Pay via UPI below · Step 2: Upload screenshot · Step 3: Admin verifies → admission complete</p>
              <div className="adm-success-meta">
                <span>Payment: {PAYMENT_STATUS_LABELS[result.paymentStatus] || result.paymentStatus}</span>
                <span>Status: {APPLICATION_STATUS_LABELS[result.status] || result.status}</span>
              </div>
            </>
          )}

          {!isComplete && (
            <AdmissionPaymentPanel
              admission={result}
              fee={feeInfo.admissionFee}
              verifyPhone={form.studentPhone}
              compact
              onUploaded={(updated) => setResult(updated)}
            />
          )}

          {result.paymentStatus === "proof_submitted" && !isComplete && (
            <button type="button" className="btn btn-outline adm-refresh-status" onClick={refreshMyApp}>
              ↻ Check if admin verified
            </button>
          )}

          <div className="adm-success-actions">
            {user?.role === "student" && <Link to="/student" className="btn btn-primary">Go to Dashboard</Link>}
            {user?.role === "admin" && <Link to="/admin/admissions" className="btn btn-primary">View in Admin</Link>}
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {myApp && (
        <section className="adm-pay-section-top">
          <h2>Admission payment</h2>
          <p className="adm-pay-section-sub">Application <strong>{myApp.applicationId}</strong> — pay via admin UPI QR, upload screenshot, submit for verification.</p>
          <AdmissionPaymentPanel
            admission={myApp}
            fee={feeInfo.admissionFee}
            onUploaded={(updated) => setMyApp(updated)}
          />
        </section>
      )}

      <section className="adm-hero">
        <div className="adm-hero-inner">
          <p className="adm-hero-eyebrow">✨ ADMISSIONS 2025–26</p>
          <h1>Join Apex Academy</h1>
          <p>Secure your seat for Class 9th–12th. Expert faculty, video lectures, and board + entrance coaching.</p>
          <div className="adm-hero-badges">
            <span>🏆 500+ Students</span>
            <span>📚 Study Portal</span>
            <span>📱 UPI · Pay at Center</span>
          </div>
        </div>
      </section>

      <section className="adm-form-section">
        {myApp ? (
          <div className="adm-form-card adm-already-applied">
            <h2>Application already submitted</h2>
            <p>Your ID is <strong>{myApp.applicationId}</strong>. Use the payment section above to pay via UPI and upload screenshot.</p>
          </div>
        ) : (
        <div className="adm-form-card">
          <div className="adm-steps">
            {STEPS.map((label, i) => (
              <div key={label} className={`adm-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                <span className="adm-step-num">{i < step ? "✓" : i + 1}</span>
                <span className="adm-step-label">{label}</span>
              </div>
            ))}
          </div>

          {error && <div className="adm-alert">{error}</div>}

          {step === 0 && (
            <div className="adm-fields">
              <h2>Student details</h2>
              <label>Full name *<input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} placeholder="Student full name" /></label>
              <label>Full address *<textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Village, city, district, PIN" /></label>
              <label>Student mobile *<input type="tel" value={form.studentPhone} onChange={(e) => setForm({ ...form, studentPhone: e.target.value })} placeholder="10-digit mobile" /></label>
              <label>Email (optional)<input type="email" value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} placeholder="student@email.com" /></label>
            </div>
          )}

          {step === 1 && (
            <div className="adm-fields">
              <h2>Parent / guardian</h2>
              <label>Father&apos;s name<input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} placeholder="Father's name" /></label>
              <label>Mother&apos;s name<input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} placeholder="Mother's name" /></label>
              <label>Parent contact number *<input type="tel" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="Parent WhatsApp / mobile" /></label>
            </div>
          )}

          {step === 2 && (
            <div className="adm-fields">
              <h2>Choose your course</h2>
              <div className="adm-course-grid">
                {ADMISSION_COURSES.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    className={`adm-course-card ${form.courseId === course.id ? "selected" : ""}`}
                    onClick={() => setCourseId(course.id)}
                  >
                    <span className="adm-course-icon">{course.icon}</span>
                    <strong>{course.label}</strong>
                    <small>{course.timing}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="adm-fields">
              <h2>Upload photos</h2>
              <div className="adm-photo-grid">
                <div className="adm-photo-upload">
                  <PhotoPreview file={studentPhoto} label="Student photo *" />
                  <label className="btn btn-outline adm-upload-btn">
                    Upload student photo
                    <input type="file" accept="image/*" hidden onChange={(e) => setStudentPhoto(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="adm-photo-upload">
                  <PhotoPreview file={parentPhoto} label="Parent photo (optional)" />
                  <label className="btn btn-outline adm-upload-btn">
                    Upload parent photo
                    <input type="file" accept="image/*" hidden onChange={(e) => setParentPhoto(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="adm-fields">
              <h2>Review & confirm</h2>

              <div className="adm-review-summary">
                <div className="adm-review-row">
                  <span>Student</span>
                  <strong>{form.studentName}</strong>
                </div>
                <div className="adm-review-row">
                  <span>Course</span>
                  <strong>{selectedCourse.label}</strong>
                </div>
                <div className="adm-review-row">
                  <span>Contact</span>
                  <strong>{form.studentPhone}</strong>
                </div>
                <div className="adm-review-fee">
                  <div>
                    <span>Admission fee</span>
                    <strong>₹{feeInfo.admissionFee}</strong>
                  </div>
                  <span className="adm-review-fee-badge">Pay via UPI QR</span>
                </div>
              </div>

              <OfflineInstructions fee={feeInfo.admissionFee} />
            </div>
          )}

          <div className="adm-form-actions">
            {step > 0 && (
              <button type="button" className="btn btn-outline" onClick={() => setStep((s) => s - 1)} disabled={loading}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleNext}>Continue</button>
            ) : (
              <button type="button" className="btn btn-primary join-glow-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting…" : "Submit Application"}
              </button>
            )}
          </div>
        </div>
        )}
      </section>

      <section className="adm-track-section">
        <div className="adm-track-card">
          <h2>Track your application</h2>
          <form className="adm-track-form" onSubmit={handleTrack}>
            <input value={trackId} onChange={(e) => setTrackId(e.target.value)} placeholder="Application ID (e.g. APEX-2025-0001)" />
            <input value={trackPhone} onChange={(e) => setTrackPhone(e.target.value)} placeholder="Student mobile number" />
            <button type="submit" className="btn btn-primary">Track</button>
          </form>
          {trackError && <p className="adm-alert">{trackError}</p>}
          {trackResult && (
            <div className="adm-track-result">
              <p><strong>{trackResult.studentName}</strong> — {trackResult.course}, Class {trackResult.className}</p>
              <p>Payment: {PAYMENT_STATUS_LABELS[trackResult.paymentStatus]}</p>
              <p>Status: {APPLICATION_STATUS_LABELS[trackResult.status]}</p>
              <AdmissionPaymentPanel
                admission={trackResult}
                fee={feeInfo.admissionFee}
                verifyPhone={trackPhone}
                compact
                onUploaded={(updated) => setTrackResult(updated)}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
