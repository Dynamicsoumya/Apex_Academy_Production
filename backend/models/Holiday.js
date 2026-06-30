const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String, trim: true, default: "" },
    batches: {
      type: [String],
      default: ["all"],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 });

module.exports = mongoose.model("Holiday", holidaySchema);
