const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    className: { type: String, enum: ["9th", "10th", "11th", "12th"], required: true },
    stream: { type: String, enum: ["School", "Science", "Commerce", "Arts"], required: true },
    price: { type: Number, required: true }, // in INR
    duration: { type: String }, // e.g. "6 months"
    thumbnail: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
