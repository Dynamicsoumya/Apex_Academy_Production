const SUBJECT_MAP = {
  math: { icon: "/icons/math.svg", label: "Mathematics", color: "#1e40af" },
  maths: { icon: "/icons/math.svg", label: "Mathematics", color: "#1e40af" },
  mathematics: { icon: "/icons/math.svg", label: "Mathematics", color: "#1e40af" },
  science: { icon: "/icons/science.svg", label: "Science", color: "#0ea5e9" },
  physics: { icon: "/icons/science.svg", label: "Physics", color: "#0ea5e9" },
  biology: { icon: "/icons/biology.svg", label: "Biology", color: "#059669" },
  bio: { icon: "/icons/biology.svg", label: "Biology", color: "#059669" },
  chemistry: { icon: "/icons/chemistry.svg", label: "Chemistry", color: "#7c3aed" },
  chem: { icon: "/icons/chemistry.svg", label: "Chemistry", color: "#7c3aed" },
  mil: { icon: "/icons/biology.svg", label: "MIL", color: "#7c3aed" },
  english: { icon: "/icons/biology.svg", label: "English", color: "#059669" },
  "general science": { icon: "/icons/science.svg", label: "General Science", color: "#0ea5e9" },
  "social science": { icon: "/icons/chemistry.svg", label: "Social Science", color: "#b45309" },
  accountancy: { icon: "/icons/math.svg", label: "Accountancy", color: "#b45309" },
  economics: { icon: "/icons/chemistry.svg", label: "Economics", color: "#dc2626" },
  history: { icon: "/icons/chemistry.svg", label: "History", color: "#92400e" },
  "political science": { icon: "/icons/chemistry.svg", label: "Political Science", color: "#b45309" },
  polsci: { icon: "/icons/chemistry.svg", label: "Political Science", color: "#b45309" },
};

const DEFAULT = { icon: "/icons/science.svg", label: "Subject", color: "#1e40af" };

export function getSubjectInfo(name = "") {
  const key = name.toLowerCase().trim();
  if (SUBJECT_MAP[key]) return SUBJECT_MAP[key];
  for (const [k, v] of Object.entries(SUBJECT_MAP)) {
    if (key.includes(k)) return v;
  }
  return { ...DEFAULT, label: name || "Subject" };
}

export const CORE_SUBJECTS = [
  {
    key: "math",
    title: "Mathematics",
    desc: "Algebra, Calculus, Trigonometry & more — build strong problem-solving skills for boards & JEE.",
    icon: "/icons/math.svg",
    color: "#1e40af",
  },
  {
    key: "science",
    title: "Physics",
    desc: "Mechanics, Optics, Electricity — concept clarity with real-world applications & numerical practice.",
    icon: "/icons/science.svg",
    color: "#0ea5e9",
  },
  {
    key: "chemistry",
    title: "Chemistry",
    desc: "Organic, Inorganic & Physical Chemistry — master reactions, formulas & board exam patterns.",
    icon: "/icons/chemistry.svg",
    color: "#7c3aed",
  },
  {
    key: "biology",
    title: "Biology",
    desc: "Botany, Zoology & Human Physiology — ideal for PCB stream & NEET preparation.",
    icon: "/icons/biology.svg",
    color: "#059669",
  },
];

export default function SubjectIcon({ subject, size = "md", showLabel = false, className = "" }) {
  const info = getSubjectInfo(subject);
  const sizeClass = `subject-icon subject-icon-${size}`;

  return (
    <div className={`subject-icon-wrap ${className}`} style={{ "--subject-color": info.color }}>
      <img
        src={info.icon}
        alt={info.label}
        className={sizeClass}
        loading="lazy"
      />
      {showLabel && <span className="subject-icon-label">{info.label}</span>}
    </div>
  );
}
