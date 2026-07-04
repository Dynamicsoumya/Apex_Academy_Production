export function isStaff(user) {
  return user?.role === "admin" || user?.role === "superadmin";
}

export function isSuperAdmin(user) {
  return user?.role === "superadmin";
}

export function staffRoleLabel(role) {
  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Administrator";
  return "Student";
}

export function roleAllowed(userRole, requiredRole) {
  if (!requiredRole) return true;
  if (requiredRole === "admin") return userRole === "admin" || userRole === "superadmin";
  return userRole === requiredRole;
}
