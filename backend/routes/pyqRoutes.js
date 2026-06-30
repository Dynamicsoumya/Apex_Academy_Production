const express = require("express");
const PyqPaper = require("../models/PyqPaper");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadFile, deleteStoredFile, folderForFile } = require("../utils/s3Storage");

const router = express.Router();

// @route GET /api/pyq — public list for students
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.className) filter.className = req.query.className;
    if (req.query.examYear) filter.examYear = req.query.examYear;
    if (req.query.subject) filter.subject = new RegExp(req.query.subject, "i");

    const papers = await PyqPaper.find(filter).sort({ examYear: -1, createdAt: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/pyq — admin upload previous year question paper
router.post("/", protect, adminOnly, upload.single("file"), async (req, res) => {
  try {
    const { title, description, subject, className, examYear } = req.body;

    if (!title?.trim() || !subject?.trim() || !className || !examYear?.trim()) {
      return res.status(400).json({
        message: "Title, subject, class, and exam year are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Question paper PDF/file is required." });
    }

    const folder = folderForFile("pyq", req.file.mimetype, req.file.originalname);
    const fileUrl = await uploadFile(req.file, folder);

    if (!fileUrl.includes("res.cloudinary.com")) {
      return res.status(500).json({ message: "Question paper must be stored on Cloudinary." });
    }

    const paper = await PyqPaper.create({
      title: title.trim(),
      description: description?.trim(),
      subject: subject.trim(),
      className,
      examYear: examYear.trim(),
      fileUrl,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
    });

    res.status(201).json(paper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/pyq/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const paper = await PyqPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Not found" });

    if (paper.fileUrl) {
      await deleteStoredFile(paper.fileUrl);
    }

    await PyqPaper.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
