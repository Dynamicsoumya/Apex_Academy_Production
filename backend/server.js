require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const corsOptions = require("./config/cors");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const pyqRoutes = require("./routes/pyqRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const examRoutes = require("./routes/examRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

connectDB();

// CORS must be first — handles all preflight OPTIONS requests
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid request body" });
  }
  next(err);
});

app.use("/uploads", (req, res, next) => {
  if (/^\/(videos|images)(\/|$)/i.test(req.path)) {
    return res.status(410).json({
      message: "Images and videos are stored on Cloudinary. Please re-upload from admin dashboard.",
    });
  }
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // legacy PDF/PYQ only

app.get("/", (req, res) => res.send("Apex Academy API is running 🚀"));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/pyq", pyqRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/users", userRoutes);

// API 404 handler
app.use("/api", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Serve React frontend in production (fixes page refresh 404)
const frontendBuild = path.join(__dirname, "../frontend/build");
if (require("fs").existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuild, "index.html"));
  });
}

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 8080;
const { isS3Enabled, isCloudinaryEnabled } = require("./utils/s3Storage");
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Storage: ${isCloudinaryEnabled() ? "Cloudinary (images, videos, PDFs & PYQ)" : "NOT configured — set CLOUDINARY_URL"}`);
  if (isS3Enabled()) {
    console.log(`AWS S3: configured (legacy fallback only when Cloudinary is off)`);
  }
});
