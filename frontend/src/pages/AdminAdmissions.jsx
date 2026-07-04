import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";
import { getAdminNav } from "../utils/adminNav";
import { isSuperAdmin } from "../utils/roles";
import { APPLICATION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../utils/admissionCourses";
import { AdminPhoto, PhotoLightbox } from "../components/AdminPhoto";
import AdminPaymentQrSettings from "../components/AdminPaymentQrSettings";
import { mediaUrl } from "../utils/mediaUrl";

const staffRole = (user) => (isSuperAdmin(user) ? "superadmin" : "admin");

const TABS = [
  { id: "", label: "All" },
  { id: "submitted", label: "Pending" },
  { id: "under_review", label: "Under Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="adm-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AdminAdmissions() {
  const user = getStoredUser();
  const [list, setList] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, underReview: 0, approved: 0, rejected: 0, proofSubmitted: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState({ status: "", paymentStatus: "" });
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    const params = {};
    if (filter.status) params.status = filter.status;
    if (filter.paymentStatus) params.paymentStatus = filter.paymentStatus;

    Promise.all([
      API.get("/admissions", { params }),
      API.get("/admissions/stats"),
    ])
      .then(([listRes, statsRes]) => {
        setList(listRes.data);
        setStats(statsRes.data);
      })
      .catch((err) => {
        setList([]);
        setLoadError(err.response?.data?.message || "Failed to load admissions. Log in as admin.");
      })
      .finally(() => setLoading(false));
  }, [filter.status, filter.paymentStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (item) => {
    setSelected(item);
    setNotes(item.adminNotes || "");
    setMsg("");
    setDetailLoading(true);
    try {
      const { data } = await API.get(`/admissions/${item._id}`);
      setSelected(data);
      setNotes(data.adminNotes || "");
    } catch {
      setMsg("Could not refresh full details");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateAdmission = async (updates) => {
    if (!selected) return;
    setActionLoading(true);
    setMsg("");
    try {
      const payload = { ...updates };
      if (updates.adminNotes === undefined) payload.adminNotes = notes;
      const { data } = await API.patch(`/admissions/${selected._id}`, payload);
      setSelected(data);
      setNotes(data.adminNotes || "");
      setList((prev) => prev.map((a) => (a._id === data._id ? data : a)));
      setMsg(`Application marked as ${APPLICATION_STATUS_LABELS[data.status] || data.status}`);
      const { data: statsData } = await API.get("/admissions/stats");
      setStats(statsData);
    } catch (err) {
      setMsg(err.response?.data?.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const setStatus = (status) => updateAdmission({ status, adminNotes: notes });

  const verifyPaymentProof = async (item) => {
    const target = item || selected;
    if (!target) return;
    setActionLoading(true);
    setMsg("");
    try {
      const { data } = await API.patch(`/admissions/${target._id}/verify-payment`);
      if (selected?._id === data.admission._id) {
        setSelected(data.admission);
        setNotes(data.admission.adminNotes || "");
      }
      setList((prev) => prev.map((a) => (a._id === data.admission._id ? data.admission : a)));
      setMsg(data.message || `Admission complete — ID ${data.admission.applicationId}`);
      const { data: statsData } = await API.get("/admissions/stats");
      setStats(statsData);
    } catch (err) {
      setMsg(err.response?.data?.message || "Verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  const verifyOffline = () => verifyPaymentProof();

  const saveNotes = () => updateAdmission({ adminNotes: notes });

  const deleteRejected = async (item) => {
    if (item.status !== "rejected") return;
    const confirmed = window.confirm(
      `Delete rejected application ${item.applicationId} (${item.studentName})? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setMsg("");
    try {
      await API.delete(`/admissions/${item._id}`);
      if (selected?._id === item._id) setSelected(null);
      setList((prev) => prev.filter((a) => a._id !== item._id));
      const { data: statsData } = await API.get("/admissions/stats");
      setStats(statsData);
      setMsg(`Deleted ${item.applicationId}`);
    } catch (err) {
      setMsg(err.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout user={user} role={staffRole(user)} navItems={getAdminNav(user)} wide>
      <PhotoLightbox photo={zoomPhoto} onClose={() => setZoomPhoto(null)} />
      <header className="dash-welcome-card">
        <div className="dash-welcome-top">
          <div>
            <p className="dash-greeting">Admissions</p>
            <h1>Manage Applications</h1>
            <p className="dash-welcome-meta">View full details · Approve · Reject · Mark pending</p>
          </div>
          <div className="adm-admin-header-actions">
            <button type="button" className="btn btn-outline" onClick={load}>↻ Refresh</button>
            <Link to="/admin/admissions" className="btn btn-primary">Manage admissions</Link>
          </div>
        </div>
      </header>

      <AdminPaymentQrSettings canEdit={isSuperAdmin(user)} />

      <div className="adm-admin-verify-guide">
        <strong>Admission payment flow</strong>
        <ol>
          <li>Upload UPI QR image and/or UPI ID above — students see this in the pay section.</li>
          <li>Student pays ₹ fee, uploads payment screenshot, and submits.</li>
          <li>Open application <strong>Details</strong> → view screenshot → click <strong>Complete admission</strong>.</li>
          <li>Student receives Admission ID (e.g. APEX-2025-0001) on dashboard.</li>
        </ol>
      </div>

      <div className="adm-stats-row">
        <button type="button" className={`adm-stat-card ${!filter.status ? "active" : ""}`} onClick={() => setFilter({ ...filter, status: "" })}>
          <strong>{stats.total}</strong><span>Total</span>
        </button>
        <button type="button" className={`adm-stat-card pending ${filter.status === "submitted" ? "active" : ""}`} onClick={() => setFilter({ ...filter, status: "submitted" })}>
          <strong>{stats.pending}</strong><span>Pending</span>
        </button>
        <button type="button" className={`adm-stat-card ${filter.status === "under_review" ? "active" : ""}`} onClick={() => setFilter({ ...filter, status: "under_review" })}>
          <strong>{stats.underReview}</strong><span>Under Review</span>
        </button>
        <button type="button" className={`adm-stat-card approved ${filter.status === "approved" ? "active" : ""}`} onClick={() => setFilter({ ...filter, status: "approved" })}>
          <strong>{stats.approved}</strong><span>Approved</span>
        </button>
        <button type="button" className={`adm-stat-card rejected ${filter.status === "rejected" ? "active" : ""}`} onClick={() => setFilter({ ...filter, status: "rejected" })}>
          <strong>{stats.rejected}</strong><span>Rejected</span>
        </button>
        <button
          type="button"
          className={`adm-stat-card proof ${filter.paymentStatus === "proof_submitted" ? "active" : ""}`}
          onClick={() => setFilter({ status: "", paymentStatus: filter.paymentStatus === "proof_submitted" ? "" : "proof_submitted" })}
        >
          <strong>{stats.proofSubmitted}</strong><span>Payment proof</span>
        </button>
      </div>

      <div className="adm-admin-filters">
        <div className="adm-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`adm-tab ${filter.status === tab.id ? "active" : ""}`}
              onClick={() => setFilter({ ...filter, status: tab.id })}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select value={filter.paymentStatus} onChange={(e) => setFilter({ ...filter, paymentStatus: e.target.value })}>
          <option value="">All payments</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loadError && <div className="adm-alert">{loadError}</div>}

      {loading ? (
        <p className="dash-empty">Loading applications…</p>
      ) : list.length === 0 ? (
        <p className="dash-empty">No applications in this filter.</p>
      ) : (
        <div className="adm-admin-table-wrap">
          <table className="adm-admin-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Application ID</th>
                <th>Student</th>
                <th>Parents</th>
                <th>Class / Course</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr
                  key={item._id}
                  className={[
                    selected?._id === item._id ? "adm-row-selected" : "",
                    item.paymentStatus === "proof_submitted" ? "adm-row-proof" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <td>
                    <AdminPhoto
                      url={item.studentPhotoUrl}
                      label={item.studentName}
                      size="sm"
                      onZoom={setZoomPhoto}
                    />
                  </td>
                  <td><strong>{item.applicationId}</strong></td>
                  <td>
                    {item.studentName}
                    <br /><small>📱 {item.studentPhone}</small>
                    {item.studentEmail && <><br /><small>✉ {item.studentEmail}</small></>}
                  </td>
                  <td>
                    {item.fatherName || item.motherName ? (
                      <>
                        {item.fatherName && <span>F: {item.fatherName}<br /></span>}
                        {item.motherName && <span>M: {item.motherName}<br /></span>}
                      </>
                    ) : "—"}
                    <small>📱 {item.parentPhone}</small>
                  </td>
                  <td>
                    Class {item.className} · {item.stream}
                    <br /><small>{item.course}</small>
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge-${item.paymentStatus}`}>
                      {PAYMENT_STATUS_LABELS[item.paymentStatus]}
                    </span>
                    <br /><small>{item.paymentMode === "online" ? "Online" : "Offline"} · ₹{item.admissionFee}</small>
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge-${item.status}`}>
                      {APPLICATION_STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="adm-actions-cell">
                    <div className="adm-row-actions">
                      <button
                        type="button"
                        className="adm-btn-details"
                        onClick={() => openDetail(item)}
                        title={`View ${item.applicationId} details`}
                      >
                        <span className="adm-action-icon" aria-hidden="true">👁</span>
                        <span className="adm-action-label">
                          <strong>View Details</strong>
                          <small>Full application</small>
                        </span>
                      </button>

                      <div className="adm-row-actions-quick">
                        {item.paymentStatus === "proof_submitted" && (
                          <button
                            type="button"
                            className="adm-action-chip adm-action-chip--verify"
                            disabled={actionLoading}
                            onClick={() => verifyPaymentProof(item)}
                            title="Complete admission"
                          >
                            ✓ Verify pay
                          </button>
                        )}
                        {item.status !== "approved" && (
                          <button
                            type="button"
                            className="adm-action-chip adm-action-chip--approve"
                            onClick={() => API.patch(`/admissions/${item._id}`, { status: "approved" }).then(load)}
                            title="Approve"
                          >
                            ✓
                          </button>
                        )}
                        {item.status !== "rejected" && (
                          <button
                            type="button"
                            className="adm-action-chip adm-action-chip--reject"
                            onClick={() => API.patch(`/admissions/${item._id}`, { status: "rejected" }).then(load)}
                            title="Reject"
                          >
                            ✕
                          </button>
                        )}
                        {item.status === "rejected" && isSuperAdmin(user) && (
                          <button
                            type="button"
                            className="adm-action-chip adm-action-chip--delete"
                            onClick={() => deleteRejected(item)}
                            title="Delete rejected application"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="adm-modal" onClick={() => setSelected(null)}>
          <div className="adm-modal-inner adm-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-toolbar">
              <div className="adm-modal-toolbar-title">
                <span>Application Details</span>
                <small>{selected.applicationId}</small>
              </div>
              <button
                type="button"
                className="adm-modal-close"
                onClick={() => setSelected(null)}
                aria-label="Close application details"
              >
                <span className="adm-modal-close-icon" aria-hidden="true">✕</span>
                <span className="adm-modal-close-text">Close</span>
              </button>
            </div>

            <div className="adm-modal-scroll">
            <div className="adm-modal-head">
              <div>
                <p className="adm-modal-eyebrow">Application</p>
                <h2>{selected.applicationId}</h2>
                <div className="adm-modal-badges">
                  <span className={`adm-badge adm-badge-${selected.status}`}>{APPLICATION_STATUS_LABELS[selected.status]}</span>
                  <span className={`adm-badge adm-badge-${selected.paymentStatus}`}>{PAYMENT_STATUS_LABELS[selected.paymentStatus]}</span>
                </div>
              </div>
              <div className="adm-modal-quick-actions">
                <button type="button" className="btn adm-btn-approve" disabled={actionLoading} onClick={() => setStatus("approved")}>✓ Approve</button>
                <button type="button" className="btn adm-btn-pending" disabled={actionLoading} onClick={() => setStatus("submitted")}>⏳ Pending</button>
                <button type="button" className="btn adm-btn-review" disabled={actionLoading} onClick={() => setStatus("under_review")}>👁 Review</button>
                <button type="button" className="btn adm-btn-reject" disabled={actionLoading} onClick={() => setStatus("rejected")}>✕ Reject</button>
                {selected.status === "rejected" && isSuperAdmin(user) && (
                  <button type="button" className="btn adm-btn-delete" disabled={actionLoading} onClick={() => deleteRejected(selected)}>
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>

            {detailLoading && <p className="adm-modal-loading">Loading full details…</p>}
            {msg && <p className={`adm-modal-msg ${msg.includes("fail") ? "error" : ""}`}>{msg}</p>}

            <div className="adm-modal-photo-hero">
              <AdminPhoto
                url={selected.studentPhotoUrl}
                label="Student photo"
                size="lg"
                onZoom={setZoomPhoto}
              />
              <AdminPhoto
                url={selected.parentPhotoUrl}
                label="Parent photo"
                size="lg"
                onZoom={setZoomPhoto}
              />
              <div className="adm-modal-photo-caption">
                <h3>{selected.studentName}</h3>
                <p>Class {selected.className} · {selected.stream} · {selected.course}</p>
              </div>
            </div>

            <div className="adm-detail-sections">
              <section className="adm-detail-section">
                <h3>Student information</h3>
                <DetailRow label="Full name" value={selected.studentName} />
                <DetailRow label="Address" value={selected.address} />
                <DetailRow label="Mobile" value={selected.studentPhone} />
                <DetailRow label="Email" value={selected.studentEmail} />
                <DetailRow label="Class" value={`${selected.className} · ${selected.stream}`} />
                <DetailRow label="Course" value={selected.course} />
              </section>

              <section className="adm-detail-section">
                <h3>Parent / guardian</h3>
                <DetailRow label="Father's name" value={selected.fatherName} />
                <DetailRow label="Mother's name" value={selected.motherName} />
                <DetailRow label="Parent mobile" value={selected.parentPhone} />
              </section>

              <section className="adm-detail-section">
                <h3>Payment</h3>
                <DetailRow label="Mode" value={selected.paymentMode === "online" ? "Online (Razorpay)" : "Offline (UPI / center)"} />
                <DetailRow label="Fee" value={`₹${selected.admissionFee}`} />
                <DetailRow label="Payment status" value={PAYMENT_STATUS_LABELS[selected.paymentStatus]} />
                {selected.paymentUtr && <DetailRow label="UPI / Transaction ID" value={selected.paymentUtr} />}
                {selected.razorpayPaymentId && <DetailRow label="Transaction ID" value={selected.razorpayPaymentId} />}
                {selected.paymentScreenshotUrl && (
                  <div className="adm-payment-proof-view">
                    <p>Student payment screenshot</p>
                    <a href={mediaUrl(selected.paymentScreenshotUrl)} target="_blank" rel="noreferrer">
                      <img src={mediaUrl(selected.paymentScreenshotUrl)} alt="Payment proof" />
                    </a>
                    {selected.paymentScreenshotUploadedAt && (
                      <small>Uploaded {new Date(selected.paymentScreenshotUploadedAt).toLocaleString()}</small>
                    )}
                  </div>
                )}
                {selected.paymentStatus === "proof_submitted" && (
                  <div className="adm-verify-pay-actions">
                    <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={() => verifyPaymentProof()}>
                      ✓ Complete admission &amp; give ID to student
                    </button>
                    <p className="adm-verify-pay-hint">
                      Student ID: <strong>{selected.applicationId}</strong> — verify ₹{selected.admissionFee} payment first.
                    </p>
                  </div>
                )}
                {selected.status === "approved" && ["offline_verified", "paid"].includes(selected.paymentStatus) && (
                  <div className="adm-admission-complete-badge">
                    ✅ Admission complete — ID <strong>{selected.applicationId}</strong>
                  </div>
                )}
                {selected.paymentMode === "offline" && selected.paymentStatus === "offline_pending" && !selected.paymentScreenshotUrl && (
                  <button type="button" className="btn btn-outline" disabled={actionLoading} onClick={verifyOffline}>
                    Verify cash / center payment received
                  </button>
                )}
              </section>

            </div>

            <div className="adm-modal-footer">
              <label className="adm-notes-field">
                Admin notes (internal)
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for office staff…" />
              </label>
              <button type="button" className="btn btn-outline" disabled={actionLoading} onClick={saveNotes}>Save notes</button>
              {selected.reviewedAt && (
                <p className="adm-reviewed-meta">
                  Last reviewed: {new Date(selected.reviewedAt).toLocaleString()}
                  {selected.reviewedBy?.name && ` by ${selected.reviewedBy.name}`}
                </p>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
