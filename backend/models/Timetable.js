const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    room: { type: String, trim: true, default: "" },
    teacher: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      enum: ["junior", "senior-science", "senior-arts"],
      required: true,
      unique: true,
    },
    slots: [slotSchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
