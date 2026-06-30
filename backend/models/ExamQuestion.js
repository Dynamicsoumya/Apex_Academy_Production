const mongoose = require("mongoose");

const examQuestionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    question: { type: String, required: true, trim: true },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },
    correctOption: { type: String, enum: ["A", "B", "C", "D"], required: true },
    marks: { type: Number, default: 1, min: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamQuestion", examQuestionSchema);
