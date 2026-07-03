const mongoose = require("mongoose");

const admissionPaymentSettingsSchema = new mongoose.Schema(
  {
    phonePeQrUrl: { type: String, default: "" },
    googlePayQrUrl: { type: String, default: "" },
    upiId: { type: String, default: "", trim: true },
    payeeName: { type: String, default: "Apex Academy", trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdmissionPaymentSettings", admissionPaymentSettingsSchema);
