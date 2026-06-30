const mongoose = require("mongoose");

const pyqSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, enum: ["9th", "10th", "11th", "12th"], required: true },
    examYear: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PyqPaper", pyqSchema);
