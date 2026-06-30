export const ACADEMY_CLASSES = ["9th", "10th", "11th", "12th"];
export const JUNIOR_CLASSES = ["9th", "10th"];
export const SENIOR_CLASSES = ["11th", "12th"];

export const JUNIOR_BATCH_TIMING = "5:00 PM – 8:00 PM";
export const SENIOR_ARTS_TIMING = "3:00 PM – 5:00 PM";
export const SENIOR_SCIENCE_TIMING = "7:00 AM – 10:00 AM";

export const JUNIOR_SUBJECTS = [
  { key: "math", title: "Mathematics", desc: "Algebra, geometry & board exam practice", icon: "➗", color: "#1e40af" },
  { key: "gensci", title: "General Science", desc: "Physics, chemistry & biology basics", icon: "🔬", color: "#0ea5e9" },
  { key: "socsci", title: "Social Science", desc: "History, geography & civics", icon: "🌍", color: "#b45309" },
  { key: "mil", title: "MIL", desc: "Mother tongue & literature (Odia)", icon: "📖", color: "#7c3aed" },
  { key: "english", title: "English", desc: "Grammar, writing & comprehension", icon: "✍️", color: "#059669" },
];

export const SENIOR_ARTS_SUBJECTS = [
  { key: "polsci", title: "Political Science", desc: "Democracy, constitution & governance", icon: "🏛️", color: "#b45309" },
  { key: "economics", title: "Economics", desc: "Indian economy & development concepts", icon: "📈", color: "#dc2626" },
  { key: "history", title: "History", desc: "Modern Indian history & national movement", icon: "📜", color: "#92400e" },
  { key: "mil", title: "MIL", desc: "Mother tongue & literature (Odia)", icon: "📖", color: "#7c3aed" },
  { key: "english", title: "English", desc: "Grammar, writing & comprehension", icon: "✍️", color: "#059669" },
];

export const SENIOR_SCIENCE_SUBJECTS = [
  { key: "physics", title: "Physics", desc: "Mechanics, optics & numericals", icon: "⚛️", color: "#0ea5e9" },
  { key: "chemistry", title: "Chemistry", desc: "Organic, inorganic & physical chemistry", icon: "🧪", color: "#7c3aed" },
  { key: "biology", title: "Biology", desc: "Botany, zoology & NEET focus", icon: "🧬", color: "#059669" },
  { key: "math", title: "Mathematics", desc: "Calculus, algebra & JEE practice", icon: "➗", color: "#1e40af" },
  { key: "english", title: "English", desc: "Grammar, writing & comprehension", icon: "✍️", color: "#059669" },
  { key: "mil", title: "MIL", desc: "Mother tongue & literature (Odia)", icon: "📖", color: "#7c3aed" },
];

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const HOLIDAY_BATCH_OPTIONS = [
  { id: "all", label: "All Batches" },
  { id: "junior", label: "9th & 10th Evening" },
  { id: "senior-science", label: "+2 Science Morning" },
  { id: "senior-arts", label: "+2 Arts Afternoon" },
];

export const BATCH_PROGRAMS = [
  {
    id: "junior",
    eyebrow: "CLASS 9TH & 10TH",
    title: "Evening Batch",
    timing: JUNIOR_BATCH_TIMING,
    stream: "School",
    streamLabel: "School Board",
    icon: "🌙",
    theme: "evening",
    classes: JUNIOR_CLASSES,
    subjects: JUNIOR_SUBJECTS,
    coursesLink: "/courses?stream=School&className=9th",
  },
  {
    id: "senior-science",
    eyebrow: "+2 · CLASS 11TH & 12TH",
    title: "Morning Science Batch",
    timing: SENIOR_SCIENCE_TIMING,
    stream: "Science",
    streamLabel: "Science (PCM/PCB)",
    icon: "🌅",
    theme: "morning",
    classes: SENIOR_CLASSES,
    subjects: SENIOR_SCIENCE_SUBJECTS,
    coursesLink: "/courses?stream=Science&className=11th",
  },
  {
    id: "senior-arts",
    eyebrow: "+2 · CLASS 11TH & 12TH",
    title: "Afternoon Arts Batch",
    timing: SENIOR_ARTS_TIMING,
    stream: "Arts",
    streamLabel: "Arts",
    icon: "🎨",
    theme: "afternoon",
    classes: SENIOR_CLASSES,
    subjects: SENIOR_ARTS_SUBJECTS,
    coursesLink: "/courses?stream=Arts&className=11th",
  },
];

