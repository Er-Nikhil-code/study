import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

// Helper to convert UTC Date to IST YYYY-MM-DD
function getISTDateString(d: Date) {
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private prisma: PrismaService) {}

  /* ════════════════════════════════════════════
   *  ACTIVITY GRAPH HELPER
   * ════════════════════════════════════════════ */
  async getDetailedActivityGraph(userId: string, enrolledCourseIds: string[] = []) {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 90);

    const filterByCourse = enrolledCourseIds.length > 0;

    const [
      notesCreated,
      notesReviewed,
      questionsCreated,
      questionsReviewed,
      testsCreated,
      testsAttempted,
      coursesEnrolled,
      challengesSubmitted
    ] = await Promise.all([
      this.prisma.note.findMany({ 
        where: { 
          created_by: userId, 
          created_at: { gte: oneYearAgo },
          ...(filterByCourse && { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } })
        }, 
        select: { created_at: true } 
      }),
      this.prisma.note.findMany({ 
        where: { 
          approved_by: userId, 
          approved_at: { gte: oneYearAgo },
          ...(filterByCourse && { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } })
        }, 
        select: { approved_at: true } 
      }),
      this.prisma.question.findMany({ 
        where: { 
          created_by: userId, 
          created_at: { gte: oneYearAgo },
          ...(filterByCourse && { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } })
        }, 
        select: { created_at: true } 
      }),
      this.prisma.question.findMany({ 
        where: { 
          approved_by: userId, 
          approved_at: { gte: oneYearAgo },
          ...(filterByCourse && { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } })
        }, 
        select: { approved_at: true } 
      }),
      this.prisma.test.findMany({ 
        where: { 
          created_by: userId, 
          created_at: { gte: oneYearAgo },
          ...(filterByCourse && { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } })
        }, 
        select: { created_at: true } 
      }),
      this.prisma.attempt.findMany({ 
        where: { 
          user_id: userId, 
          started_at: { gte: oneYearAgo },
          ...(filterByCourse && { test: { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } } })
        }, 
        select: { started_at: true } 
      }),
      this.prisma.courseEnrollment.findMany({ 
        where: { 
          user_id: userId, 
          enrolled_at: { gte: oneYearAgo },
          ...(filterByCourse && { course_id: { in: enrolledCourseIds } })
        }, 
        select: { enrolled_at: true } 
      }),
      this.prisma.challenge.findMany({ 
        where: { 
          submitted_by: userId, 
          created_at: { gte: oneYearAgo },
          ...(filterByCourse && { question: { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } } })
        }, 
        select: { created_at: true } 
      })
    ]);

    const activityMap: Record<string, { total: number; details: Record<string, number> }> = {};

    const addActivity = (dateObj: Date | null, type: string) => {
      if (!dateObj) return;
      const dateStr = getISTDateString(dateObj);
      if (!activityMap[dateStr]) activityMap[dateStr] = { total: 0, details: {} };
      activityMap[dateStr].total++;
      activityMap[dateStr].details[type] = (activityMap[dateStr].details[type] || 0) + 1;
    };

    notesCreated.forEach(n => addActivity(n.created_at, "notes created"));
    notesReviewed.forEach(n => addActivity(n.approved_at, "notes reviewed"));
    questionsCreated.forEach(q => addActivity(q.created_at, "questions created"));
    questionsReviewed.forEach(q => addActivity(q.approved_at, "questions reviewed"));
    testsCreated.forEach(t => addActivity(t.created_at, "tests created"));
    testsAttempted.forEach(t => addActivity(t.started_at, "tests attempted"));
    coursesEnrolled.forEach(c => addActivity(c.enrolled_at, "courses enrolled"));
    challengesSubmitted.forEach(c => addActivity(c.created_at, "reviews submitted"));

    return Object.keys(activityMap).map(date => ({
      date,
      count: activityMap[date].total,
      details: Object.keys(activityMap[date].details).map(type => ({
        type,
        count: activityMap[date].details[type]
      }))
    }));
  }

  /* ════════════════════════════════════════════
   *  DASHBOARD STATS
   * ════════════════════════════════════════════ */

  async getDashboardStats(userId: string) {
    const userRec = await this.prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { 
        course_enrolled: true,
        course_enrollments: { include: { course: true } } 
      } 
    });

    const enrolledCourseIds = userRec?.course_enrollments?.map(enr => enr.course_id) || [];

    const [stats, recentAttempts, todayActivity, weakTopics] =
      await Promise.all([
        this.prisma.userStats.findUnique({ where: { user_id: userId } }),
        this.prisma.attempt.findMany({
          where: { 
            user_id: userId, 
            status: "SCORED",
            test: {
              topic: {
                chapter: {
                  section: {
                    course_id: { in: enrolledCourseIds }
                  }
                }
              }
            }
          },
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

    // Calculate progress for each enrolled course
    const courseProgressList = [];
    if (userRec?.course_enrollments) {
      for (const enr of userRec.course_enrollments) {
        // Count total topics in this course
        const totalTopics = await this.prisma.topic.count({
          where: { chapter: { section: { course_id: enr.course_id } } }
        });

        // Count completed topics for this user in this course
        const completedTopics = await this.prisma.topicProgress.count({
          where: {
            user_id: userId,
            is_completed: true,
            topic: { chapter: { section: { course_id: enr.course_id } } }
          }
        });

        const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        
        courseProgressList.push({
          id: enr.course.id,
          name: enr.course.name,
          code: enr.course.code,
          total_topics: totalTopics,
          completed_topics: completedTopics,
          progress_percentage: percentage,
          enrolled_at: enr.enrolled_at
        });
      }
      
      // Sort: latest enrolled first
      courseProgressList.sort((a, b) => {
        const dateA = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0;
        const dateB = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    let enrolledCourseName = userRec?.course_enrolled || null;
    if (enrolledCourseName && enrolledCourseName.startsWith("c")) {
       const course = await this.prisma.course.findUnique({ where: { id: enrolledCourseName } });
       if (course) enrolledCourseName = course.name;
    }

    // Get rank
    const rank = await this.getUserRank(userId);

    // First attempts vs reattempts
    const firstAttempts = await this.prisma.attempt.count({
      where: { 
        user_id: userId, 
        attempt_no: 1, 
        status: "SCORED",
        test: { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } }
      },
    });
    const reattempts = await this.prisma.attempt.count({
      where: { 
        user_id: userId, 
        attempt_no: { gt: 1 }, 
        status: "SCORED",
        test: { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } }
      },
    });

    // Tests completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const testsToday = await this.prisma.attempt.count({
      where: {
        user_id: userId,
        status: "SCORED",
        submitted_at: { gte: todayStart },
        test: { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } }
      },
    });

    // Activity graph (last 180 days)
    const activity_graph = await this.getDetailedActivityGraph(userId, enrolledCourseIds);

    // Marks History (all scored attempts)
    const allAttempts = await this.prisma.attempt.findMany({
      where: { 
        user_id: userId, 
        status: "SCORED",
        test: { topic: { chapter: { section: { course_id: { in: enrolledCourseIds } } } } }
      },
      orderBy: { submitted_at: "asc" },
      select: {
        id: true,
        score: true,
        max_score: true,
        submitted_at: true,
        attempt_no: true,
        test: {
          select: {
            title: true,
            topic: {
              select: {
                chapter: {
                  select: {
                    section: {
                      select: {
                        course: { select: { id: true, name: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const marks_history = allAttempts.map(a => ({
      attempt_id: a.id,
      test_title: a.test.title,
      score: a.score,
      max_score: a.max_score,
      percentage: a.max_score ? Math.round(((a.score || 0) / a.max_score) * 100) : 0,
      submitted_at: a.submitted_at,
      attempt_no: a.attempt_no,
      course_id: a.test?.topic?.chapter?.section?.course?.id,
      course_name: a.test?.topic?.chapter?.section?.course?.name
    }));

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
      enrolled_course: enrolledCourseName,
      enrolled_courses: courseProgressList,
      activity_graph,
      marks_history,
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
              positive_marks: true,
              test_questions: {
                include: { question: { select: { marks: true } } }
              }
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
        max_score: a.test.test_questions?.reduce((acc, tq) => acc + (a.test.positive_marks || tq.marks_override || tq.question?.marks || 0), 0) || a.max_score,
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
    requestingRole: string = "STUDENT",
    courseId?: string
  ) {
    const targetRole = requestingRole === "INTERN" ? "INTERN" : "STUDENT";

    if (period === "global") {
      return this.getGlobalLeaderboard(take, targetRole, courseId);
    }

    const now = new Date();
    const startDate = new Date(now);
    if (period === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const whereClause: any = {
      status: "SCORED",
      attempt_no: 1, // Only count first attempts for leaderboard points
      submitted_at: { gte: startDate },
      user: { role: targetRole as any },
    };
    if (courseId) {
      whereClause.user.course_enrollments = { some: { course_id: courseId } };
    }

    const attempts = await this.prisma.attempt.findMany({
      where: whereClause,
      select: {
        user_id: true,
        score: true,
        max_score: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            user_stats: {
              select: { current_streak: true },
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
        total_max_score: number;
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
          total_max_score: 0,
          tests: 0,
          accuracy: 0,
          streak: a.user.user_stats?.current_streak ?? 0,
        };
      }
      userMap[a.user_id].total_score += a.score || 0;
      userMap[a.user_id].total_max_score += a.max_score || 0;
      userMap[a.user_id].tests++;
    }

    const rows = Object.values(userMap)
      .map((u) => {
        u.accuracy = u.total_max_score > 0 ? (u.total_score / u.total_max_score) * 100 : 0;
        return u;
      })
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, take)
      .map((u, idx) => ({
        user_id: u.user_id,
        name: u.name,
        total_score: u.total_score,
        tests: u.tests,
        accuracy: u.accuracy,
        streak: u.streak,
        rank: idx + 1,
      }));

    return { period, data: rows };
  }

  private async getGlobalLeaderboard(take: number, targetRole: string, courseId?: string) {
    const whereClause: any = {
      user: { role: targetRole as any }
    };
    if (courseId) {
      whereClause.user.course_enrollments = { some: { course_id: courseId } };
    }

    const users = await this.prisma.userStats.findMany({
      where: whereClause,
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

  async getTestSeries(userId: string, params: { skip?: number; take?: number }) {
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
          enrollments: {
            where: { user_id: userId },
            take: 1,
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
        status: s.status,
        price: s.price,
        discount_price: s.discount_price,
        test_count: s.tests.length,
        is_enrolled: s.enrollments.length > 0,
        tests: s.tests,
        created_at: s.created_at,
      })),
      total,
      skip,
      take,
    };
  }

  async enrollInTestSeries(userId: string, testSeriesId: string) {
    const testSeries = await this.prisma.testSeries.findUnique({ where: { id: testSeriesId } });
    if (!testSeries) throw new Error("Test series not found");

    const existing = await this.prisma.testSeriesEnrollment.findUnique({
      where: { user_id_test_series_id: { user_id: userId, test_series_id: testSeriesId } },
    });

    if (existing) return existing;

    return this.prisma.testSeriesEnrollment.create({
      data: {
        user_id: userId,
        test_series_id: testSeriesId,
      },
    });
  }

  async getTestSeriesTests(userId: string, params: { test_type?: any; test_series_id?: string; skip?: number; take?: number }) {
    const { test_type, test_series_id, skip = 0, take = 20 } = params;

    const whereClause: any = {
      status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] },
    };
    if (test_type) {
      whereClause.test_type = test_type;
    }
    if (test_series_id) {
      whereClause.test_series = { some: { id: test_series_id } };
    }

    const [tests, total] = await Promise.all([
      this.prisma.test.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { start_time: "desc" },
        include: {
          _count: { select: { test_questions: true, attempts: true } },
          attempts: {
            where: { user_id: userId },
            orderBy: { attempt_no: "desc" },
            take: 1, // Only get the latest attempt
          },
        },
      }),
      this.prisma.test.count({ where: whereClause }),
    ]);

    const data = tests.map((t) => {
      const latestAttempt = t.attempts[0] || null;
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        duration_minutes: t.duration_minutes,
        total_marks: t.total_marks,
        passing_marks: t.passing_marks,
        test_type: t.test_type,
        status: t.status,
        start_time: t.start_time,
        _count: t._count,
        latest_attempt: latestAttempt ? {
          attempt_id: latestAttempt.id,
          attempt_no: latestAttempt.attempt_no,
          score: latestAttempt.score,
          max_score: latestAttempt.max_score,
          rank: latestAttempt.rank,
          status: latestAttempt.status,
        } : null,
      };
    });

    return {
      data,
      total,
      skip,
      take,
    };
  }

  /* ════════════════════════════════════════════
   *  TEACHER DASHBOARD
   * ════════════════════════════════════════════ */

  async getTeacherDashboard(userId: string) {
    const [questionCount, testCount, challengeCount, resolvedCount, approvedCount] =
      await Promise.all([
        this.prisma.question.count({ where: { created_by: userId } }),
        this.prisma.test.count({ where: { created_by: userId } }),
        this.prisma.challenge.count({ where: { assigned_to: userId, status: "PENDING" } }),
        this.prisma.challenge.count({ where: { assigned_to: userId, status: { not: "PENDING" } } }),
        this.prisma.question.count({ where: { approved_by: userId } }),
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
        question: { select: { id: true, content_json: true } },
      },
    });

    // Students assigned to this teacher
    const studentsAssigned = await this.prisma.user.count({
      where: { assigned_teacher_id: userId, role: "INTERN" },
    });

    // Recent approved/rejected questions (last 5 reviews)
    const recentReviews = await this.prisma.question.findMany({
      where: {
        approved_by: userId,
        approval_status: { in: ["APPROVED", "REJECTED"] },
      },
      orderBy: { updated_at: "desc" },
      take: 5,
      select: {
        id: true,
        content_json: true,
        approval_status: true,
        updated_at: true,
        created_by: true,
      },
    });

    // Detailed Activity graph (last 180 days)
    const activity_graph = await this.getDetailedActivityGraph(userId);

    return {
      questions_created: questionCount,
      questions_approved: approvedCount,
      tests_created: testCount,
      pending_challenges: challengeCount,
      resolved_challenges: resolvedCount,
      students_assigned: studentsAssigned,
      recent_challenges: recentChallenges,
      recent_reviews: recentReviews,
      activity_graph,
    };
  }

  /* ════════════════════════════════════════════
   *  INTERN DASHBOARD
   * ════════════════════════════════════════════ */

  async getInternDashboard(userId: string) {
    const [
      totalCreated,
      totalApproved,
      totalRejected,
      totalPending,
      totalNeedsRevision,
    ] = await Promise.all([
      this.prisma.question.count({ where: { created_by: userId } }),
      this.prisma.question.count({ where: { created_by: userId, approval_status: "APPROVED" } }),
      this.prisma.question.count({ where: { created_by: userId, approval_status: "REJECTED" } }),
      this.prisma.question.count({ where: { created_by: userId, approval_status: "PENDING_REVIEW" } }),
      this.prisma.question.count({ where: { created_by: userId, approval_status: "NEEDS_REVISION" } }),
    ]);

    // Approval rate
    const approvalRate = totalCreated > 0
      ? Math.round((totalApproved / totalCreated) * 100)
      : 0;

    // Recent submissions (last 8)
    const recentQuestions = await this.prisma.question.findMany({
      where: { created_by: userId },
      orderBy: { updated_at: "desc" },
      take: 8,
      select: {
        id: true,
        content_json: true,
        approval_status: true,
        question_type: true,
        difficulty: true,
        created_at: true,
        updated_at: true,
        topic: {
          select: {
            name: true,
            chapter: {
              select: { name: true, section: { select: { course: { select: { name: true } } } } },
            },
          },
        },
      },
    });

    // Get intern's user stats (reuse student stats table)
    const stats = await this.prisma.userStats.findUnique({ where: { user_id: userId } });
    const rank = await this.prisma.userStats.count({
      where: { total_score: { gt: stats?.total_score ?? 0 } },
    });

    // Activity graph (last 180 days)
    const activity_graph = await this.getDetailedActivityGraph(userId);

    return {
      total_created: totalCreated,
      total_approved: totalApproved,
      total_rejected: totalRejected,
      total_pending: totalPending,
      total_needs_revision: totalNeedsRevision,
      approval_rate: approvalRate,
      current_streak: stats?.current_streak ?? 0,
      total_points: stats?.total_score ?? 0,
      global_rank: rank + 1,
      recent_questions: recentQuestions,
      activity_graph,
    };
  }

  /* ════════════════════════════════════════════
   *  INTERN EARNINGS & GAMIFICATION
   * ════════════════════════════════════════════ */
  async getInternEarnings(userId: string) {
    // Count total approved questions for this intern
    const approvedCount = await this.prisma.question.count({
      where: {
        created_by: userId,
        approval_status: "APPROVED",
      },
    });

    // Calculate level and earnings
    let earnings = 0;
    let level = 1;
    let remaining = approvedCount;

    // Level 1: 0 - 300 questions (₹3)
    let batch = Math.min(remaining, 300);
    earnings += batch * 3;
    remaining -= batch;

    let progressToNextLevel = batch;
    let maxForCurrentLevel = 300;

    if (remaining > 0) {
      level = 2;
      let currentReward = 4;
      
      while (remaining > 0) {
        batch = Math.min(remaining, 500);
        earnings += batch * currentReward;
        remaining -= batch;
        
        progressToNextLevel = batch;
        maxForCurrentLevel = 500;

        if (remaining > 0) {
          level++;
          currentReward++;
        }
      }
    }

    return {
      totalApprovedQuestions: approvedCount,
      currentLevel: level,
      totalEarnings: earnings,
      progress: progressToNextLevel,
      levelMax: maxForCurrentLevel,
    };
  }
}

