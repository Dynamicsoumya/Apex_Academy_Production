import React, { useEffect, useState } from "react";
import API from "../api/api";
import { mediaUrl } from "../utils/mediaUrl";
import { PAYMENT_STATUS_LABELS } from "../utils/admissionCourses";

function QrCard({ label, icon, url, upiId }) {
  if (!url) return null;
  return (
    <div className="adm-qr-card">
      <div className="adm-qr-card-head">
        <span>{icon}</span>
        <strong>{label}</strong>
      </div>
      <a href={mediaUrl(url)} target="_blank" rel="noreferrer" className="adm-qr-img-wrap">
        <img src={mediaUrl(url)} alt={`${label} QR code`} />
      </a>
      {upiId && <p className="adm-qr-upi">UPI: <strong>{upiId}</strong></p>}
    </div>
  );
}

export default function AdmissionPaymentPanel({
  admission,
  fee = 500,
  verifyPhone,
  compact = false,
  onUploaded,
}) {
  const [paymentQr, setPaymentQr] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState("");
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const phone = verifyPhone || admission?.studentPhone || "";
  const canUpload =
    admission &&
    phone &&
    !["offline_verified", "paid"].includes(admission.paymentStatus);

  useEffect(() => {
    API.get("/admissions/payment-qr")
      .then((res) => setPaymentQr(res.data))
      .catch(() => setPaymentQr({ admissionFee: fee, hasQr: false }));
  }, [fee]);

  useEffect(() => {
    if (!screenshot) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(screenshot);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!admission?._id) return setError("Application not found.");
    if (!phone.trim()) return setError("Enter student mobile number.");
    if (!screenshot) return setError("Upload payment screenshot.");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("paymentScreenshot", screenshot);
      if (utr.trim()) fd.append("paymentUtr", utr.trim());

      const { data } = await API.post(`/admissions/${admission._id}/payment-proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(data.message || "Screenshot uploaded!");
      setScreenshot(null);
      setUtr("");
      if (onUploaded) onUploaded(data.admission);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const amount = paymentQr?.admissionFee ?? fee;
  const payee = paymentQr?.payeeName || "Apex Academy";

  return (
    <div className={`adm-payment-panel ${compact ? "adm-payment-panel--compact" : ""}`}>
      <div className="adm-payment-panel-head">
        <span className="adm-payment-panel-icon">📱</span>
        <div>
          <p className="adm-offline-panel-eyebrow">Offline UPI payment</p>
          <h3>Pay ₹{amount} via PhonePe or Google Pay</h3>
          <p className="adm-offline-panel-sub">
            Scan the QR below, pay <strong>₹{amount}</strong> to <strong>{payee}</strong>, then upload the payment screenshot.
          </p>
        </div>
      </div>

      {paymentQr?.upiId && !paymentQr?.hasQr && (
        <div className="adm-upi-only-box">
          <p>Pay to UPI ID:</p>
          <strong>{paymentQr.upiId}</strong>
          <small>Amount: ₹{amount}</small>
        </div>
      )}

      {paymentQr?.hasQr ? (
        <div className="adm-qr-grid">
          <QrCard label="PhonePe" icon="💜" url={paymentQr.phonePeQrUrl} upiId={paymentQr.upiId} />
          <QrCard label="Google Pay" icon="🔵" url={paymentQr.googlePayQrUrl} upiId={paymentQr.upiId} />
        </div>
      ) : (
        <p className="adm-qr-missing">
          QR codes will appear here once admin uploads them. You can still pay at the center or WhatsApp us.
        </p>
      )}

      {admission && (
        <p className="adm-payment-status-line">
          Payment status:{" "}
          <strong>{PAYMENT_STATUS_LABELS[admission.paymentStatus] || admission.paymentStatus}</strong>
        </p>
      )}

      {canUpload && (
        <form className="adm-proof-form" onSubmit={handleUpload}>
          <h4>Upload payment screenshot</h4>
          <p className="adm-proof-hint">
            After paying, take a screenshot of the successful payment screen and upload it here.
          </p>

          {error && <div className="adm-alert">{error}</div>}
          {success && <div className="adm-proof-success">{success}</div>}

          <label className="adm-proof-field">
            UPI transaction ID (optional)
            <input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 123456789012"
            />
          </label>

          <div className="adm-proof-upload">
            {preview ? (
              <img src={preview} alt="Payment screenshot preview" className="adm-proof-preview" />
            ) : (
              <div className="adm-proof-placeholder">
                <span>🧾</span>
                <p>Payment screenshot</p>
              </div>
            )}
            <label className="btn btn-outline adm-upload-btn">
              Choose screenshot
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary join-glow-btn" disabled={loading}>
            {loading ? "Uploading…" : "Submit payment proof"}
          </button>
        </form>
      )}

      {admission?.paymentStatus === "proof_submitted" && (
        <p className="adm-proof-waiting">
          ✅ Screenshot received — admin will verify your payment soon.
        </p>
      )}

      {(admission?.paymentStatus === "offline_verified" || admission?.paymentStatus === "paid") && (
        <p className="adm-proof-verified">✅ Payment verified by Apex Academy.</p>
      )}
    </div>
  );
}
