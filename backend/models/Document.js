const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    className: { type: String, enum: ["9th", "10th", "11th", "12th"], required: true },
    materialType: { type: String, enum: ["pdf", "lecture"], default: "pdf" },
    fileUrl: { type: String },
    fileType: { type: String },
    youtubeId: { type: String },
    duration: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
