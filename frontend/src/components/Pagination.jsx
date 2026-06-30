import React from "react";

export default function Pagination({ page, totalPages, total, rangeStart, rangeEnd, onPageChange }) {
  if (total <= 0) return null;

  const showNav = totalPages > 1;

  return (
    <div className="list-pagination">
      <button
        type="button"
        className="list-pagination-btn"
        disabled={!showNav || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Previous
      </button>

      <div className="list-pagination-info">
        <strong>Page {page} of {totalPages}</strong>
        <span>
          {showNav
            ? `Showing ${rangeStart}–${rangeEnd} of ${total}`
            : `Showing all ${total} item${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      <button
        type="button"
        className="list-pagination-btn"
        disabled={!showNav || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}
