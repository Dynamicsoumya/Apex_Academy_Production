import { isSuperAdmin } from "./roles";

/** Shared sidebar navigation for all admin dashboard pages */
const BASE_ADMIN_NAV = [
  { type: "group", label: "Admin Tools" },
  { to: "/admin", icon: "📤", label: "Upload Content" },
  { to: "/admin/admissions", icon: "📝", label: "Admissions" },
  { to: "/admin/timetable", icon: "📅", label: "Timetable" },
  { to: "/admin#premium", icon: "👑", label: "Premium Section" },
  { to: "/admin/exams", icon: "📋", label: "Exam Portal" },
  { type: "group", label: "Site" },
  { to: "/questions", icon: "📄", label: "PYQ Papers" },
  { to: "/courses", icon: "🎓", label: "Manage Courses" },
  { to: "/", icon: "🏠", label: "Back to Home" },
];

const SUPERADMIN_NAV = [
  { type: "group", label: "Super Admin" },
  { to: "/admin/users", icon: "👥", label: "User Management" },
];

export const ADMIN_NAV = BASE_ADMIN_NAV;

export function getAdminNav(user) {
  if (!isSuperAdmin(user)) return BASE_ADMIN_NAV;
  const siteGroupIndex = BASE_ADMIN_NAV.findIndex((item) => item.type === "group" && item.label === "Site");
  return [
    ...BASE_ADMIN_NAV.slice(0, siteGroupIndex),
    ...SUPERADMIN_NAV,
    ...BASE_ADMIN_NAV.slice(siteGroupIndex),
  ];
}
