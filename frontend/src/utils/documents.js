export function isPdfDoc(doc) {
  return !doc.materialType || doc.materialType === "pdf";
}

export function isLectureDoc(doc) {
  return doc.materialType === "lecture";
}
