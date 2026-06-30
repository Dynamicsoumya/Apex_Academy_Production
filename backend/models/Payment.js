const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentType: { type: String, enum: ["course", "premium"], default: "course" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    premiumItem: { type: mongoose.Schema.Types.ObjectId, ref: "PremiumItem" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
