import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { StickyEnrollBar } from "./components/JoinCTA";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import AdminRegister from "./pages/AdminRegister";
import Questions from "./pages/Questions";
import Premium from "./pages/Premium";
import ExamPortal from "./pages/ExamPortal";
import AdminExams from "./pages/AdminExams";
import AdminTimetable from "./pages/AdminTimetable";
import StudentTimetable from "./pages/StudentTimetable";
import CareerRoadmaps from "./pages/CareerRoadmaps";
import AdmissionPortal from "./pages/AdmissionPortal";
import AdminAdmissions from "./pages/AdminAdmissions";
import { getStoredUser } from "./utils/auth";

function AppContent() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register", "/admin-setup", "/forgot-password"].includes(location.pathname);
  const isDashboardPage =
    location.pathname === "/student" ||
    location.pathname === "/timetable" ||
    location.pathname.startsWith("/admin");
  const user = getStoredUser();
  const showJoinCTA = !isAuthPage && !user && location.pathname !== "/admissions";

  return (
    <>
      {!isAuthPage && !isDashboardPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admissions" element={<AdmissionPortal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-setup" element={<AdminRegister />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/career-roadmaps" element={<CareerRoadmaps />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/exam-portal" element={<ExamPortal />} />
        <Route path="/exam-portal/:examId" element={<ExamPortal />} />
        <Route
          path="/admin/exams"
          element={<ProtectedRoute role="admin"><AdminExams /></ProtectedRoute>}
        />
        <Route
          path="/admin/timetable"
          element={<ProtectedRoute role="admin"><AdminTimetable /></ProtectedRoute>}
        />
        <Route
          path="/timetable"
          element={<ProtectedRoute role="student"><StudentTimetable /></ProtectedRoute>}
        />
        <Route
          path="/student"
          element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/admissions"
          element={<ProtectedRoute role="admin"><AdminAdmissions /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>}
        />
      </Routes>
      {showJoinCTA && <StickyEnrollBar />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