function buildProgramCourses(classes, subjects, stream, timing) {
  return classes.flatMap((className) =>
    subjects.map((s) => ({
      _id: `${stream.toLowerCase()}-${className}-${s.key}`,
      title: `${s.title} — Class ${className}`,
      description: s.desc,
      className,
      stream,
      duration: `${timing} · Mon–Sat`,
      subject: s.title,
      isStatic: true,
    }))
  );
}

export const JUNIOR_COURSES = buildProgramCourses(JUNIOR_CLASSES, JUNIOR_SUBJECTS, "School", JUNIOR_BATCH_TIMING);
export const SENIOR_ARTS_COURSES = buildProgramCourses(SENIOR_CLASSES, SENIOR_ARTS_SUBJECTS, "Arts", SENIOR_ARTS_TIMING);
export const SENIOR_SCIENCE_COURSES = buildProgramCourses(SENIOR_CLASSES, SENIOR_SCIENCE_SUBJECTS, "Science", SENIOR_SCIENCE_TIMING);

/** @deprecated */
export const SCIENCE_SUBJECTS_JUNIOR = JUNIOR_SUBJECTS;

export function isJuniorClass(className) {
  return JUNIOR_CLASSES.includes(className);
}

export function isSeniorClass(className) {
  return SENIOR_CLASSES.includes(className);
}

export function subjectsForClass(className, stream) {
  if (isJuniorClass(className)) {
    return JUNIOR_SUBJECTS.map(({ key, title, color }) => ({ key, title, color }));
  }
  if (stream === "Arts") {
    return SENIOR_ARTS_SUBJECTS.map(({ key, title, color }) => ({ key, title, color }));
  }
  return SENIOR_SCIENCE_SUBJECTS.map(({ key, title, color }) => ({ key, title, color }));
}

export function defaultClassFilter(userClass) {
  return ACADEMY_CLASSES.includes(userClass) ? userClass : "10th";
}

function normalizeStream(stream) {
  if (stream === "School") return "School";
  if (stream === "Arts") return "Arts";
  return "Science";
}

export function staticCoursesForFilter(classFilter, streamFilter) {
  const stream = normalizeStream(streamFilter);
  if (streamFilter === "all") return [];

  if (stream === "School") {
    let list = JUNIOR_COURSES;
    if (classFilter !== "all") list = list.filter((c) => c.className === classFilter);
    return list;
  }

  if (stream === "Arts") {
    let list = SENIOR_ARTS_COURSES;
    if (classFilter !== "all") list = list.filter((c) => c.className === classFilter);
    return list;
  }

  if (stream === "Science") {
    let list = SENIOR_SCIENCE_COURSES;
    if (classFilter !== "all") list = list.filter((c) => c.className === classFilter);
    return list;
  }

  return [];
}

export function mergeProgramCourses(apiCourses, classFilter, streamFilter) {
  const stream = normalizeStream(streamFilter);
  const staticCourses = staticCoursesForFilter(classFilter, stream);
  if (!staticCourses.length) return [];

  const apiMatches = apiCourses.filter((c) => {
    if (c.stream !== stream && !(stream === "School" && c.stream === "Science")) return false;
    if (classFilter !== "all" && c.className !== classFilter) return false;
    if (stream === "School" && !isJuniorClass(c.className)) return false;
    if (stream === "Arts" && !isSeniorClass(c.className)) return false;
    if (stream === "Science" && !isSeniorClass(c.className)) return false;
    return true;
  });

  return staticCourses.map((staticCourse) => {
    const match = apiMatches.find((c) => {
      if (c.className !== staticCourse.className) return false;
      const hay = `${c.title} ${c.subject || ""}`.toLowerCase();
      return hay.includes(staticCourse.subject.toLowerCase());
    });
    return match || staticCourse;
  });
}

export function streamOptionsForClass(classFilter) {
  if (classFilter === "all") return ["all", "School", "Science", "Arts"];
  if (isJuniorClass(classFilter)) return ["all", "School"];
  return ["all", "Science", "Arts"];
}
