/** Shared sidebar navigation for all admin dashboard pages */
export const ADMIN_NAV = [
  { type: "group", label: "Admin Tools" },
  { to: "/admin", icon: "📤", label: "Upload Content" },
  { to: "/admin/admissions", icon: "📝", label: "Admissions" },
  { to: "/admin/timetable", icon: "📅", label: "Timetable" },
  { to: "/admin#premium", icon: "👑", label: "Premium Section" },
  { to: "/admin/exams", icon: "📋", label: "Exam Portal" },
  { type: "group", label: "Site" },
  { to: "/admissions", icon: "✨", label: "Admission Portal" },
  { to: "/questions", icon: "📄", label: "PYQ Papers" },
  { to: "/courses", icon: "🎓", label: "Manage Courses" },
  { to: "/", icon: "🏠", label: "Back to Home" },
];
