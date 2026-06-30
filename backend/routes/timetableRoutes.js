const express = require("express");
const Timetable = require("../models/Timetable");
const Holiday = require("../models/Holiday");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  listBatches,
  getBatchMeta,
  resolveUserBatch,
  holidayAppliesToBatch,
  DAY_NAMES,
} = require("../utils/batchResolver");

const router = express.Router();

const VALID_BATCH_IDS = ["junior", "senior-science", "senior-arts"];

function sortSlots(slots) {
  return [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });
}

function groupSlotsByDay(slots) {
  const grouped = {};
  for (let d = 1; d <= 6; d += 1) {
    grouped[d] = { dayOfWeek: d, dayName: DAY_NAMES[d - 1], slots: [] };
  }
  sortSlots(slots).forEach((slot) => {
    if (grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek].slots.push(slot);
  });
  return Object.values(grouped);
}

// @route GET /api/timetable/batches
router.get("/batches", protect, (req, res) => {
  res.json(listBatches());
});

// @route GET /api/timetable/my — student own batch timetable + holidays
router.get("/my", protect, async (req, res) => {
  try {
    const batch = resolveUserBatch(req.user);
    if (!batch) {
      return res.status(400).json({ message: "Could not determine your batch from profile" });
    }

    const timetable = await Timetable.findOne({ batchId: batch.batchId }).lean();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const holidays = await Holiday.find({ date: { $gte: now } })
      .sort({ date: 1 })
      .limit(50)
      .lean();

    const filteredHolidays = holidays.filter((h) => holidayAppliesToBatch(h, batch.batchId));

    res.json({
      batch,
      slots: sortSlots(timetable?.slots || []),
      week: groupSlotsByDay(timetable?.slots || []),
      holidays: filteredHolidays,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/timetable/holidays
router.get("/holidays", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.year) {
      const y = Number(req.query.year);
      filter.date = {
        $gte: new Date(`${y}-01-01`),
        $lte: new Date(`${y}-12-31T23:59:59`),
      };
    }

    let holidays = await Holiday.find(filter).sort({ date: 1 }).lean();

    if (req.user.role === "student") {
      const batch = resolveUserBatch(req.user);
      if (batch) {
        holidays = holidays.filter((h) => holidayAppliesToBatch(h, batch.batchId));
      }
    }

    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/timetable/holidays
router.post("/holidays", protect, adminOnly, async (req, res) => {
  try {
    const { title, date, endDate, description, batches } = req.body;
    if (!title?.trim() || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }

    const holiday = await Holiday.create({
      title: title.trim(),
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      description: description?.trim() || "",
      batches: Array.isArray(batches) && batches.length ? batches : ["all"],
      createdBy: req.user._id,
    });

    res.status(201).json(holiday);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/timetable/holidays/:id
router.put("/holidays/:id", protect, adminOnly, async (req, res) => {
  try {
    const updates = {};
    const { title, date, endDate, description, batches } = req.body;
    if (title?.trim()) updates.title = title.trim();
    if (date) updates.date = new Date(date);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (description !== undefined) updates.description = description?.trim() || "";
    if (Array.isArray(batches)) updates.batches = batches.length ? batches : ["all"];

    const holiday = await Holiday.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });
    res.json(holiday);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/timetable/holidays/:id
router.delete("/holidays/:id", protect, adminOnly, async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });
    res.json({ message: "Holiday deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/timetable/:batchId
router.get("/:batchId", protect, async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!VALID_BATCH_IDS.includes(batchId)) {
      return res.status(400).json({ message: "Invalid batch" });
    }

    const meta = getBatchMeta(batchId);
    const timetable = await Timetable.findOne({ batchId }).lean();

    res.json({
      batch: meta,
      slots: sortSlots(timetable?.slots || []),
      week: groupSlotsByDay(timetable?.slots || []),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/timetable/:batchId
router.put("/:batchId", protect, adminOnly, async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!VALID_BATCH_IDS.includes(batchId)) {
      return res.status(400).json({ message: "Invalid batch" });
    }

    const { slots } = req.body;
    if (!Array.isArray(slots)) {
      return res.status(400).json({ message: "Slots array is required" });
    }

    for (const slot of slots) {
      if (!slot.dayOfWeek || !slot.startTime || !slot.endTime || !slot.subject?.trim()) {
        return res.status(400).json({ message: "Each slot needs day, times, and subject" });
      }
      if (slot.dayOfWeek < 1 || slot.dayOfWeek > 6) {
        return res.status(400).json({ message: "Day must be Monday (1) to Saturday (6)" });
      }
    }

    const cleaned = slots.map((s) => ({
      dayOfWeek: Number(s.dayOfWeek),
      startTime: s.startTime.trim(),
      endTime: s.endTime.trim(),
      subject: s.subject.trim(),
      room: s.room?.trim() || "",
      teacher: s.teacher?.trim() || "",
    }));

    const timetable = await Timetable.findOneAndUpdate(
      { batchId },
      { batchId, slots: cleaned, updatedBy: req.user._id },
      { new: true, upsert: true }
    );

    res.json({
      batch: getBatchMeta(batchId),
      slots: sortSlots(timetable.slots),
      week: groupSlotsByDay(timetable.slots),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
