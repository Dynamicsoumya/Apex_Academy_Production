function getApiBase() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "");
  }
  return "http://localhost:8080";
}

export const API_BASE = getApiBase();

export function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("//")) return `https:${path}`;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
