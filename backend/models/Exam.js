const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    className: { type: String, enum: ["10th", "11th", "12th"], required: true },
    subject: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, default: 30, min: 5 },
    passPercentage: { type: Number, default: 40, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
