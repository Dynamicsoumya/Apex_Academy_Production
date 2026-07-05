import axios from "axios";
import { clearAuth } from "../utils/auth";

function getApiBaseUrl() {
  if (process.env.REACT_APP_API_URL||process.env.REACT_APP_API_URL_NEW) {
    let url = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || process.env.REACT_APP_API_URL_NEW?.replace(/\/$/, "");
    if (!url.endsWith("/api")) url = `${url}/api`;
    return url;
  }
  // Always call backend directly (CORS is configured on the server)
  return "http://localhost:8080/api";
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || "";
    const isAuthFailure =
      status === 401 ||
      (status === 403 &&
        (message.toLowerCase().includes("admin access") ||
          message.toLowerCase().includes("super admin access")));

    if (isAuthFailure && localStorage.getItem("token")) {
      clearAuth();
      const onAuthPage =
        ["/login", "/register", "/admin-setup", "/admin/login", "/superadmin/login", "/superadmin/setup", "/forgot-password"].includes(window.location.pathname);
      if (!onAuthPage) {
        sessionStorage.setItem("authRedirect", "session_expired");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default API;
