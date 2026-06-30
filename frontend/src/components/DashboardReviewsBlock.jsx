import React, { useEffect, useRef, useState } from "react";
import API from "../api/api";
import { getStoredUser } from "../utils/auth";
import { StarPicker, StarDisplay } from "./StarRating";
import ReviewCard, { canDeleteReview } from "./ReviewCard";
import Pagination from "./Pagination";
import { paginateItems, REVIEW_PAGE_SIZE } from "../utils/pagination";
import { ACADEMY_CLASSES } from "../utils/academyClasses";

function keepScrollPosition(update) {
  const scrollY = window.scrollY;
  update();
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  });
}

export default function DashboardReviewsBlock() {
  const storedUser = getStoredUser();
  const defaultClass = ACADEMY_CLASSES.includes(storedUser?.className)
    ? storedUser.className
    : "10th";

  const formRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [filterClass, setFilterClass] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState(null);
  const [lastSubmitted, setLastSubmitted] = useState(null);
  const [form, setForm] = useState({
    name: storedUser?.name || "",
    className: defaultClass,
    rating: 0,
    opinion: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    try {
      const params = filterClass !== "all" ? { className: filterClass } : {};
      const { data } = await API.get("/reviews", { params });
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    keepScrollPosition(() => setReviewPage(1));
    fetchReviews();
  }, [filterClass]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(false), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!highlightId) return undefined;
    const timer = setTimeout(() => setHighlightId(null), 4000);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const reviewPagination = paginateItems(reviews, reviewPage, REVIEW_PAGE_SIZE);

  const handlePageChange = (page) => {
    keepScrollPosition(() => setReviewPage(page));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    setDeletingId(id);
    try {
      await API.delete(`/reviews/${id}`);
      const nextReviews = reviews.filter((r) => r._id !== id);
      const nextPagination = paginateItems(nextReviews, reviewPage, REVIEW_PAGE_SIZE);
      keepScrollPosition(() => {
        if (nextPagination.pageItems.length === 0 && reviewPage > 1) {
          setReviewPage(reviewPage - 1);
        }
        setReviews(nextReviews);
      });
      if (highlightId === id) setHighlightId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!form.rating) return setError("Please select a star rating.");
    if (!form.opinion.trim()) return setError("Please share your opinion.");

    setSubmitting(true);
    try {
      const payload = { ...form };
      const { data } = await API.post("/reviews", payload);
      setLastSubmitted({ ...data, rating: payload.rating });
      setReviews((prev) => [data, ...prev]);
      keepScrollPosition(() => setReviewPage(1));
      setHighlightId(data._id);
      setForm((prev) => ({ ...prev, rating: 0, opinion: "" }));
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-reviews-block">
      <div className="dash-section-head">
        <div>
          <h2>⭐ Rate & Share Your Opinion</h2>
          <p>All students (Class 9th to 12th) can rate Apex Academy here.</p>
        </div>
        <select
          className="student-reviews-filter"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          aria-label="Filter reviews by class"
        >
          <option value="all">All Classes</option>
          {ACADEMY_CLASSES.map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
      </div>

      <div className="dash-reviews-grid">
        <form className="dash-review-form" ref={formRef} onSubmit={handleSubmit} noValidate>
          {success && lastSubmitted && (
            <div className="review-success-banner" role="status">
              <span className="review-success-icon">🎉</span>
              <div className="review-success-text">
                <strong>Thank you, {lastSubmitted.name.split(" ")[0]}!</strong>
                <p>Your <StarDisplay rating={lastSubmitted.rating} /> review is now live.</p>
              </div>
            </div>
          )}
          {error && <div className="junior-review-alert error">{error}</div>}

          <div className="junior-form-row">
            <div className="junior-form-field">
              <label htmlFor="dash-rev-name">Your Name</label>
              <input
                id="dash-rev-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="junior-form-field">
              <label htmlFor="dash-rev-class">Class</label>
              <select
                id="dash-rev-class"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
              >
                {ACADEMY_CLASSES.map((c) => (
                  <option key={c} value={c}>{c} Standard</option>
                ))}
              </select>
            </div>
          </div>

          <div className="junior-form-field">
            <label>Your Rating</label>
            <StarPicker value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          </div>

          <div className="junior-form-field">
            <label htmlFor="dash-rev-opinion">Your Opinion</label>
            <textarea
              id="dash-rev-opinion"
              rows={3}
              value={form.opinion}
              onChange={(e) => setForm({ ...form, opinion: e.target.value })}
              placeholder="Share your experience..."
              maxLength={500}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary review-submit-btn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        <div className="dash-reviews-list-wrap">
          <h3>What Students Say ({reviews.length})</h3>
          {loading ? (
            <p className="junior-reviews-empty">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="junior-reviews-empty">No reviews yet. Be the first to share!</p>
          ) : (
            <div className="junior-reviews-list-body">
              <p className="reviews-per-page-note">3 reviews per page</p>
              <div className="dash-reviews-list reviews-paged-list">
                {reviewPagination.pageItems.map((r) => (
                  <ReviewCard
                    key={r._id}
                    review={r}
                    variant="compact"
                    highlight={highlightId === r._id}
                    canDelete={canDeleteReview(r, storedUser)}
                    deleting={deletingId === r._id}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              <Pagination
                page={reviewPagination.page}
                totalPages={reviewPagination.totalPages}
                total={reviewPagination.total}
                rangeStart={reviewPagination.rangeStart}
                rangeEnd={reviewPagination.rangeEnd}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
