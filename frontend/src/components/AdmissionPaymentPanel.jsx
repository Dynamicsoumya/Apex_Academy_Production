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
  readOnlyPayment = false,
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
  const paymentDone = ["offline_verified", "paid"].includes(admission?.paymentStatus);
  const proofSubmitted = admission?.paymentStatus === "proof_submitted";
  const canUpload = admission && phone && !paymentDone && !readOnlyPayment;

  useEffect(() => {
    API.get("/admissions/payment-qr")
      .then((res) => setPaymentQr(res.data))
      .catch(() => setPaymentQr({ admissionFee: fee, hasQr: false, hasUpi: false }));
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
    if (!phone.trim()) return setError("Student mobile number is required.");
    if (!screenshot) return setError("Please upload payment screenshot.");

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

      setSuccess(data.message || "Screenshot submitted to admin!");
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
  const hasPaymentInfo = paymentQr?.hasQr || paymentQr?.hasUpi;

  if (paymentDone && admission?.status === "approved") {
    return (
      <div className="adm-payment-complete-box">
        <span>🎓</span>
        <div>
          <h3>Admission complete!</h3>
          <p>Your Admission ID:</p>
          <strong className="adm-payment-complete-id">{admission.applicationId}</strong>
          <p className="adm-payment-complete-hint">Payment verified. Save this ID for your records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`adm-payment-panel ${compact ? "adm-payment-panel--compact" : ""}`}>
      <div className="adm-pay-flow-steps">
        <div className={`adm-pay-flow-step ${!proofSubmitted && !paymentDone ? "active" : "done"}`}>
          <span>1</span> Scan &amp; pay
        </div>
        <div className={`adm-pay-flow-step ${proofSubmitted ? "done" : !paymentDone ? "active" : ""}`}>
          <span>2</span> Upload screenshot
        </div>
        <div className={`adm-pay-flow-step ${proofSubmitted ? "active" : ""}`}>
          <span>3</span> Admin verifies
        </div>
      </div>

      {admission && (
        <p className="adm-payment-app-id">
          Application ID: <strong>{admission.applicationId}</strong>
        </p>
      )}

      <div className="adm-payment-panel-head">
        <span className="adm-payment-panel-icon">📱</span>
        <div>
          <p className="adm-offline-panel-eyebrow">Step 1 — Pay admission fee</p>
          <h3>Pay ₹{amount} via UPI</h3>
          <p className="adm-offline-panel-sub">
            Scan admin QR or pay to UPI ID <strong>{paymentQr?.upiId || "below"}</strong> — amount <strong>₹{amount}</strong> to <strong>{payee}</strong>.
          </p>
        </div>
      </div>

      {!hasPaymentInfo ? (
        <p className="adm-qr-missing">
          Admin has not uploaded UPI QR / UPI ID yet. Please check back later or contact Apex Academy office.
        </p>
      ) : (
        <>
          {paymentQr?.upiId && (
            <div className="adm-upi-only-box adm-upi-only-box--prominent">
              <p>Pay to this UPI ID</p>
              <strong>{paymentQr.upiId}</strong>
              <small>Amount: ₹{amount} · {payee}</small>
            </div>
          )}

          {paymentQr?.hasQr && (
            <div className="adm-qr-grid">
              <QrCard label="PhonePe" icon="💜" url={paymentQr.phonePeQrUrl} upiId={paymentQr.upiId} />
              <QrCard label="Google Pay" icon="🔵" url={paymentQr.googlePayQrUrl} upiId={paymentQr.upiId} />
            </div>
          )}
        </>
      )}

      {admission && (
        <p className="adm-payment-status-line">
          Status: <strong>{PAYMENT_STATUS_LABELS[admission.paymentStatus] || admission.paymentStatus}</strong>
        </p>
      )}

      {proofSubmitted && (
        <div className="adm-proof-submitted-box">
          <p>✅ Payment screenshot sent to admin. Your Admission ID <strong>{admission.applicationId}</strong> will be confirmed after verification.</p>
        </div>
      )}

      {canUpload && (
        <form className="adm-proof-form" onSubmit={handleUpload}>
          <h4>Step 2 — Upload payment screenshot</h4>
          <p className="adm-proof-hint">
            After successful UPI payment, choose your payment screenshot image and submit.
          </p>

          {!hasPaymentInfo && (
            <p className="adm-proof-hint adm-proof-hint--warn">
              Admin UPI QR is not set yet — you can still upload screenshot if you already paid.
            </p>
          )}

          {error && <div className="adm-alert">{error}</div>}
          {success && <div className="adm-proof-success">{success}</div>}

          <label className="adm-proof-field">
            UPI transaction ID (recommended)
            <input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 123456789012"
            />
          </label>

          <div className="adm-proof-upload-card">
            <div className={`adm-proof-dropzone ${preview ? "has-preview" : ""}`}>
              {preview ? (
                <img src={preview} alt="Payment screenshot preview" className="adm-proof-preview" />
              ) : (
                <div className="adm-proof-placeholder">
                  <span className="adm-proof-placeholder-icon">🧾</span>
                  <p>Tap below to select payment screenshot</p>
                  <small>JPG, PNG · from PhonePe / GPay success screen</small>
                </div>
              )}
            </div>

            {screenshot && (
              <p className="adm-screenshot-name">
                <span>✓</span> {screenshot.name}
              </p>
            )}

            <div className="adm-proof-actions">
              <label className="adm-screenshot-btn">
                <span className="adm-btn-icon" aria-hidden="true">📷</span>
                <span className="adm-btn-text">
                  <strong>Choose screenshot</strong>
                  <small>Select image from gallery</small>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="adm-file-input"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </label>

              <button
                type="submit"
                className="adm-submit-proof-btn"
                disabled={loading || !screenshot}
              >
                {loading ? (
                  <>
                    <span className="adm-btn-spinner" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <span className="adm-btn-icon" aria-hidden="true">✅</span>
                    <span className="adm-btn-text">
                      <strong>Submit to admin for verification</strong>
                      <small>Send payment proof to Apex Academy</small>
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {paymentDone && admission?.status !== "approved" && (
        <p className="adm-proof-verified">✅ Payment verified — admission approval pending.</p>
      )}
    </div>
  );
}
