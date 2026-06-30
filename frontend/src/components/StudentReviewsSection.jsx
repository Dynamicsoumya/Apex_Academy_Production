import React, { useEffect, useState } from "react";
import API from "../api/api";
import { getStoredUser } from "../utils/auth";
import { StarPicker, StarDisplay } from "./StarRating";
import ReviewCard, { canDeleteReview } from "./ReviewCard";
import Pagination from "./Pagination";
import { paginateItems, REVIEW_PAGE_SIZE } from "../utils/pagination";

const ALL_CLASSES = ["9th", "10th", "11th", "12th"];

function keepScrollPosition(update) {
  const scrollY = window.scrollY;
  update();
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  });
}

export default function StudentReviewsSection() {
  const storedUser = getStoredUser();
  const defaultClass = ALL_CLASSES.includes(storedUser?.className)
    ? storedUser.className
    : "10th";

  const [reviews, setReviews] = useState([]);
  const [filterClass, setFilterClass] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(true);
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
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    setLoadingReviews(true);
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

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

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
    if (!form.opinion.trim()) return setError("Please share your experience.");

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
    <section className="section student-reviews-section" id="what-students-say">
      <div className="student-reviews-bg" aria-hidden="true" />
      <div className="section-header">
        <p className="section-eyebrow">SUCCESS STORIES</p>
        <h2>What Our Students Say</h2>
        <p className="section-sub">
          Real results from students who trusted Apex Academy
        </p>
      </div>

      <div className="student-reviews-hero-stats">
        {avgRating ? (
          <>
            <div className="student-reviews-score-ring">
              <strong>{avgRating}</strong>
              <span>out of 5</span>
            </div>
            <div className="student-reviews-score-detail">
              <StarDisplay rating={Math.round(Number(avgRating))} showScore={false} size="lg" />
              <p>
                Based on <strong>{reviews.length}</strong> student review
                {reviews.length !== 1 ? "s" : ""}
                {filterClass !== "all" ? ` · Class ${filterClass}` : ""}
              </p>
            </div>
          </>
        ) : (
          <div className="student-reviews-score-detail student-reviews-score-detail--empty">
            <span className="student-reviews-empty-icon">⭐</span>
            <p>Be the first student to share your rating and experience!</p>
          </div>
        )}
      </div>

      <div className="student-reviews-showcase">
        <div className="student-reviews-list-head">
          <h3>Student Reviews</h3>
          <select
            className="student-reviews-filter"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            aria-label="Filter reviews by class"
          >
            <option value="all">All Classes</option>
            {ALL_CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>

        {loadingReviews ? (
          <p className="junior-reviews-empty">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="junior-reviews-empty">
            No reviews yet. Scroll down to add your rating and help other students choose Apex Academy.
          </p>
        ) : (
          <div className="junior-reviews-list-body">
            <div className="testimonials-grid student-reviews-grid reviews-paged-list">
              {reviewPagination.pageItems.map((r) => (
                <ReviewCard
                  key={r._id}
                  review={r}
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

      <div className="student-review-form-wrap">
        <div className="junior-review-form-card student-review-form-cta">
          <div className="student-review-form-head">
            <span className="student-review-form-icon">✍️</span>
            <div>
              <h3>Share Your Rating & Experience</h3>
              <p>
                Class 9th to 12th students — rate teaching, faculty, and your batch. Your review helps
                new students trust Apex Academy.
              </p>
            </div>
          </div>

          {success && lastSubmitted && (
            <div className="review-success-banner" role="status">
              <span className="review-success-icon">🎉</span>
              <div className="review-success-text">
                <strong>Thank you, {lastSubmitted.name.split(" ")[0]}!</strong>
                <p>
                  Your <StarDisplay rating={lastSubmitted.rating} /> review is now live above.
                </p>
              </div>
            </div>
          )}

          {error && <div className="junior-review-alert error">{error}</div>}

          <form className="junior-review-form" onSubmit={handleSubmit} noValidate>
            <div className="junior-form-row">
              <div className="junior-form-field">
                <label htmlFor="rev-name">Your Name</label>
                <input
                  id="rev-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Student name"
                  required
                />
              </div>
              <div className="junior-form-field">
                <label htmlFor="rev-class">Class</label>
                <select
                  id="rev-class"
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                >
                  {ALL_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c} Standard
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="junior-form-field">
              <label>Your Star Rating</label>
              <StarPicker value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
            </div>

            <div className="junior-form-field">
              <label htmlFor="rev-opinion">Your Experience (description)</label>
              <textarea
                id="rev-opinion"
                rows={4}
                value={form.opinion}
                onChange={(e) => setForm({ ...form, opinion: e.target.value })}
                placeholder="How is Apex Academy helping you? Share your honest experience..."
                maxLength={500}
                required
              />
              <small>{form.opinion.length}/500</small>
            </div>

            <button type="submit" className="btn btn-primary review-submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit My Review →"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
