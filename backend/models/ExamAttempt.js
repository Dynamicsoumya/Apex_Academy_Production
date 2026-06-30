const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "ExamQuestion" },
        selectedOption: { type: String, enum: ["A", "B", "C", "D", null], default: null },
        isCorrect: { type: Boolean, default: false },
        marksAwarded: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeTakenSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

examAttemptSchema.index({ user: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);
