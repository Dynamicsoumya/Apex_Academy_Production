const express = require("express");
const User = require("../models/User");
const { protect, superAdminOnly } = require("../middleware/authMiddleware");

const router = express.Router();
const ASSIGNABLE_ROLES = ["student", "admin"];

// @route GET /api/users/stats
router.get("/stats", protect, superAdminOnly, async (req, res) => {
  try {
    const [total, students, admins, superadmins, paidStudents] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "superadmin" }),
      User.countDocuments({ role: "student", isPaidStudent: true }),
    ]);

    res.json({ total, students, admins, superadmins, paidStudents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/users
router.get("/", protect, superAdminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      const term = String(req.query.search).trim();
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PATCH /api/users/:id/role
router.patch("/:id/role", protect, superAdminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role must be student or admin" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }
    if (target.role === "superadmin") {
      return res.status(403).json({ message: "Cannot modify another super admin" });
    }

    target.role = role;
    await target.save();

    const user = await User.findById(target._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/users/:id
router.delete("/:id", protect, superAdminOnly, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    if (target.role === "superadmin") {
      return res.status(403).json({ message: "Cannot delete another super admin" });
    }

    await target.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
