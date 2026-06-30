const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    studentName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    parentPhone: { type: String, required: true, trim: true },

    className: { type: String, enum: ["9th", "10th", "11th", "12th"], required: true },
    stream: { type: String, enum: ["School", "Science", "Commerce", "Arts"], required: true },
    course: { type: String, required: true, trim: true },

    studentPhone: { type: String, required: true, trim: true },
    studentEmail: { type: String, trim: true, lowercase: true },

    studentPhotoUrl: { type: String },
    parentPhotoUrl: { type: String },

    paymentMode: { type: String, enum: ["online", "offline"], required: true },
    admissionFee: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "offline_pending", "offline_verified", "failed"],
      default: "pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected"],
      default: "submitted",
    },
    adminNotes: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);
