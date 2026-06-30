const express = require("express");
const crypto = require("crypto");
const Admission = require("../models/Admission");
const { protect, adminOnly, optionalProtect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadFile, folderForFile } = require("../utils/s3Storage");
const {
  getRazorpay,
  isRazorpayConfigured,
  isMockPaymentsEnabled,
  razorpayErrorMessage,
} = require("../utils/razorpayClient");

const router = express.Router();

function getAdmissionFee() {
  const fee = Number(process.env.ADMISSION_FEE || 500);
  return fee > 0 ? fee : 500;
}

async function generateApplicationId() {
  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const count = await Admission.countDocuments({ createdAt: { $gte: start } });
  return `APEX-${year}-${String(count + 1).padStart(4, "0")}`;
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const sign = orderId + "|" + paymentId;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET.trim())
    .update(sign)
    .digest("hex");
  return expectedSign === signature;
}

async function loadAdmissionForPayment(id, verifyPhone) {
  const admission = await Admission.findById(id);
  if (!admission) return { error: { status: 404, message: "Application not found" } };
  if (verifyPhone && admission.studentPhone.trim() !== String(verifyPhone).trim()) {
    return { error: { status: 403, message: "Phone number does not match this application" } };
  }
  if (admission.paymentStatus === "paid" || admission.paymentStatus === "offline_verified") {
    return { error: { status: 400, message: "Payment already completed for this application" } };
  }
  if (admission.paymentMode !== "online") {
    return { error: { status: 400, message: "This application is set for offline payment" } };
  }
  return { admission };
}

async function uploadPhoto(file, label) {
  if (!file) return null;
  const folder = folderForFile("image", file.mimetype, file.originalname);
  const url = await uploadFile(file, folder);
  if (!url.includes("res.cloudinary.com") && !url.startsWith("http")) {
    throw new Error(`${label} must be stored on Cloudinary. Check CLOUDINARY_URL in .env`);
  }
  return url;
}

// @route GET /api/admissions/fee
router.get("/fee", (req, res) => {
  res.json({
    admissionFee: getAdmissionFee(),
    currency: "INR",
    razorpayConfigured: isRazorpayConfigured(),
    mockPaymentsEnabled: isMockPaymentsEnabled(),
  });
});

