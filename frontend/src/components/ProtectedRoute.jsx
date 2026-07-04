import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import API from "../api/api";
import { clearAuth, getStoredUser } from "../utils/auth";
import { roleAllowed } from "../utils/roles";

export default function ProtectedRoute({ children, role }) {
  const user = getStoredUser();
  const location = useLocation();
  const [verified, setVerified] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (role && !roleAllowed(user.role, role)) return;

    API.get("/auth/me")
      .then(() => setVerified(true))
      .catch(() => {
        clearAuth();
        sessionStorage.setItem("authRedirect", "session_expired");
        setInvalid(true);
      });
  }, [user, role]);

  if (!user || invalid) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (role && !roleAllowed(user.role, role)) return <Navigate to="/" replace />;
  if (!verified) {
    return (
      <div className="auth-loading" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="auth-spinner" /> Verifying session...
      </div>
    );
  }
  return children;
}
