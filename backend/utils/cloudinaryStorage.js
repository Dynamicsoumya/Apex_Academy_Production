const path = require("path");
const { configureCloudinary, isCloudinaryEnabled } = require("../config/cloudinary");

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"];
const VIDEO_EXT = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const DOCUMENT_EXT = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

function isCloudinaryUrl(fileUrl) {
  return Boolean(fileUrl?.includes("res.cloudinary.com"));
}

function isMediaFile(file) {
  if (!file) return false;
  const mimetype = file.mimetype || "";
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (mimetype.startsWith("image/") || mimetype.startsWith("video/")) return true;
  return IMAGE_EXT.includes(ext) || VIDEO_EXT.includes(ext);
}

function isDocumentFile(file) {
  if (!file) return false;
  const mimetype = file.mimetype || "";
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (mimetype === "application/pdf" || mimetype.includes("document") || mimetype.includes("presentation")) {
    return true;
  }
  return DOCUMENT_EXT.includes(ext);
}

function resourceTypeForUpload(folder, file) {
  const mimetype = file.mimetype || "";
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (folder === "videos" || mimetype.startsWith("video/") || VIDEO_EXT.includes(ext)) {
    return "video";
  }
  if (folder === "images" || mimetype.startsWith("image/") || IMAGE_EXT.includes(ext)) {
    return "image";
  }
  return "raw";
}

function publicIdFromUrl(fileUrl) {
  if (!isCloudinaryUrl(fileUrl)) return null;

  try {
    const parsed = new URL(fileUrl);
    const parts = parsed.pathname.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    let start = uploadIndex + 1;
    if (parts[start]?.startsWith("v") && /^v\d+$/.test(parts[start])) {
      start += 1;
    }

    const idParts = parts.slice(start);
    const last = idParts[idParts.length - 1] || "";
    idParts[idParts.length - 1] = last.replace(/\.[^.]+$/, "");

    return decodeURIComponent(idParts.join("/"));
  } catch {
    return null;
  }
}

function resourceTypeFromUrl(fileUrl) {
  if (fileUrl.includes("/video/upload/")) return "video";
  if (fileUrl.includes("/raw/upload/")) return "raw";
  return "image";
}

function uploadBuffer(file, folder) {
  const cld = configureCloudinary();
  if (!cld) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_URL in backend/.env");
  }

  const resourceType = resourceTypeForUpload(folder, file);
  const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname || "").toLowerCase();

  return new Promise((resolve, reject) => {
    const options = {
      folder: `apex-academy/${folder}`,
      public_id: baseName,
      resource_type: resourceType,
    };

    if (resourceType === "raw" && ext) {
      options.format = ext.replace(".", "");
    }

    const upload = cld.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });

    upload.end(file.buffer);
  });
}

async function deleteFromCloudinary(fileUrl) {
  if (!isCloudinaryUrl(fileUrl) || !isCloudinaryEnabled()) return;

  const publicId = publicIdFromUrl(fileUrl);
  if (!publicId) {
    console.warn("[cloudinary] Could not parse public id from URL:", fileUrl);
    return;
  }

  const cld = configureCloudinary();
  if (!cld) return;

  try {
    const result = await cld.uploader.destroy(publicId, {
      resource_type: resourceTypeFromUrl(fileUrl),
    });
    if (result.result !== "ok" && result.result !== "not found") {
      console.warn("[cloudinary] Unexpected delete result:", result.result, publicId);
    }
  } catch (err) {
    const msg = err?.error?.message || err?.message || "Cloudinary delete failed";
    console.warn("[cloudinary] Delete failed (DB record will still be removed):", msg, publicId);
  }
}

module.exports = {
  isCloudinaryEnabled,
  isCloudinaryUrl,
  isMediaFile,
  isDocumentFile,
  uploadBuffer,
  deleteFromCloudinary,
};
