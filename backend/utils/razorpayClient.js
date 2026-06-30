const Razorpay = require("razorpay");

const PLACEHOLDER_PATTERNS = [/xxxx/i, /your_razorpay/i, /xxxxxxxx/i];

function isPlaceholder(value) {
  if (!value || typeof value !== "string") return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(value));
}

function isRazorpayConfigured() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return false;
  if (!keyId.startsWith("rzp_")) return false;
  if (isPlaceholder(keyId) || isPlaceholder(keySecret)) return false;
  return true;
}

function isMockPaymentsEnabled() {
  return process.env.MOCK_PAYMENTS === "true";
}

let razorpayInstance = null;

function getRazorpay() {
  if (!isRazorpayConfigured()) return null;
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
  }
  return razorpayInstance;
}

function razorpayErrorMessage(err) {
  if (err?.error?.description) return err.error.description;
  if (err?.description) return err.description;
  if (err?.message) return err.message;
  return "Payment gateway error";
}

module.exports = {
  getRazorpay,
  isRazorpayConfigured,
  isMockPaymentsEnabled,
  razorpayErrorMessage,
};
