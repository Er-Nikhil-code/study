export const mockTests = [
  {
    id: "jee-mock-01",
    title: "JEE Physics Diagnostic",
    subject: "Physics",
    durationMinutes: 90,
    questions: 45,
    status: "live" as const,
  },
  {
    id: "neet-bio-02",
    title: "NEET Biology Practice",
    subject: "Biology",
    durationMinutes: 60,
    questions: 40,
    status: "upcoming" as const,
  },
  {
    id: "aptitude-03",
    title: "Quant Aptitude Sprint",
    subject: "Quantitative Aptitude",
    durationMinutes: 45,
    questions: 30,
    status: "completed" as const,
  },
];

export const mockLeaderboard = [
  { rank: 1, name: "Aarav Sharma", score: 982, accuracy: 98, streak: 21 },
  { rank: 2, name: "Diya Mehta", score: 961, accuracy: 97, streak: 18 },
  { rank: 3, name: "Kabir Singh", score: 944, accuracy: 95, streak: 16 },
  { rank: 4, name: "Nikhil Verma", score: 922, accuracy: 94, streak: 12 },
  { rank: 5, name: "Ishita Rao", score: 910, accuracy: 93, streak: 10 },
];
