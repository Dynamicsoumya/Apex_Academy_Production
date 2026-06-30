const express = require("express");
const Exam = require("../models/Exam");
const ExamQuestion = require("../models/ExamQuestion");
const ExamAttempt = require("../models/ExamAttempt");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

function sanitizeQuestion(q) {
  const obj = q.toObject ? q.toObject() : { ...q };
  delete obj.correctOption;
  return obj;
}

function gradeAnswers(questions, submittedAnswers) {
  const answerMap = new Map(submittedAnswers.map((a) => [String(a.questionId), a.selectedOption]));
  let score = 0;
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const graded = questions.map((q) => {
    const selected = answerMap.get(String(q._id)) || null;
    const isCorrect = selected === q.correctOption;
    const marksAwarded = isCorrect ? (q.marks || 1) : 0;
    score += marksAwarded;
    return {
      question: q._id,
      selectedOption: selected,
      isCorrect,
      marksAwarded,
    };
  });

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  return { score, totalMarks, percentage, graded };
}

// @route GET /api/exams
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== "admin") {
      filter.isActive = true;
      if (req.user.className && ["10th", "11th", "12th"].includes(req.user.className)) {
        filter.className = req.user.className;
      }
    } else if (req.query.all !== "true") {
      filter.isActive = true;
    }
    if (req.query.className) filter.className = req.query.className;

    const exams = await Exam.find(filter).sort({ createdAt: -1 });
    const questionCounts = await ExamQuestion.aggregate([
      { $match: { exam: { $in: exams.map((e) => e._id) } } },
      { $group: { _id: "$exam", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(questionCounts.map((c) => [String(c._id), c.count]));

    let attemptMap = {};
    if (req.user.role === "student") {
      const attempts = await ExamAttempt.find({ user: req.user._id, exam: { $in: exams.map((e) => e._id) } });
      attemptMap = Object.fromEntries(attempts.map((a) => [String(a.exam), a]));
    }

    res.json(
      exams.map((exam) => ({
        ...exam.toObject(),
        questionCount: countMap[String(exam._id)] || 0,
        attempted: Boolean(attemptMap[String(exam._id)]),
        myResult: attemptMap[String(exam._id)]
          ? {
              score: attemptMap[String(exam._id)].score,
              totalMarks: attemptMap[String(exam._id)].totalMarks,
              percentage: attemptMap[String(exam._id)].percentage,
              passed: attemptMap[String(exam._id)].passed,
            }
          : null,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/exams/results/all — admin all student results
router.get("/results/all", protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.examId) filter.exam = req.query.examId;
    if (req.query.className) {
      const exams = await Exam.find({ className: req.query.className }).select("_id");
      filter.exam = { $in: exams.map((e) => e._id) };
    }

    const attempts = await ExamAttempt.find(filter)
      .populate("user", "name email className stream phone")
      .populate("exam", "title subject className passPercentage")
      .sort({ submittedAt: -1 });

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/exams/my/history — student own results
router.get("/my/history", protect, async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ user: req.user._id })
      .populate("exam", "title subject className passPercentage durationMinutes")
      .sort({ submittedAt: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/exams — admin create exam
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, className, subject, durationMinutes, passPercentage, isActive } = req.body;
    if (!title?.trim() || !className || !subject?.trim()) {
      return res.status(400).json({ message: "Title, class, and subject are required" });
    }

    const exam = await Exam.create({
      title: title.trim(),
      description: description?.trim(),
      className,
      subject: subject.trim(),
      durationMinutes: durationMinutes || 30,
      passPercentage: passPercentage ?? 40,
      isActive: isActive !== false,
      createdBy: req.user._id,
    });

    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/exams/:id
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const updates = {};
    const { title, description, className, subject, durationMinutes, passPercentage, isActive } = req.body;
    if (title?.trim()) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (className) updates.className = className;
    if (subject?.trim()) updates.subject = subject.trim();
    if (durationMinutes) updates.durationMinutes = durationMinutes;
    if (passPercentage !== undefined) updates.passPercentage = passPercentage;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const exam = await Exam.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/exams/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    await ExamQuestion.deleteMany({ exam: exam._id });
    await ExamAttempt.deleteMany({ exam: exam._id });
    await Exam.findByIdAndDelete(exam._id);
    res.json({ message: "Exam deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/exams/:id/questions — admin only (with answers)
router.get("/:id/questions", protect, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const questions = await ExamQuestion.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 });
    res.json({ exam, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/exams/:id/questions — admin add MCQ
router.post("/:id/questions", protect, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const { question, options, correctOption, marks } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: "Question text is required" });
    if (!options?.A || !options?.B || !options?.C || !options?.D) {
      return res.status(400).json({ message: "All four options (A, B, C, D) are required" });
    }
    if (!["A", "B", "C", "D"].includes(correctOption)) {
      return res.status(400).json({ message: "Correct option must be A, B, C, or D" });
    }

    const count = await ExamQuestion.countDocuments({ exam: exam._id });
    const q = await ExamQuestion.create({
      exam: exam._id,
      question: question.trim(),
      options: {
        A: options.A.trim(),
        B: options.B.trim(),
        C: options.C.trim(),
        D: options.D.trim(),
      },
      correctOption,
      marks: marks || 1,
      order: count,
    });

    res.status(201).json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/exams/:id/questions/:qid
router.delete("/:id/questions/:qid", protect, adminOnly, async (req, res) => {
  try {
    const q = await ExamQuestion.findOneAndDelete({ _id: req.params.qid, exam: req.params.id });
    if (!q) return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/exams/:id/results — admin results for one exam
router.get("/:id/results", protect, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await ExamAttempt.find({ exam: exam._id })
      .populate("user", "name email className stream phone")
      .sort({ submittedAt: -1 });

    res.json({ exam, attempts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/exams/:id/start — student start exam (no correct answers)
router.get("/:id/start", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can take exams" });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isActive) return res.status(404).json({ message: "Exam not found or inactive" });

    if (exam.className !== req.user.className) {
      return res.status(403).json({ message: "This exam is not for your class" });
    }

    const existing = await ExamAttempt.findOne({ user: req.user._id, exam: exam._id });
    if (existing) {
      return res.status(400).json({
        message: "You have already attempted this exam",
        result: {
          score: existing.score,
          totalMarks: existing.totalMarks,
          percentage: existing.percentage,
          passed: existing.passed,
        },
      });
    }

    const questions = await ExamQuestion.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 });
    if (questions.length === 0) {
      return res.status(400).json({ message: "This exam has no questions yet" });
    }

    res.json({
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        className: exam.className,
        subject: exam.subject,
        durationMinutes: exam.durationMinutes,
        passPercentage: exam.passPercentage,
      },
      questions: questions.map(sanitizeQuestion),
      totalQuestions: questions.length,
      totalMarks: questions.reduce((s, q) => s + (q.marks || 1), 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/exams/:id/submit — student submit answers
router.post("/:id/submit", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit exams" });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isActive) return res.status(404).json({ message: "Exam not found" });

    const existing = await ExamAttempt.findOne({ user: req.user._id, exam: exam._id });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted this exam" });
    }

    const questions = await ExamQuestion.find({ exam: exam._id });
    if (questions.length === 0) {
      return res.status(400).json({ message: "Exam has no questions" });
    }

    const { answers, timeTakenSeconds } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers array is required" });
    }

    const questionIds = new Set(questions.map((q) => String(q._id)));
    for (const a of answers) {
      if (!questionIds.has(String(a.questionId))) {
        return res.status(400).json({ message: "Invalid question in submission" });
      }
    }

    const { score, totalMarks, percentage, graded } = gradeAnswers(questions, answers);
    const passed = percentage >= exam.passPercentage;

    const attempt = await ExamAttempt.create({
      user: req.user._id,
      exam: exam._id,
      answers: graded,
      score,
      totalMarks,
      percentage,
      passed,
      timeTakenSeconds: timeTakenSeconds || 0,
    });

    res.status(201).json({
      message: passed ? "Congratulations! You passed." : "Keep practicing! You did not pass.",
      result: {
        score,
        totalMarks,
        percentage,
        passed,
        passPercentage: exam.passPercentage,
        correctCount: graded.filter((a) => a.isCorrect).length,
        totalQuestions: questions.length,
        timeTakenSeconds: attempt.timeTakenSeconds,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already submitted this exam" });
    }
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/exams/:id/my-result
router.get("/:id/my-result", protect, async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({ user: req.user._id, exam: req.params.id })
      .populate("exam", "title subject className passPercentage durationMinutes");
    if (!attempt) return res.status(404).json({ message: "No attempt found" });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