// @route POST /api/admissions
router.post(
  "/",
  optionalProtect,
  upload.fields([
    { name: "studentPhoto", maxCount: 1 },
    { name: "parentPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        studentName,
        address,
        fatherName,
        motherName,
        parentPhone,
        className,
        stream,
        course,
        studentPhone,
        studentEmail,
      } = req.body;

      if (!studentName?.trim() || !address?.trim() || !parentPhone?.trim()) {
        return res.status(400).json({ message: "Student name, address, and parent phone are required" });
      }
      if (!studentPhone?.trim() || !className || !stream || !course?.trim()) {
        return res.status(400).json({ message: "Class, course, and student contact are required" });
      }
      const paymentMode = "offline";
      if (!req.files?.studentPhoto?.[0]) {
        return res.status(400).json({ message: "Student photo is required" });
      }

      const studentPhotoUrl = await uploadPhoto(req.files.studentPhoto[0], "Student photo");
      let parentPhotoUrl = null;
      if (req.files?.parentPhoto?.[0]) {
        parentPhotoUrl = await uploadPhoto(req.files.parentPhoto[0], "Parent photo");
      }

      const fee = getAdmissionFee();
      const applicationId = await generateApplicationId();

      const admission = await Admission.create({
        applicationId,
        user: req.user?._id,
        studentName: studentName.trim(),
        address: address.trim(),
        fatherName: fatherName?.trim(),
        motherName: motherName?.trim(),
        parentPhone: parentPhone.trim(),
        className,
        stream,
        course: course.trim(),
        studentPhone: studentPhone.trim(),
        studentEmail: studentEmail?.trim(),
        studentPhotoUrl,
        parentPhotoUrl,
        paymentMode,
        admissionFee: fee,
        paymentStatus: "offline_pending",
        status: "submitted",
      });

      res.status(201).json(admission);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// @route GET /api/admissions/track
router.get("/track", async (req, res) => {
  try {
    const { applicationId, phone } = req.query;
    if (!applicationId || !phone) {
      return res.status(400).json({ message: "applicationId and phone are required" });
    }

    const admission = await Admission.findOne({
      applicationId: String(applicationId).trim().toUpperCase(),
      studentPhone: String(phone).trim(),
    }).select("-razorpaySignature");

    if (!admission) {
      return res.status(404).json({ message: "No application found with these details" });
    }

    res.json(admission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/admissions/my
router.get("/my", protect, async (req, res) => {
  try {
    const filter = {
      $or: [{ user: req.user._id }],
    };
    if (req.user.email) filter.$or.push({ studentEmail: req.user.email });
    if (req.user.phone) filter.$or.push({ studentPhone: req.user.phone });

    const list = await Admission.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/admissions/stats
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [total, pending, underReview, approved, rejected] = await Promise.all([
      Admission.countDocuments(),
      Admission.countDocuments({ status: "submitted" }),
      Admission.countDocuments({ status: "under_review" }),
      Admission.countDocuments({ status: "approved" }),
      Admission.countDocuments({ status: "rejected" }),
    ]);
    res.json({ total, pending, underReview, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/admissions
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.className) filter.className = req.query.className;

    const list = await Admission.find(filter)
      .populate("user", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/admissions/:id
router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate("user", "name email")
      .populate("reviewedBy", "name email");

    if (!admission) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(admission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/admissions/:id/pay-online
router.post("/:id/pay-online", async (req, res) => {
  try {
    const { verifyPhone } = req.body;
    const loaded = await loadAdmissionForPayment(req.params.id, verifyPhone);
    if (loaded.error) {
      return res.status(loaded.error.status).json({ message: loaded.error.message });
    }

    const { admission } = loaded;
    const amountPaise = Math.round(admission.admissionFee * 100);

    if (!isRazorpayConfigured()) {
      if (!isMockPaymentsEnabled()) {
        return res.status(503).json({
          message:
            "Online payment is not configured. Choose offline payment or contact Apex Academy.",
        });
      }

      const mockOrderId = `mock_adm_${Date.now()}`;
      admission.razorpayOrderId = mockOrderId;
      await admission.save();

      return res.json({
        mock: true,
        orderId: mockOrderId,
        amount: amountPaise,
        currency: "INR",
        itemName: `Admission — ${admission.applicationId}`,
        admissionId: admission._id,
      });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: admission.applicationId.replace(/-/g, "").slice(0, 40),
    });

    admission.razorpayOrderId = order.id;
    await admission.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID.trim(),
      itemName: `Admission — ${admission.applicationId}`,
      admissionId: admission._id,
    });
  } catch (err) {
    const msg = razorpayErrorMessage(err);
    res.status(500).json({ message: msg });
  }
});

// @route POST /api/admissions/:id/verify-online
router.post("/:id/verify-online", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      verifyPhone,
      mock,
    } = req.body;

    const loaded = await loadAdmissionForPayment(req.params.id, verifyPhone);
    if (loaded.error) {
      return res.status(loaded.error.status).json({ message: loaded.error.message });
    }

    const { admission } = loaded;

    if (mock) {
      if (!isMockPaymentsEnabled()) {
        return res.status(403).json({ message: "Mock payments are disabled" });
      }
      admission.razorpayPaymentId = `mock_pay_${Date.now()}`;
      admission.razorpaySignature = "mock";
      admission.paymentStatus = "paid";
      await admission.save();
      return res.json({ message: "Test payment successful", admission });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    admission.razorpayPaymentId = razorpay_payment_id;
    admission.razorpaySignature = razorpay_signature;
    admission.paymentStatus = "paid";
    await admission.save();

    res.json({ message: "Payment verified successfully", admission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PATCH /api/admissions/:id
router.patch("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes, paymentStatus } = req.body;
    const updates = {};

    if (status) {
      updates.status = status;
      if (status === "submitted") {
        updates.reviewedBy = null;
        updates.reviewedAt = null;
      } else {
        updates.reviewedBy = req.user._id;
        updates.reviewedAt = new Date();
      }
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    const admission = await Admission.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("reviewedBy", "name email");
    if (!admission) return res.status(404).json({ message: "Application not found" });

    res.json(admission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/admissions/:id — rejected applications only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (admission.status !== "rejected") {
      return res.status(400).json({
        message: "Only rejected applications can be deleted. Reject the application first.",
      });
    }

    await admission.deleteOne();
    res.json({ message: "Rejected application deleted", applicationId: admission.applicationId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
