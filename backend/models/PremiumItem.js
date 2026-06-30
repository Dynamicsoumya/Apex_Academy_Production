const mongoose = require("mongoose");

const premiumItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 1 },
    contentType: { type: String, enum: ["pdf", "video", "pyq"], required: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, enum: ["9th", "10th", "11th", "12th"], required: true },
    examYear: { type: String, trim: true },
    fileUrl: { type: String },
    fileType: { type: String },
    youtubeId: { type: String },
    duration: { type: String },
    isActive: { type: Boolean, default: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PremiumItem", premiumItemSchema);
