import { api } from "@/lib/api";

/* ─── Types ─── */

export interface StudentDashboard {
  current_streak: number;
  longest_streak: number;
  total_tests: number;
  total_score: number;
  best_score: number;
  avg_accuracy: number;
  global_rank: number;
  first_attempts: number;
  reattempts: number;
  tests_today: number;
  has_activity_today: boolean;
  recent_tests: {
    attempt_id: string;
    test_id: string;
    test_title: string;
    score: number | null;
    max_score: number | null;
    submitted_at: string;
    attempt_no: number;
    practice_mode: boolean;
  }[];
  weak_topics: {
    topic_id: string;
    topic_name: string;
    chapter: string;
    subject: string;
    wrong_count: number;
  }[];
  enrolled_courses?: {
    id: string;
    name: string;
    total_topics: number;
    completed_topics: number;
    progress_percentage: number;
  }[];
  activity_graph?: { date: string; count: number; details?: { type: string; count: number }[] }[];
  marks_history?: {
    attempt_id: string;
    test_title: string;
    score: number;
    max_score: number;
    percentage: number;
    submitted_at: string;
    attempt_no: number;
    course_id?: string;
    course_name?: string;
  }[];
}

export interface TestListItem {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  status: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  _count: { test_questions: number; attempts: number };
}

export interface AttemptStart {
  attempt: {
    id: string;
    user_id: string;
    test_id: string;
    attempt_no: number;
    status: string;
    started_at: string;
    practice_mode: boolean;
  };
  questions: AttemptQuestion[];
  responses: SavedResponse[];
  duration_minutes: number;
  resumed: boolean;
}

export interface AttemptQuestion {
  test_question_id: string;
  order: number;
  section: number;
  id: string;
  question_type: string;
  content_json: any[];
  options_json: any;
  difficulty: string;
  marks: number;
  negative_marks: number;
  topic_id: string;
}

export interface SavedResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_json: any;
  marked_for_review: boolean;
  time_on_question: number | null;
}

export interface SubmitResult {
  id: string;
  score: number;
  max_score: number;
  correct: number;
  wrong: number;
  skipped: number;
  total_questions: number;
  time_taken_sec: number;
}

export interface ResultItem {
  attempt_id: string;
  test_id: string;
  test_title: string;
  total_marks: number;
  score: number | null;
  max_score: number | null;
  percentile: number | null;
  rank: number | null;
  attempt_no: number;
  practice_mode: boolean;
  submitted_at: string;
  time_taken_sec: number | null;
  questions_answered: number;
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  name: string;
  total_score: number;
  tests: number;
  accuracy: number;
  streak: number;
}

export interface TeacherDashboard {
  questions_created: number;
  questions_approved: number;
  tests_created: number;
  pending_challenges: number;
  resolved_challenges: number;
  students_assigned: number;
  recent_challenges: any[];
  recent_reviews: any[];
  activity_graph?: { date: string; count: number; details?: { type: string; count: number }[] }[];
}

export interface InternDashboard {
  total_created: number;
  total_approved: number;
  total_rejected: number;
  total_pending: number;
  total_needs_revision: number;
  approval_rate: number;
  current_streak: number;
  total_points: number;
  global_rank: number;
  recent_questions: {
    id: string;
    content_json?: any[];
    approval_status: string;
    question_type: string;
    difficulty: string;
    created_at: string;
    updated_at: string;
    topic: { name: string; chapter: { name: string; section?: { course?: { name: string } } } };
  }[];
  activity_graph?: { date: string; count: number; details?: { type: string; count: number }[] }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

/* ─── Service ─── */

class StudentApiService {
  /* Dashboard */
  async getDashboard(): Promise<StudentDashboard> {
    const res = await api.get<StudentDashboard>("/student/dashboard");
    return res.data;
  }

  /* Tests (public) */
  async getTests(params?: {
    topic_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<TestListItem>> {
    const res = await api.get<PaginatedResponse<TestListItem>>("/tests", {
      params,
    });
    return res.data;
  }

  async getTestDetails(testId: string): Promise<any> {
    const res = await api.get(`/tests/${testId}`);
    return res.data;
  }

  async getTestLeaderboard(testId: string): Promise<{ leaderboard: any[]; currentUserRank: number | null; total_participants: number }> {
    const res = await api.get(`/tests/${testId}/leaderboard`);
    return res.data;
  }

  /* Attempt flow */
  async startAttempt(testId: string): Promise<AttemptStart> {
    const res = await api.post<AttemptStart>(`/tests/${testId}/start`);
    return res.data;
  }

  async saveAnswer(
    testId: string,
    attemptId: string,
    data: {
      test_question_id: string;
      question_id: string;
      topic_id: string;
      answer_json: any;
      time_on_question?: number;
      marked_for_review?: boolean;
    },
  ): Promise<any> {
    const res = await api.post(
      `/tests/${testId}/attempt/${attemptId}/answer`,
      data,
    );
    return res.data;
  }

  async submitAttempt(
    testId: string,
    attemptId: string,
  ): Promise<SubmitResult> {
    const res = await api.post<SubmitResult>(
      `/tests/${testId}/attempt/${attemptId}/submit`,
    );
    return res.data;
  }

  async getAttemptResult(testId: string, attemptId: string): Promise<any> {
    const res = await api.get(
      `/tests/${testId}/attempt/${attemptId}/result`,
    );
    return res.data;
  }

  /* Results */
  async getResults(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ResultItem>> {
    const res = await api.get<PaginatedResponse<ResultItem>>(
      "/student/results",
      { params },
    );
    return res.data;
  }

  /* Leaderboard */
  async getLeaderboard(
    period: "weekly" | "monthly" | "global" = "weekly",
    courseId?: string
  ): Promise<{ period: string; data: LeaderboardRow[] }> {
    const res = await api.get("/student/leaderboard", {
      params: { period, ...(courseId && { course_id: courseId }) },
    });
    return res.data;
  }

  /* Test series */
  async getTestSeries(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const res = await api.get("/student/test-series", { params });
    return res.data;
  }

  /* Teacher dashboard */
  async getTeacherDashboard(): Promise<TeacherDashboard> {
    const res = await api.get<TeacherDashboard>("/student/teacher/dashboard");
    return res.data;
  }

  /* Intern dashboard */
  async getInternDashboard(): Promise<InternDashboard> {
    const res = await api.get<InternDashboard>("/student/intern/dashboard");
    return res.data;
  }

  /* Challenge */
  async submitChallenge(data: {
    response_id?: string;
    question_id?: string;
    note_id?: string;
    reason: string;
    description: string;
  }): Promise<any> {
    const res = await api.post("/challenges", data);
    return res.data;
  }

  async getMyChallenges(): Promise<any[]> {
    const res = await api.get("/challenges/mine");
    return res.data;
  }

  async withdrawChallenge(challengeId: string): Promise<any> {
    const res = await api.delete(`/challenges/withdraw/${challengeId}`);
    return res.data;
  }
}

export const studentService = new StudentApiService();
export default studentService;
