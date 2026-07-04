const jwt = require("jsonwebtoken");
const User = require("../models/User");

const isStaff = (user) => user && (user.role === "admin" || user.role === "superadmin");
const isSuperAdmin = (user) => user && user.role === "superadmin";

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });
};

const adminOnly = (req, res, next) => {
  if (isStaff(req.user)) return next();
  return res.status(403).json({ message: "Admin access only" });
};

const superAdminOnly = (req, res, next) => {
  if (isSuperAdmin(req.user)) return next();
  return res.status(403).json({ message: "Super admin access only" });
};

const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === "student") return next();
  return res.status(403).json({ message: "Student login required to apply for admission" });
};

const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      req.user = null;
    }
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
  superAdminOnly,
  studentOnly,
  optionalProtect,
  isStaff,
  isSuperAdmin,
};
