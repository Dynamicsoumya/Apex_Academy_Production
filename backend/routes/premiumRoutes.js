const express = require("express");
const PremiumItem = require("../models/PremiumItem");
const User = require("../models/User");
const { protect, adminOnly, optionalProtect, isStaff } = require("../middleware/authMiddleware");
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

function userHasAccess(user, itemId) {
  if (!user) return false;
  if (isStaff(user)) return true;
  return user.purchasedPremium?.some((id) => String(id) === String(itemId));
}

function sanitizeItem(item, user) {
  const obj = item.toObject ? item.toObject() : { ...item };
  const purchased = userHasAccess(user, obj._id);

  if (!purchased) {
    delete obj.fileUrl;
    delete obj.youtubeId;
    delete obj.fileType;
  }

  return {
    ...obj,
    purchased,
    locked: !purchased,
  };
}

// @route GET /api/premium
router.get("/", optionalProtect, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (isStaff(req.user) && req.query.all === "true") {
      delete filter.isActive;
    }
    if (req.query.className) filter.className = req.query.className;
    if (req.query.contentType) filter.contentType = req.query.contentType;
    if (req.query.subject) filter.subject = new RegExp(req.query.subject, "i");

    const items = await PremiumItem.find(filter).sort({ createdAt: -1 });
    res.json(items.map((item) => sanitizeItem(item, req.user)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/premium/:id/access
router.get("/:id/access", protect, async (req, res) => {
  try {
    const item = await PremiumItem.findById(req.params.id);
    if (!item || !item.isActive) {
      return res.status(404).json({ message: "Premium content not found" });
    }

    if (!userHasAccess(req.user, item._id)) {
      return res.status(403).json({ message: "Purchase required to access this content" });
    }

    res.json({
      _id: item._id,
      title: item.title,
      contentType: item.contentType,
      fileUrl: item.fileUrl,
      youtubeId: item.youtubeId,
      duration: item.duration,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/premium
router.post("/", protect, adminOnly, upload.single("file"), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      contentType,
      subject,
      className,
      examYear,
      duration,
      youtubeUrl,
    } = req.body;

    if (!title?.trim() || !subject?.trim() || !className || !contentType) {
      return res.status(400).json({ message: "Title, subject, class, and content type are required" });
    }

    const parsedPrice = Number(price);
    if (!parsedPrice || parsedPrice < 1) {
      return res.status(400).json({ message: "Valid price (min ₹1) is required" });
    }

    const youtubeId = contentType === "video" ? extractYoutubeId(youtubeUrl) : null;

    if (contentType === "video" && !req.file && !youtubeId) {
      return res.status(400).json({ message: "Upload a video file or provide a YouTube link" });
    }

    if ((contentType === "pdf" || contentType === "pyq") && !req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    if (contentType === "pyq" && !examYear?.trim()) {
      return res.status(400).json({ message: "Exam year is required for PYQ content" });
    }

    let fileUrl = null;
    let fileType = null;

    if (req.file) {
      const folder = folderForFile(
        contentType === "pyq" ? "pyq" : contentType === "video" ? "lecture" : "pdf",
        req.file.mimetype,
        req.file.originalname
      );
      fileUrl = await uploadFile(req.file, folder);
      fileType = req.file.mimetype;

      if (!fileUrl.includes("res.cloudinary.com")) {
        throw new Error("All uploads must be stored on Cloudinary.");
      }
    }

    const item = await PremiumItem.create({
      title: title.trim(),
      description: description?.trim(),
      price: parsedPrice,
      contentType,
      subject: subject.trim(),
      className,
      examYear: examYear?.trim(),
      fileUrl,
      fileType,
      youtubeId: youtubeId || undefined,
      duration: duration || undefined,
      uploadedBy: req.user._id,
    });

    res.status(201).json(sanitizeItem(item, req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/premium/:id
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, price, isActive } = req.body;
    const updates = {};

    if (title?.trim()) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!parsedPrice || parsedPrice < 1) {
        return res.status(400).json({ message: "Valid price (min ₹1) is required" });
      }
      updates.price = parsedPrice;
    }
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const item = await PremiumItem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ message: "Not found" });

    res.json(sanitizeItem(item, req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/premium/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const item = await PremiumItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (item.fileUrl) {
      try {
        await deleteStoredFile(item.fileUrl);
      } catch (fileErr) {
        const msg = fileErr?.error?.message || fileErr?.message || "File delete failed";
        console.warn("[premium] File delete failed, removing record anyway:", msg);
      }
    }

    await User.updateMany({}, { $pull: { purchasedPremium: item._id } });
    await PremiumItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete premium item" });
  }
});

module.exports = router;
