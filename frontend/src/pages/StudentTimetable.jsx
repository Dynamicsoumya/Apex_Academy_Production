import React, { useEffect, useState } from "react";
import API from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import { TimetableWeekGrid, HolidayCalendar } from "../components/TimetableWidgets";
import { getStoredUser } from "../utils/auth";

const NAV = [
  { type: "group", label: "My Learning" },
  { to: "/student", icon: "📚", label: "Overview" },
  { to: "/timetable", icon: "📅", label: "Timetable" },
  { to: "/student#dash-pdfs", icon: "📄", label: "PDF Notes" },
  { to: "/student#dash-lectures", icon: "🎬", label: "Video Lectures" },
  { to: "/exam-portal", icon: "📋", label: "Exam Portal" },
  { to: "/student#dash-reviews", icon: "⭐", label: "Reviews" },
  { type: "group", label: "Explore" },
  { to: "/career-roadmaps", icon: "🗺️", label: "Career Roadmaps" },
  { to: "/questions", icon: "📝", label: "PYQ Papers" },
  { to: "/courses", icon: "🎓", label: "Courses" },
  { to: "/", icon: "🏠", label: "Back to Home" },
];

export default function StudentTimetable() {
  const user = getStoredUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/timetable/my")
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout user={user} role="student" navItems={NAV}>
      <div className="tt-student-page">
        <header className="tt-page-header">
          <div>
            <p className="section-eyebrow">MY SCHEDULE</p>
            <h1>Batch Timetable</h1>
            <p className="tt-page-sub">Your weekly class schedule and upcoming holidays at Apex Academy.</p>
          </div>
        </header>

        {loading ? (
          <div className="courses-loading">
            <span className="auth-spinner" />
            <p>Loading timetable...</p>
          </div>
        ) : !data?.batch ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>Timetable Not Available</h3>
            <p>Your batch could not be determined. Please contact admin.</p>
          </div>
        ) : (
          <>
            <div className={`tt-student-batch-card tt-theme-${data.batch.theme}`}>
              <span className="tt-student-batch-icon">{data.batch.icon}</span>
              <div>
                <h2>{data.batch.label}</h2>
                <p>Class {user?.className} · {user?.stream === "School" ? "School Board" : user?.stream} · {data.batch.timing}</p>
              </div>
            </div>

            <section className="tt-student-section">
              <h2>Weekly Timetable</h2>
              <TimetableWeekGrid week={data.week} batch={data.batch} showHeader={false} />
            </section>

            <section className="tt-student-section">
              <h2>Upcoming Holidays</h2>
              <HolidayCalendar holidays={data.holidays} />
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
