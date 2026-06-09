import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private prisma: PrismaService) {}

  /* ════════════════════════════════════════════
   *  DASHBOARD STATS
   * ════════════════════════════════════════════ */

  async getDashboardStats(userId: string) {
    const [stats, recentAttempts, todayActivity, weakTopics] =
      await Promise.all([
        this.prisma.userStats.findUnique({ where: { user_id: userId } }),
        this.prisma.attempt.findMany({
          where: { user_id: userId, status: "SCORED" },
          orderBy: { submitted_at: "desc" },
          take: 10,
          include: {
            test: {
              select: { id: true, title: true, total_marks: true },
            },
          },
        }),
        this.prisma.dailyActivity.findFirst({
          where: {
            user_id: userId,
            activity_date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.getWeakTopics(userId),
      ]);

    // Get rank
    const rank = await this.getUserRank(userId);

    // First attempts vs reattempts
    const firstAttempts = await this.prisma.attempt.count({
      where: { user_id: userId, attempt_no: 1, status: "SCORED" },
    });
    const reattempts = await this.prisma.attempt.count({
      where: { user_id: userId, attempt_no: { gt: 1 }, status: "SCORED" },
    });

    // Tests completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const testsToday = await this.prisma.attempt.count({
      where: {
        user_id: userId,
        status: "SCORED",
        submitted_at: { gte: todayStart },
      },
    });

    return {
      current_streak: stats?.current_streak ?? 0,
      longest_streak: stats?.longest_streak ?? 0,
      total_tests: stats?.total_tests ?? 0,
      total_score: stats?.total_score ?? 0,
      best_score: stats?.best_score ?? 0,
      avg_accuracy: stats?.avg_accuracy ?? 0,
      global_rank: rank,
      first_attempts: firstAttempts,
      reattempts,
      tests_today: testsToday,
      has_activity_today: !!todayActivity,
      recent_tests: recentAttempts.map((a) => ({
        attempt_id: a.id,
        test_id: a.test.id,
        test_title: a.test.title,
        score: a.score,
        max_score: a.max_score,
        submitted_at: a.submitted_at,
        attempt_no: a.attempt_no,
        practice_mode: a.practice_mode,
      })),
      weak_topics: weakTopics,
    };
  }

  private async getUserRank(userId: string): Promise<number> {
    const stats = await this.prisma.userStats.findUnique({
      where: { user_id: userId },
    });
    if (!stats) return 0;

    const rank = await this.prisma.userStats.count({
      where: { total_score: { gt: stats.total_score } },
    });
    return rank + 1;
  }

  private async getWeakTopics(userId: string) {
    const responses = await this.prisma.response.findMany({
      where: {
        attempt: { user_id: userId },
        is_correct: false,
      },
      select: {
        topic: {
          select: {
            id: true,
            name: true,
            chapter: {
              select: {
                name: true,
                section: {
                  select: { course: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    // Count wrong answers per topic
    const topicCounts: Record<string, { topic: any; count: number }> = {};
    for (const r of responses) {
      const key = r.topic.id;
      if (!topicCounts[key]) {
        topicCounts[key] = { topic: r.topic, count: 0 };
      }
      topicCounts[key].count++;
    }

    return Object.values(topicCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((t) => ({
        topic_id: t.topic.id,
        topic_name: t.topic.name,
        chapter: t.topic.chapter.name,
        subject: t.topic.chapter.section?.course?.name || "Unknown Course",
        wrong_count: t.count,
      }));
  }

  /* ════════════════════════════════════════════
   *  RESULTS
   * ════════════════════════════════════════════ */

  async getResults(
    userId: string,
    params: { skip?: number; take?: number },
  ) {
    const { skip = 0, take = 20 } = params;

    const [attempts, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { user_id: userId, status: { in: ["SCORED", "SUBMITTED"] } },
        orderBy: { submitted_at: "desc" },
        skip,
        take,
        include: {
          test: {
            select: {
              id: true,
              title: true,
              total_marks: true,
              duration_minutes: true,
            },
          },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.attempt.count({
        where: { user_id: userId, status: { in: ["SCORED", "SUBMITTED"] } },
      }),
    ]);

    return {
      data: attempts.map((a) => ({
        attempt_id: a.id,
        test_id: a.test.id,
        test_title: a.test.title,
        total_marks: a.test.total_marks,
        score: a.score,
        max_score: a.max_score,
        percentile: a.percentile,
        rank: a.rank,
        attempt_no: a.attempt_no,
        practice_mode: a.practice_mode,
        submitted_at: a.submitted_at,
        time_taken_sec: a.time_taken_sec,
        questions_answered: a._count.responses,
      })),
      total,
      skip,
      take,
    };
  }

  /* ════════════════════════════════════════════
   *  LEADERBOARD (weekly / monthly / global)
   * ════════════════════════════════════════════ */

  async getLeaderboard(
    period: "weekly" | "monthly" | "global",
    take: number = 50,
  ) {
    if (period === "global") {
      return this.getGlobalLeaderboard(take);
    }

    const now = new Date();
    const startDate = new Date(now);
    if (period === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    // Aggregate scores from attempts in the period
    const attempts = await this.prisma.attempt.findMany({
      where: {
        status: "SCORED",
        submitted_at: { gte: startDate },
      },
      select: {
        user_id: true,
        score: true,
        max_score: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            user_stats: {
              select: { current_streak: true, avg_accuracy: true },
            },
          },
        },
      },
    });

    // Aggregate per user
    const userMap: Record<
      string,
      {
        user_id: string;
        name: string;
        total_score: number;
        tests: number;
        accuracy: number;
        streak: number;
      }
    > = {};

    for (const a of attempts) {
      if (!userMap[a.user_id]) {
        userMap[a.user_id] = {
          user_id: a.user_id,
          name:
            [a.user.first_name, a.user.last_name].filter(Boolean).join(" ") ||
            "Anonymous",
          total_score: 0,
          tests: 0,
          accuracy: a.user.user_stats?.avg_accuracy ?? 0,
          streak: a.user.user_stats?.current_streak ?? 0,
        };
      }
      userMap[a.user_id].total_score += a.score || 0;
      userMap[a.user_id].tests++;
    }

    const rows = Object.values(userMap)
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, take)
      .map((u, idx) => ({ ...u, rank: idx + 1 }));

    return { period, data: rows };
  }

  private async getGlobalLeaderboard(take: number) {
    const users = await this.prisma.userStats.findMany({
      orderBy: { total_score: "desc" },
      take,
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    return {
      period: "global",
      data: users.map((u, idx) => ({
        rank: idx + 1,
        user_id: u.user.id,
        name:
          [u.user.first_name, u.user.last_name].filter(Boolean).join(" ") ||
          "Anonymous",
        total_score: u.total_score,
        tests: u.total_tests,
        accuracy: u.avg_accuracy ?? 0,
        streak: u.current_streak,
      })),
    };
  }

  /* ════════════════════════════════════════════
   *  TEST SERIES ("Courses")
   * ════════════════════════════════════════════ */

  async getTestSeries(params: { skip?: number; take?: number }) {
    const { skip = 0, take = 20 } = params;

    const [series, total] = await Promise.all([
      this.prisma.testSeries.findMany({
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          tests: {
            where: { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } },
            select: {
              id: true,
              title: true,
              duration_minutes: true,
              total_marks: true,
              status: true,
              _count: { select: { test_questions: true } },
            },
          },
        },
      }),
      this.prisma.testSeries.count(),
    ]);

    return {
      data: series.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        test_count: s.tests.length,
        tests: s.tests,
        created_at: s.created_at,
      })),
      total,
      skip,
      take,
    };
  }

  /* ════════════════════════════════════════════
   *  TEACHER DASHBOARD
   * ════════════════════════════════════════════ */

  async getTeacherDashboard(userId: string) {
    const [questionCount, testCount, challengeCount, resolvedCount] =
      await Promise.all([
        this.prisma.question.count({ where: { created_by: userId } }),
        this.prisma.test.count({ where: { created_by: userId } }),
        this.prisma.challenge.count({ where: { assigned_to: userId, status: "PENDING" } }),
        this.prisma.challenge.count({ where: { assigned_to: userId, status: { not: "PENDING" } } }),
      ]);

    // Recent challenges
    const recentChallenges = await this.prisma.challenge.findMany({
      where: { assigned_to: userId },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        created_at: true,
        question: { select: { id: true, title: true } },
      },
    });

    return {
      questions_created: questionCount,
      tests_created: testCount,
      pending_challenges: challengeCount,
      resolved_challenges: resolvedCount,
      recent_challenges: recentChallenges,
    };
  }
}
