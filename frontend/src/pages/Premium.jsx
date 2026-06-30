import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import SubjectIcon from "../components/SubjectIcon";
import Pagination from "../components/Pagination";
import { getStoredUser, setAuth } from "../utils/auth";
import { mediaUrl } from "../utils/mediaUrl";
import { paginateItems } from "../utils/pagination";
import { startRazorpayCheckout } from "../utils/razorpay";
import { ACADEMY_CLASSES } from "../utils/academyClasses";
import { PREMIUM_COMING_SOON } from "../utils/features";

const TYPE_LABELS = { pdf: "PDF Notes", video: "Video Lecture", pyq: "PYQ Paper" };
const TYPE_ICONS = { pdf: "📄", video: "🎬", pyq: "📝" };

function PremiumPlayer({ item, access, onClose }) {
  return (
    <div className="lecture-modal" onClick={onClose}>
      <div className="lecture-modal-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lecture-close" onClick={onClose}>✕</button>
        <h3>{item.title}</h3>
        <p className="lecture-modal-sub">
          {item.subject} · Class {item.className}
          {item.examYear ? ` · ${item.examYear}` : ""}
        </p>
        <div className="lecture-player-box">
          {access.youtubeId ? (
            <iframe
              title={item.title}
              src={`https://www.youtube.com/embed/${access.youtubeId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : access.fileUrl ? (
            item.contentType === "video" ? (
              <video controls src={mediaUrl(access.fileUrl)} />
            ) : (
              <iframe title={item.title} src={mediaUrl(access.fileUrl)} className="premium-pdf-frame" />
            )
          ) : (
            <p>Content not available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Premium() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const [payingId, setPayingId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [activeAccess, setActiveAccess] = useState(null);
  const user = getStoredUser();

  const fetchItems = () =>
    API.get("/premium")
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!PREMIUM_COMING_SOON) fetchItems();
    else setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterClass !== "all" && item.className !== filterClass) return false;
      if (filterType !== "all" && item.contentType !== filterType) return false;
      return true;
    });
  }, [items, filterClass, filterType]);

  useEffect(() => {
    setPage(1);
  }, [filterClass, filterType]);

  const pagination = paginateItems(filtered, page);

  const refreshUser = async () => {
    const { data } = await API.get("/auth/me");
    const token = localStorage.getItem("token");
    setAuth({ ...data, token });
  };

  const handlePurchase = async (item) => {
    if (PREMIUM_COMING_SOON) return;
    if (!user) {
      alert("Please login or register first to purchase premium content.");
      return;
    }

    setPayingId(item._id);
    try {
      await startRazorpayCheckout({
        user,
        orderPayload: { premiumItemId: item._id },
        preferUpi: true,
        onSuccess: async () => {
          await refreshUser();
          await fetchItems();
        },
      });
      alert(`Payment successful! "${item.title}" is now unlocked.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg !== "Payment cancelled") alert(msg || "Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  const handleOpen = async (item) => {
    if (PREMIUM_COMING_SOON || item.locked) return;
    try {
      const { data } = await API.get(`/premium/${item._id}/access`);
      setActiveItem(item);
      setActiveAccess(data);
    } catch (err) {
      alert(err.response?.data?.message || "Could not open content");
    }
  };

  if (PREMIUM_COMING_SOON) {
    return (
      <div className="premium-page">
        <div className="page-banner premium-banner">
          <div className="page-banner-inner">
            <p className="section-eyebrow">PREMIUM CONTENT</p>
            <h1>Premium Study Material</h1>
            <p>Exclusive PDFs, video lectures, and PYQ papers — launching soon for Apex Academy students.</p>
          </div>
        </div>

        <div className="section premium-section">
          <div className="premium-coming-soon-card">
            <span className="premium-coming-soon-icon">👑</span>
            <h2>Coming Soon</h2>
            <p>
              Paid premium content with Google Pay, PhonePe, Paytm & UPI will be available shortly.
              Free study material is still on your student dashboard.
            </p>
            <div className="premium-coming-soon-actions">
              <Link to="/student" className="btn btn-primary btn-lg">Go to Student Dashboard</Link>
              <Link to="/questions" className="btn btn-outline btn-lg">Browse Free PYQ Papers</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page">
      {activeItem && activeAccess && (
        <PremiumPlayer
          item={activeItem}
          access={activeAccess}
          onClose={() => {
            setActiveItem(null);
            setActiveAccess(null);
          }}
        />
      )}

      <div className="page-banner premium-banner">
        <div className="page-banner-inner">
          <p className="section-eyebrow">PREMIUM CONTENT</p>
          <h1>Premium Study Material</h1>
          <p>
            Exclusive PDFs, video lectures, and PYQ papers. Browse everything — purchase to unlock full access.
          </p>
          {!user && (
            <div className="premium-banner-actions">
              <Link to="/login" className="btn btn-primary btn-lg">Login to Purchase</Link>
            </div>
          )}
        </div>
      </div>

      <div className="section premium-section">
        <div className="premium-pay-badges">
          <span>Secure payments via Razorpay</span>
          <div className="premium-upi-row">
            <span className="premium-upi-badge">Google Pay</span>
            <span className="premium-upi-badge">PhonePe</span>
            <span className="premium-upi-badge">Paytm</span>
            <span className="premium-upi-badge">UPI</span>
          </div>
        </div>

        <div className="questions-filters premium-filters">
          <div className="questions-filter">
            <label htmlFor="p-class">Class</label>
            <select id="p-class" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="all">All Classes</option>
              {ACADEMY_CLASSES.map((c) => (
                <option key={c} value={c}>{c} Standard</option>
              ))}
            </select>
          </div>
          <div className="questions-filter">
            <label htmlFor="p-type">Type</label>
            <select id="p-type" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="pdf">PDF Notes</option>
              <option value="video">Video Lectures</option>
              <option value="pyq">PYQ Papers</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="courses-loading">
            <span className="auth-spinner" />
            <p>Loading premium content...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <h3>No Premium Content Yet</h3>
            <p>Admin will add premium PDFs, videos, and question papers soon.</p>
          </div>
        ) : (
          <>
            <div className="premium-grid">
              {pagination.pageItems.map((item) => (
                <article className={`premium-card ${item.locked ? "premium-card--locked" : "premium-card--unlocked"}`} key={item._id}>
                  <div className="premium-card-top">
                    <span className="premium-type-badge">
                      {TYPE_ICONS[item.contentType]} {TYPE_LABELS[item.contentType]}
                    </span>
                    <span className="premium-price">₹{item.price}</span>
                  </div>

                  <div className="premium-card-body">
                    <div className="doc-subject-row">
                      <SubjectIcon subject={item.subject} size="xs" />
                      <span className="doc-subject-badge">{item.subject}</span>
                      <span className="doc-class-tag">Class {item.className}</span>
                    </div>
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    {item.examYear && <p className="premium-year">Exam Year: {item.examYear}</p>}
                  </div>

                  <div className="premium-card-footer">
                    {item.locked ? (
                      <>
                        <div className="premium-lock-msg">
                          <span className="premium-lock-icon">🔒</span>
                          <span>Purchase to unlock</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary premium-buy-btn"
                          disabled={payingId === item._id}
                          onClick={() => handlePurchase(item)}
                        >
                          {payingId === item._id ? "Processing..." : `Buy for ₹${item.price}`}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-primary premium-open-btn" onClick={() => handleOpen(item)}>
                        {item.contentType === "video" ? "▶ Watch Now" : "📄 Open Content"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
