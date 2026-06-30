import React, { useState } from "react";
import { mediaUrl } from "../utils/mediaUrl";

export function AdminPhoto({ url, label, size = "md", onZoom }) {
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(url);

  if (!src || failed) {
    return (
      <div className={`adm-photo-frame adm-photo-${size} adm-photo-missing`}>
        <span>📷</span>
        <small>{label}</small>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`adm-photo-frame adm-photo-${size} adm-photo-btn`}
      onClick={() => onZoom?.({ src, label })}
      title={`View ${label}`}
    >
      <img src={src} alt={label} onError={() => setFailed(true)} />
      <span className="adm-photo-zoom-hint">🔍 View</span>
    </button>
  );
}

export function PhotoLightbox({ photo, onClose }) {
  if (!photo) return null;

  return (
    <div className="adm-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <div className="adm-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="adm-lightbox-close" onClick={onClose}>✕</button>
        <p className="adm-lightbox-label">{photo.label}</p>
        <img src={photo.src} alt={photo.label} />
        <a href={photo.src} target="_blank" rel="noreferrer" className="btn btn-outline">
          Open full size
        </a>
      </div>
    </div>
  );
}
