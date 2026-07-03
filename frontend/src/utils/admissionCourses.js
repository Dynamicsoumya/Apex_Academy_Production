import { BATCH_PROGRAMS } from "./academyClasses";

export const ADMISSION_COURSES = BATCH_PROGRAMS.flatMap((program) =>
  program.classes.map((className) => ({
    id: `${program.id}-${className}`,
    label: `${program.title} — Class ${className}`,
    className,
    stream: program.stream,
    program: program.title,
    timing: program.timing,
    icon: program.icon,
  }))
);

export function courseLabel(className, stream, course) {
  const match = ADMISSION_COURSES.find(
    (c) => c.className === className && c.stream === stream && c.program === course
  );
  return match?.label || `${course} — Class ${className}`;
}

export const PAYMENT_STATUS_LABELS = {
  pending: "Payment pending",
  paid: "Paid",
  offline_pending: "Pay via UPI / at center",
  proof_submitted: "Screenshot submitted — admin verifying",
  offline_verified: "Payment verified",
  failed: "Payment failed",
};

export const APPLICATION_STATUS_LABELS = {
  submitted: "Pending",
  under_review: "Under review",
  approved: "Admission complete",
  rejected: "Rejected",
};
