import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../api/api";
import { getSubjectInfo } from "../components/SubjectIcon";
import { CoursesEnrollBanner } from "../components/JoinCTA";
import {
  ACADEMY_CLASSES,
  BATCH_PROGRAMS,
  JUNIOR_BATCH_TIMING,
  SENIOR_ARTS_TIMING,
  SENIOR_SCIENCE_TIMING,
  isJuniorClass,
  isSeniorClass,
  mergeProgramCourses,
  streamOptionsForClass,
} from "../utils/academyClasses";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const STREAM_COLORS = {
  School: "#059669",
  Science: "#1e40af",
  Commerce: "#7c3aed",
  Arts: "#b45309",
};

function getCourseIcon(course) {
  const title = (course.title + " " + (course.description || "") + " " + (course.subject || "")).toLowerCase();
  if (title.includes("math")) return "/icons/math.svg";
  if (title.includes("chem")) return "/icons/chemistry.svg";
  if (title.includes("bio")) return "/icons/biology.svg";
  if (title.includes("hist")) return "/icons/chemistry.svg";
  if (title.includes("polit") || title.includes("civic")) return "/icons/chemistry.svg";
  if (title.includes("econ")) return "/icons/chemistry.svg";
  if (title.includes("phys") || title.includes("science")) return "/icons/science.svg";
  return getSubjectInfo(course.subject || course.stream).icon;
}

