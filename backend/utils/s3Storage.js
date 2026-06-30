const fs = require("fs");
const path = require("path");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getS3Client, isS3Enabled } = require("../config/s3");
const {
  isCloudinaryEnabled,
  isCloudinaryUrl,
  isMediaFile,
  uploadBuffer,
  deleteFromCloudinary,
} = require("./cloudinaryStorage");

const uploadsDir = path.join(__dirname, "..", "uploads");

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"];
const VIDEO_EXT = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];

function isMediaFolder(folder) {
  return folder === "videos" || folder === "images";
}

function isLocalMediaPath(fileUrl) {
  if (!fileUrl || fileUrl.startsWith("http")) return false;
  return /^\/uploads\/(videos|images)\//i.test(fileUrl) || /^\/uploads\/(videos|images)$/i.test(fileUrl);
}

function ensureLocalDir(subfolder) {
  const dir = path.join(uploadsDir, subfolder || "");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function buildLocalPath(folder, filename) {
  if (folder === "pyq") return `/uploads/pyq/${filename}`;
  return `/uploads/${filename}`;
}

function getPublicUrl(key) {
  const customBase = process.env.AWS_S3_PUBLIC_URL?.replace(/\/$/, "");
  if (customBase) return `${customBase}/${key}`;

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || "ap-south-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function keyFromUrl(fileUrl) {
  if (!fileUrl?.startsWith("http") || isCloudinaryUrl(fileUrl)) return null;

  try {
    const parsed = new URL(fileUrl);
    const host = parsed.hostname;
    const bucket = process.env.AWS_S3_BUCKET;

    if (host === `${bucket}.s3.amazonaws.com`) {
      return decodeURIComponent(parsed.pathname.slice(1));
    }

    const regional = host.match(/^(.+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i);
    if (regional && regional[1] === bucket) {
      return decodeURIComponent(parsed.pathname.slice(1));
    }

    const customBase = process.env.AWS_S3_PUBLIC_URL?.replace(/\/$/, "");
    if (customBase && fileUrl.startsWith(customBase)) {
      return decodeURIComponent(fileUrl.slice(customBase.length + 1));
    }

    return decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    return null;
  }
}

function folderForFile(materialType, mimetype = "", originalname = "") {
  const ext = path.extname(originalname).toLowerCase();

  if (mimetype.startsWith("image/") || IMAGE_EXT.includes(ext)) return "images";
  if (mimetype.startsWith("video/") || VIDEO_EXT.includes(ext)) return "videos";
  if (materialType === "lecture" || materialType === "video") return "videos";
  if (materialType === "pyq") return "pyq";

  return "pdfs";
}

function uniqueFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase() || "";
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

function resolveUploadFolder(file, folder) {
  if (isMediaFile(file) || isMediaFolder(folder)) {
    return folderForFile(null, file.mimetype, file.originalname);
  }
  return folder;
}

function assertCloudinaryUrl(fileUrl) {
  if (!fileUrl?.includes("res.cloudinary.com")) {
    throw new Error("Upload must be stored on Cloudinary. Check CLOUDINARY_URL in backend/.env");
  }
}

async function uploadFile(file, folder) {
  if (!file?.buffer) {
    throw new Error("No file buffer received. Check upload middleware.");
  }

  const targetFolder = resolveUploadFolder(file, folder);

  if (isCloudinaryEnabled()) {
    const fileUrl = await uploadBuffer(file, targetFolder);
    assertCloudinaryUrl(fileUrl);
    return fileUrl;
  }

  if (isMediaFile(file) || isMediaFolder(targetFolder)) {
    throw new Error(
      "Cloudinary is required for image and video uploads. Set CLOUDINARY_URL in backend/.env"
    );
  }

  const filename = uniqueFilename(file.originalname);
  const key = `${targetFolder}/${filename}`;

  if (isS3Enabled()) {
    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return getPublicUrl(key);
  }

  throw new Error(
    "Cloudinary is required for uploads. Set CLOUDINARY_URL in backend/.env (images, videos, PDFs & question papers)."
  );
}

async function deleteStoredFile(fileUrl) {
  if (!fileUrl) return;

  if (isCloudinaryUrl(fileUrl)) {
    await deleteFromCloudinary(fileUrl);
    return;
  }

  if (isLocalMediaPath(fileUrl)) {
    const filePath = path.join(__dirname, "..", fileUrl.replace(/^\//, ""));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return;
  }

  if (fileUrl.startsWith("http")) {
    if (!isS3Enabled()) return;
    const key = keyFromUrl(fileUrl);
    if (!key) return;

    const s3 = getS3Client();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      })
    );
    return;
  }

  const filePath = path.join(__dirname, "..", fileUrl.replace(/^\//, ""));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

module.exports = {
  isS3Enabled,
  isCloudinaryEnabled,
  isMediaFile,
  uploadFile,
  deleteStoredFile,
  folderForFile,
  getPublicUrl,
};
