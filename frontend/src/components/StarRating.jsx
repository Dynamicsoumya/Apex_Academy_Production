import React, { useState } from "react";

export function StarPicker({ value, onChange, id = "rating" }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="junior-star-picker" role="group" aria-label="Rate your experience" id={id}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`junior-star-btn ${star <= (hover || value) ? "active" : ""}`}
          onClick={() => onChange(star)}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
      <span className="junior-star-label">{value ? `${value} / 5` : "Tap to rate"}</span>
    </div>
  );
}

export function StarDisplay({ rating, showScore = true, size = "md" }) {
  const stars = Math.min(5, Math.max(0, Math.round(Number(rating)) || 0));
  if (!stars) return null;

  return (
    <span
      className={`junior-stars-wrap junior-stars-wrap--${size}`}
      aria-label={`${stars} out of 5 stars`}
    >
      <span className="junior-stars-display" aria-hidden="true">
        {"★".repeat(stars)}
        <span className="junior-stars-dim">{"★".repeat(5 - stars)}</span>
      </span>
      {showScore && <span className="junior-stars-score">{stars}/5</span>}
    </span>
  );
}