function getProgramBanner(streamFilter) {
  if (streamFilter === "School") {
    return {
      eyebrow: "CLASS 9TH & 10TH · EVENING BATCH",
      title: `School Board — ${JUNIOR_BATCH_TIMING}`,
      desc: "Mathematics, General Science, Social Science, MIL & English.",
      anchor: "#batches",
      anchorLabel: "View Batches",
      className: "courses-school-banner",
    };
  }
  if (streamFilter === "Arts") {
    return {
      eyebrow: "+2 · CLASS 11TH & 12TH · ARTS",
      title: `Afternoon Arts Batch — ${SENIOR_ARTS_TIMING}`,
      desc: "Political Science, Economics, History, MIL & English.",
      anchor: "#batches",
      anchorLabel: "View Batches",
      className: "courses-arts-banner",
    };
  }
  if (streamFilter === "Science") {
    return {
      eyebrow: "+2 · CLASS 11TH & 12TH · SCIENCE",
      title: `Morning Science Batch — ${SENIOR_SCIENCE_TIMING}`,
      desc: "Physics, Chemistry, Biology, Mathematics, English & MIL.",
      anchor: "#batches",
      anchorLabel: "View Batches",
      className: "courses-science-banner",
    };
  }
  return null;
}

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  const classFilter = searchParams.get("className") || "all";
  const streamFilter = searchParams.get("stream") || "all";
  const streamOptions = streamOptionsForClass(classFilter);

  useEffect(() => {
    API.get("/courses")
      .then((res) => setCourses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayedCourses = useMemo(() => {
    if (streamFilter !== "all") {
      const merged = mergeProgramCourses(courses, classFilter, streamFilter);
      if (merged.length) return merged;
    }

    let list = courses;
    if (classFilter !== "all") list = list.filter((c) => c.className === classFilter);
    if (streamFilter !== "all") {
      list = list.filter(
        (c) => c.stream === streamFilter || (streamFilter === "School" && c.stream === "Science" && isJuniorClass(c.className))
      );
    }
    return list;
  }, [courses, classFilter, streamFilter]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete(key);
    else next.set(key, value);

    if (key === "className") {
      const options = streamOptionsForClass(value);
      const currentStream = next.get("stream") || "all";
      if (currentStream !== "all" && !options.includes(currentStream)) {
        next.delete("stream");
      }
    }

    setSearchParams(next, { replace: true });
  };

  const setFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all") next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const handlePay = async (course) => {
    if (course.isStatic) {
      if (!user) return alert("Please login or register first to enroll.");
      window.location.href = "/register";
      return;
    }
    if (!user) return alert("Please login first to enroll.");
    const ok = await loadRazorpayScript();
    if (!ok) return alert("Razorpay SDK failed to load. Check your connection.");

    try {
      const { data } = await API.post("/payments/create-order", { courseId: course._id });
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Apex Academy",
        description: data.courseName,
        order_id: data.orderId,
        handler: async function (response) {
          await API.post("/payments/verify", { ...response, courseId: course._id });
          alert("Payment successful! You are now enrolled in " + course.title);
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#0b1f3a" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || "Payment initiation failed");
    }
  };

  const programBanner = getProgramBanner(streamFilter);

  return (
    <div className="courses-page">
      <div className="page-banner">
        <div className="page-banner-inner">
          <p className="section-eyebrow">ENROLLMENT</p>
          <h1>Our Courses</h1>
          <p>
            9th & 10th evening batch · +2 Science morning · +2 Arts afternoon — pick your class and stream.
          </p>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-lg join-glow-btn" style={{ marginTop: 20 }}>
              Join Apex Academy First →
            </Link>
          )}
        </div>
      </div>

      <CoursesEnrollBanner />

      <div className="section">
        <div className="courses-program-chips">
          {BATCH_PROGRAMS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`courses-program-chip courses-program-chip-${p.theme} ${
                streamFilter === p.stream ? "active" : ""
              }`}
              onClick={() => setFilters({ stream: p.stream, className: p.classes[0] })}
            >
              <span>{p.icon}</span>
              <strong>{p.title}</strong>
              <small>{p.timing}</small>
            </button>
          ))}
        </div>

        <div className="courses-filters">
          <div className="courses-filter">
            <label htmlFor="course-class">Class</label>
            <select id="course-class" value={classFilter} onChange={(e) => setFilter("className", e.target.value)}>
              <option value="all">All Classes</option>
              {ACADEMY_CLASSES.map((c) => (
                <option key={c} value={c}>{c} Standard</option>
              ))}
            </select>
          </div>
          <div className="courses-filter">
            <label htmlFor="course-stream">Stream</label>
            <select id="course-stream" value={streamFilter} onChange={(e) => setFilter("stream", e.target.value)}>
              {streamOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Streams" : s === "School" ? "School Board" : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {programBanner && (
          <div className={`courses-program-banner ${programBanner.className}`}>
            <div>
              <p className="section-eyebrow">{programBanner.eyebrow}</p>
              <h2>{programBanner.title}</h2>
              <p>{programBanner.desc}</p>
            </div>
            <Link to={`/${programBanner.anchor}`} className="btn btn-outline">{programBanner.anchorLabel}</Link>
          </div>
        )}

        {loading ? (
          <div className="courses-loading">
            <span className="auth-spinner" />
            <p>Loading courses...</p>
          </div>
        ) : displayedCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>No Courses Found</h3>
            <p>Try a program chip above or change filters.</p>
            <button type="button" className="btn btn-primary" onClick={() => setFilters({ stream: "School", className: "9th" })}>
              View 9th / 10th Evening Batch
            </button>
          </div>
        ) : (
          <div className="course-grid">
            {displayedCourses.map((c) => (
              <div className="course-card" key={c._id}>
                <div className="course-card-header" style={{ "--stream-color": STREAM_COLORS[c.stream] || "#1e40af" }}>
                  <div className="course-header-left">
                    <img src={getCourseIcon(c)} alt="" className="course-subject-icon" />
                    <span className="course-badge">{c.stream === "School" ? "School Board" : c.stream}</span>
                  </div>
                  <span className="course-class">{c.className} Standard</span>
                </div>
                <div className="course-card-body">
                  <h3>{c.title}</h3>
                  <p className="course-desc">{c.description}</p>
                  <div className="course-meta"><span>⏱ {c.duration}</span></div>
                  <div className="course-footer">
                    <div className="course-price">
                      <span className="price-label">Fee</span>
                      {c.isStatic || c.price == null ? (
                        <strong>Contact us</strong>
                      ) : (
                        <strong>₹{c.price?.toLocaleString("en-IN")}</strong>
                      )}
                    </div>
                    <button className="btn btn-primary btn-enroll" type="button" onClick={() => handlePay(c)}>
                      {c.isStatic ? "Enroll →" : "Enroll & Pay"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!user && (
          <div className="courses-login-hint">
            <p>Already a student? <Link to="/login">Sign in</Link> to enroll faster.</p>
          </div>
        )}
      </div>
    </div>
  );
}
