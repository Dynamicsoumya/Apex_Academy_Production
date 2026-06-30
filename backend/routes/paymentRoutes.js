const express = require("express");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Course = require("../models/Course");
const PremiumItem = require("../models/PremiumItem");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const {
  getRazorpay,
  isRazorpayConfigured,
  isMockPaymentsEnabled,
  razorpayErrorMessage,
} = require("../utils/razorpayClient");

const router = express.Router();

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const sign = orderId + "|" + paymentId;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET.trim())
    .update(sign)
    .digest("hex");
  return expectedSign === signature;
}

async function loadPremiumPurchase(req, premiumItemId) {
  const item = await PremiumItem.findById(premiumItemId);
  if (!item || !item.isActive) {
    return { error: { status: 404, message: "Premium content not found" } };
  }

  const alreadyOwned = req.user.purchasedPremium?.some((id) => String(id) === String(item._id));
  if (alreadyOwned) {
    return { error: { status: 400, message: "You already own this premium content" } };
  }

  return {
    amount: item.price,
    paymentType: "premium",
    itemName: item.title,
    paymentData: {
      user: req.user._id,
      status: "created",
      paymentType: "premium",
      premiumItem: item._id,
      amount: item.price,
    },
    premiumItemId: item._id,
  };
}

async function unlockPremium(userId, itemId) {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { purchasedPremium: itemId },
  });
}

// @route POST /api/payments/create-order
router.post("/create-order", protect, async (req, res) => {
  try {
    const { courseId, premiumItemId } = req.body;

    if (!courseId && !premiumItemId) {
      return res.status(400).json({ message: "courseId or premiumItemId is required" });
    }

    let amount;
    let paymentType;
    let itemName;
    let paymentData = { user: req.user._id, status: "created" };
    let resolvedPremiumItemId;

    if (premiumItemId) {
      const loaded = await loadPremiumPurchase(req, premiumItemId);
      if (loaded.error) {
        return res.status(loaded.error.status).json({ message: loaded.error.message });
      }
      amount = loaded.amount;
      paymentType = loaded.paymentType;
      itemName = loaded.itemName;
      paymentData = { ...loaded.paymentData };
      resolvedPremiumItemId = loaded.premiumItemId;
    } else {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      amount = course.price;
      paymentType = "course";
      itemName = course.title;
      paymentData.course = course._id;
      paymentData.paymentType = "course";
      paymentData.amount = course.price;
    }

    const amountPaise = Math.round(Number(amount) * 100);
    if (!amountPaise || amountPaise < 100) {
      return res.status(400).json({ message: "Invalid price. Minimum amount is ₹1." });
    }

    // Dev/test mode when Razorpay keys are not set
    if (!isRazorpayConfigured()) {
      if (!isMockPaymentsEnabled()) {
        return res.status(503).json({
          message:
            "Payment gateway is not configured. Add valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env (get free test keys from dashboard.razorpay.com). For local testing only, set MOCK_PAYMENTS=true in .env.",
        });
      }

      const mockOrderId = `mock_${paymentType}_${Date.now()}`;
      paymentData.razorpayOrderId = mockOrderId;
      await Payment.create(paymentData);

      return res.json({
        mock: true,
        orderId: mockOrderId,
        amount: amountPaise,
        currency: "INR",
        itemName,
        paymentType,
        courseId: courseId || undefined,
        premiumItemId: resolvedPremiumItemId || undefined,
      });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `${paymentType}_${Date.now()}`.slice(0, 40),
    });

    paymentData.razorpayOrderId = order.id;
    paymentData.amount = amount;
    await Payment.create(paymentData);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID.trim(),
      itemName,
      paymentType,
      courseId: courseId || undefined,
      premiumItemId: resolvedPremiumItemId || undefined,
    });
  } catch (err) {
    const msg = razorpayErrorMessage(err);
    const status = msg.toLowerCase().includes("authentication") ? 503 : 500;
    res.status(status).json({ message: msg });
  }
});

// @route POST /api/payments/verify-mock — local testing without Razorpay
router.post("/verify-mock", protect, async (req, res) => {
  try {
    if (!isMockPaymentsEnabled()) {
      return res.status(403).json({ message: "Mock payments are disabled" });
    }

    const { orderId, premiumItemId, courseId } = req.body;
    if (!orderId?.startsWith("mock_")) {
      return res.status(400).json({ message: "Invalid mock order" });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: orderId, user: req.user._id, status: "created" },
      {
        razorpayPaymentId: `mock_pay_${Date.now()}`,
        razorpaySignature: "mock",
        status: "paid",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (premiumItemId || payment.paymentType === "premium") {
      const itemId = premiumItemId || payment.premiumItem;
      await unlockPremium(req.user._id, itemId);
      return res.json({ message: "Test payment complete — premium content unlocked", payment });
    }

    const enrollCourseId = courseId || payment.course;
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: enrollCourseId },
      isPaidStudent: true,
    });

    res.json({ message: "Test payment complete — course enrolled", payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/payments/verify
router.post("/verify", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
      premiumItemId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({ message: "Payment gateway is not configured" });
    }

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: req.user._id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (premiumItemId || payment.paymentType === "premium") {
      const itemId = premiumItemId || payment.premiumItem;
      if (!itemId) {
        return res.status(400).json({ message: "Premium item not found for this payment" });
      }
      await unlockPremium(req.user._id, itemId);
      return res.json({ message: "Payment verified — premium content unlocked", payment });
    }

    const enrollCourseId = courseId || payment.course;
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: enrollCourseId },
      isPaidStudent: true,
    });

    res.json({ message: "Payment verified successfully", payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/payments/status
router.get("/status", (req, res) => {
  res.json({
    razorpayConfigured: isRazorpayConfigured(),
    mockPaymentsEnabled: isMockPaymentsEnabled(),
  });
});

module.exports = router;
