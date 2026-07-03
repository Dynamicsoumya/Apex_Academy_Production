const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

function authPayload(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    className: user.className,
    stream: user.stream,
    isPaidStudent: user.isPaidStudent,
    purchasedPremium: user.purchasedPremium || [],
    token: genToken(user._id),
  };
}

// @route POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, className, stream, phone, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    let userRole = "student";
    const adminSecret = process.env.ADMIN_SECRET || process.env.JWT_SECRET;
    if (role === "admin" && req.body.adminSecret === adminSecret) {
      userRole = "admin";
    } else if (role === "admin") {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    const user = await User.create({
      name,
      email,
      password,
      className,
      stream,
      phone,
      role: userRole,
    });

    res.status(201).json(authPayload(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json(authPayload(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// @route POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please enter your email address" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password updated successfully! Redirecting to login..." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;
