import React from "react";
import { StarDisplay } from "./StarRating";

export function canDeleteReview(review, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!review.userId || !user._id) return false;
  return String(review.userId) === String(user._id);
}

export default function ReviewCard({
  review,
  highlight = false,
  canDelete = false,
  deleting = false,
  onDelete,
  variant = "testimonial",
}) {
  if (variant === "compact") {
    return (
      <article
        className={`junior-review-card ${highlight ? "junior-review-card--new" : ""}`}
      >
        {highlight && <span className="review-new-badge">Just added ✨</span>}
        <div className="junior-review-head">
          <div className="junior-review-avatar">{review.name[0]}</div>
          <div className="junior-review-meta">
            <strong>{review.name}</strong>
            <span className="junior-review-class">Class {review.className}</span>
            <StarDisplay rating={review.rating} showScore size="lg" />
          </div>
          {canDelete && (
            <button
              type="button"
              className="review-delete-btn"
              onClick={() => onDelete(review._id)}
              disabled={deleting}
              aria-label="Delete review"
              title="Delete this review"
            >
              {deleting ? "..." : "🗑"}
            </button>
          )}
        </div>
        <p>&ldquo;{review.opinion}&rdquo;</p>
      </article>
    );
  }

  return (
    <article
      className={`testimonial-card student-review-card ${highlight ? "student-review-card--new" : ""}`}
    >
      {highlight && <span className="review-new-badge">Just added ✨</span>}
      <div className="student-review-stars">
        <StarDisplay rating={review.rating} showScore size="lg" />
      </div>
      <p className="testimonial-text">&ldquo;{review.opinion}&rdquo;</p>
      <div className="testimonial-author">
        <div className="testimonial-avatar">{review.name[0]}</div>
        <div className="testimonial-author-info">
          <strong>{review.name}</strong>
          <span>Class {review.className}</span>
        </div>
        {canDelete && (
          <button
            type="button"
            className="review-delete-btn"
            onClick={() => onDelete(review._id)}
            disabled={deleting}
            aria-label="Delete review"
            title="Delete this review"
          >
            {deleting ? "..." : "🗑"}
          </button>
        )}
      </div>
    </article>
  );
}
