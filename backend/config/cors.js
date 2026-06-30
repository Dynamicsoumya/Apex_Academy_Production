const defaultOrigins = [
  "http://localhost:3000",
];

function getAllowedOrigins() {
  const fromEnv = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return [...new Set([...defaultOrigins, ...fromEnv])];
}

const allowedOrigins = getAllowedOrigins();

const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

const corsOptions = {
  origin(origin, callback) {
    // Postman, curl, server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow any local dev origin (different ports / hosts)
    if (process.env.NODE_ENV !== "production" && isLocalOrigin(origin)) {
      return callback(null, true);
    }

    // Emergency override
    if (process.env.CORS_ALLOW_ALL === "true") return callback(null, true);

    console.warn(`CORS blocked origin: ${origin}`);
    callback(null, false);
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

module.exports = corsOptions;
