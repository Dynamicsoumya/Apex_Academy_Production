const BATCH_META = {
  junior: {
    batchId: "junior",
    label: "9th & 10th Evening Batch",
    timing: "5:00 PM – 8:00 PM",
    stream: "School",
    classes: ["9th", "10th"],
    icon: "🌙",
    theme: "evening",
  },
  "senior-science": {
    batchId: "senior-science",
    label: "+2 Morning Science Batch",
    timing: "7:00 AM – 10:00 AM",
    stream: "Science",
    classes: ["11th", "12th"],
    icon: "🌅",
    theme: "morning",
  },
  "senior-arts": {
    batchId: "senior-arts",
    label: "+2 Afternoon Arts Batch",
    timing: "3:00 PM – 5:00 PM",
    stream: "Arts",
    classes: ["11th", "12th"],
    icon: "🎨",
    theme: "afternoon",
  },
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getBatchMeta(batchId) {
  return BATCH_META[batchId] || null;
}

function listBatches() {
  return Object.values(BATCH_META);
}

function resolveUserBatch(user) {
  if (!user) return null;
  const { className, stream } = user;

  if (className === "9th" || className === "10th") {
    return BATCH_META.junior;
  }
  if (className === "11th" || className === "12th") {
    if (stream === "Arts") return BATCH_META["senior-arts"];
    return BATCH_META["senior-science"];
  }
  return null;
}

function holidayAppliesToBatch(holiday, batchId) {
  const batches = holiday.batches || ["all"];
  if (batches.includes("all")) return true;
  return batches.includes(batchId);
}

module.exports = {
  BATCH_META,
  DAY_NAMES,
  getBatchMeta,
  listBatches,
  resolveUserBatch,
  holidayAppliesToBatch,
};
