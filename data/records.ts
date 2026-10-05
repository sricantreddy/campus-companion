export const DATASET_VERSION = "northbridge-2026.1";
export const records = {
  student: {
    id: "demo-001",
    name: "Maya Rao",
    program: "BSc Computer Science",
    semester: 3,
  },
  asOf: "2026-10-05",
  attendance: [
    {
      code: "CS201",
      name: "Data structures",
      attended: 26,
      held: 36,
      remaining: 24,
      threshold: 75,
    },
    {
      code: "CS202",
      name: "Database systems",
      attended: 30,
      held: 36,
      remaining: 24,
      threshold: 75,
    },
    {
      code: "MA201",
      name: "Discrete mathematics",
      attended: 23,
      held: 32,
      remaining: 28,
      threshold: 75,
    },
  ],
  deadlines: [
    {
      id: "D1",
      course: "CS201",
      title: "Graph algorithms assignment",
      due: "2026-10-09T17:00:00+05:30",
    },
    {
      id: "D2",
      course: "CS202",
      title: "Library database project",
      due: "2026-10-14T17:00:00+05:30",
    },
    {
      id: "D3",
      course: "MA201",
      title: "Proof portfolio",
      due: "2026-10-19T17:00:00+05:30",
    },
  ],
  team: {
    project: "Library database project",
    members: ["Maya Rao", "Aarav Shah", "Leah Thomas", "Ishan Mehta"],
    supervisor: "Dr. Elena Park",
  },
  calendar: {
    nextSemester: "2027-01-11",
    registration: "2026-12-14",
    teachingWeeks: 16,
  },
  nextCourses: [
    "Operating systems",
    "Computer networks",
    "Software engineering",
    "Probability",
  ],
  support: {
    email: "support@northbridge.example",
    hours: "Monday to Friday, 09:00–17:00 IST",
  },
} as const;
