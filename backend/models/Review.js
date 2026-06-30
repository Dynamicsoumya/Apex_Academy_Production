const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    className: { type: String, enum: ["9th", "10th", "11th", "12th"], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    opinion: { type: String, required: true, trim: true, maxlength: 500 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
