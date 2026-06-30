const express = require("express");
const jwt = require("jsonwebtoken");
const Review = require("../models/Review");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const VALID_CLASSES = ["9th", "10th", "11th", "12th"];

async function attachUserIfLoggedIn(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const token = auth.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch {
    req.user = null;
  }
  next();
}

// @route GET /api/reviews
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.className && VALID_CLASSES.includes(req.query.className)) {
      filter.className = req.query.className;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("name className rating opinion userId createdAt");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/reviews
router.post("/", attachUserIfLoggedIn, async (req, res) => {
  try {
    const { name, className, rating, opinion } = req.body;

    if (!name?.trim() || !className || !opinion?.trim()) {
      return res.status(400).json({ message: "Name, class, and opinion are required." });
    }

    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Please select a rating from 1 to 5 stars." });
    }

    if (!VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Class must be 9th, 10th, 11th, or 12th." });
    }

    const review = await Review.create({
      name: name.trim(),
      className,
      rating: stars,
      opinion: opinion.trim(),
      userId: req.user?._id,
    });

    res.status(201).json({
      _id: review._id,
      name: review.name,
      className: review.className,
      rating: review.rating,
      opinion: review.opinion,
      userId: review.userId,
      createdAt: review.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/reviews/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const isAdmin = req.user.role === "admin";
    const isOwner =
      review.userId && req.user._id.toString() === review.userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You can only delete your own review." });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy alias for older frontend calls
router.get("/junior", async (req, res) => {
  try {
    const filter = req.query.className
      ? { className: req.query.className }
      : { className: { $in: ["9th", "10th"] } };
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .select("name className rating opinion userId createdAt");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
