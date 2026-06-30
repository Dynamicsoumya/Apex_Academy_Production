const express = require("express");
const Document = require("../models/Document");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadFile, deleteStoredFile, folderForFile } = require("../utils/s3Storage");

const router = express.Router();

function extractYoutubeId(url) {
  if (!url) return null;
  const str = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const match = str.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// @route POST /api/documents
router.post("/", protect, adminOnly, upload.single("file"), async (req, res) => {
  try {
    const materialType = req.body.materialType || "pdf";
    const { title, description, subject, className, duration, youtubeUrl } = req.body;

    if (!title || !subject || !className) {
      return res.status(400).json({ message: "Title, subject and class are required" });
    }

    const youtubeId = materialType === "lecture" ? extractYoutubeId(youtubeUrl) : null;

    if (materialType === "lecture" && !req.file && !youtubeId) {
      return res.status(400).json({ message: "Upload a video file or provide a YouTube link" });
    }

    if (materialType === "pdf" && !req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    let fileUrl = null;
    let fileType = null;

    if (req.file) {
      const folder = folderForFile(materialType, req.file.mimetype, req.file.originalname);
      fileUrl = await uploadFile(req.file, folder);
      fileType = req.file.mimetype;

      if (!fileUrl.includes("res.cloudinary.com")) {
        throw new Error("All uploads must be stored on Cloudinary.");
      }
    }

    const doc = await Document.create({
      title,
      description,
      subject,
      className,
      materialType,
      fileUrl,
      fileType,
      youtubeId: youtubeId || undefined,
      duration: duration || undefined,
      uploadedBy: req.user._id,
    });

    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route GET /api/documents
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.className) filter.className = req.query.className;
    if (req.query.materialType === "pdf") {
      filter.$or = [{ materialType: "pdf" }, { materialType: { $exists: false } }, { materialType: null }];
    } else if (req.query.materialType === "lecture") {
      filter.materialType = "lecture";
    }
    if (req.query.subject) filter.subject = new RegExp(req.query.subject, "i");

    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/documents/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    if (doc.fileUrl) {
      await deleteStoredFile(doc.fileUrl);
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
