import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import AdmissionPaymentPanel from "./AdmissionPaymentPanel";
import { APPLICATION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../utils/admissionCourses";

export default function StudentAdmissionCard() {
  const [applications, setApplications] = useState([]);
  const [fee, setFee] = useState(500);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([API.get("/admissions/my"), API.get("/admissions/fee")])
      .then(([myRes, feeRes]) => {
        setApplications(myRes.data || []);
        setFee(feeRes.data?.admissionFee ?? 500);
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  const app = applications.find((a) => a.status !== "rejected") || applications[0];
  if (!app) {
    return (
      <section className="stu-adm-card-wrap stu-adm-card-wrap--empty">
        <div className="stu-adm-card stu-adm-card--cta">
          <span>✨</span>
          <div>
            <h2>Admission not applied yet</h2>
            <p>Apply online, pay via UPI, upload screenshot — get your Admission ID after admin verifies.</p>
            <Link to="/admissions" className="btn btn-primary">Apply for admission</Link>
          </div>
        </div>
      </section>
    );
  }

  const isComplete = app.status === "approved" && ["offline_verified", "paid"].includes(app.paymentStatus);
  const awaitingVerify = app.paymentStatus === "proof_submitted";
  const needsPay = app.paymentStatus === "offline_pending";

  return (
    <section className="stu-adm-card-wrap">
      <div className={`stu-adm-card ${isComplete ? "stu-adm-card--complete" : ""}`}>
        {isComplete ? (
          <div className="stu-adm-complete">
            <span className="stu-adm-complete-icon">🎓</span>
            <div>
              <p className="stu-adm-complete-eyebrow">Admission complete</p>
              <h2>Your Admission ID</h2>
              <p className="stu-adm-complete-id">{app.applicationId}</p>
              <p className="stu-adm-complete-sub">
                {app.studentName} · Class {app.className} · {app.course}
              </p>
              <p className="stu-adm-complete-hint">Save this ID for office visits and future reference.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="stu-adm-card-head">
              <div>
                <p className="stu-adm-eyebrow">My admission application</p>
                <h2>ID: {app.applicationId}</h2>
                <p className="stu-adm-meta">
                  {PAYMENT_STATUS_LABELS[app.paymentStatus]} · {APPLICATION_STATUS_LABELS[app.status]}
                </p>
              </div>
              <Link to="/admissions" className="btn btn-outline btn-sm">Open pay section</Link>
            </div>

            {awaitingVerify && (
              <div className="stu-adm-banner stu-adm-banner--wait">
                Screenshot submitted — waiting for admin to verify your UPI payment. Your ID: <strong>{app.applicationId}</strong>
              </div>
            )}

            {needsPay || awaitingVerify ? (
              <AdmissionPaymentPanel admission={app} fee={fee} onUploaded={(u) => {
                setApplications((prev) => prev.map((a) => (a._id === u._id ? u : a)));
              }} />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
