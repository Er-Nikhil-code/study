import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

// Helper to get strict UTC midnight for the IST day
function getISTMidnight(d = new Date()) {
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  return new Date(Date.UTC(ist.getFullYear(), ist.getMonth(), ist.getDate()));
}

@Injectable()
export class TestsService {
  private readonly logger = new Logger(TestsService.name);

  constructor(private prisma: PrismaService) { }

  /* ════════════════════════════════════════════
   *  TEST CRUD (Teacher / Admin)
   * ════════════════════════════════════════════ */

  private async checkTestPermission(testId: string, userId: string, role: string) {
    if (role === "ADMIN") return;
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { topic: { include: { chapter: { include: { section: { include: { course: true, test_series: true, managers: true } } } } } } }
    });
    if (!test) throw new NotFoundException("Test not found");
    
    if (test.created_by === userId) return;

    let userToCheck = userId;
    if (role === "INTERN") {
      const intern = await this.prisma.user.findUnique({ where: { id: userId } });
      if (intern?.assigned_teacher_id) userToCheck = intern.assigned_teacher_id;
    }

    if (test.topic?.chapter?.section) {
      const section = test.topic.chapter.section;
      if (section.managers.some(m => m.id === userToCheck)) return;
      if (section.course?.created_by === userToCheck) return;
      if (section.test_series?.created_by === userToCheck) return;
    }

    throw new ForbiddenException("Not the test creator or section manager");
  }

  async createTest(
    creatorId: string,
    role: string,
    data: {
      title: string;
      topic_id?: string;
      test_series_id?: string;
      description?: string;
      duration_minutes: number;
      total_marks?: number;
      passing_marks?: number;
      positive_marks: number;
      negative_marks: number;
      section_config?: any;
      question_ids?: string[];
      test_type?: any;
    },
  ) {
    let userToCheck = creatorId;
    if (role === "INTERN") {
      const intern = await this.prisma.user.findUnique({ where: { id: creatorId } });
      if (intern?.assigned_teacher_id) userToCheck = intern.assigned_teacher_id;
    }

    if (data.topic_id && role !== "ADMIN") {
      const topic = await this.prisma.topic.findUnique({
        where: { id: data.topic_id },
        include: { chapter: { include: { section: { include: { course: true, test_series: true, managers: true } } } } }
      });
      if (!topic) throw new NotFoundException("Topic not found");
      const isManager = topic.chapter.section.managers.some(m => m.id === userToCheck);
      if (topic.chapter.section.course && topic.chapter.section.course.created_by !== userToCheck && !isManager) {
        throw new ForbiddenException("You can only create tests for courses you created or sections you manage.");
      }
      if (topic.chapter.section.test_series && topic.chapter.section.test_series.created_by !== userToCheck && !isManager) {
        throw new ForbiddenException("You can only create tests for test series you created or sections you manage.");
      }
    }

    if (data.test_series_id && role !== "ADMIN") {
      const series = await this.prisma.testSeries.findUnique({
        where: { id: data.test_series_id },
        include: { staff: true }
      });
      if (!series) throw new NotFoundException("Test series not found");
      if (series.created_by !== creatorId && !series.staff.some(s => s.user_id === creatorId)) {
        throw new ForbiddenException("You don't have permission to add tests to this test series.");
      }
    }

    const test = await this.prisma.test.create({
      data: {
        title: data.title,
        topic_id: data.topic_id || null,
        description: data.description,
        created_by: creatorId,
        duration_minutes: data.duration_minutes,
        total_marks: data.question_ids ? data.question_ids.length * data.positive_marks : (data.total_marks || 0),
        passing_marks: data.passing_marks,
        positive_marks: data.positive_marks,
        negative_marks: data.negative_marks,
        section_config: data.section_config,
        test_type: data.test_type,
        status: "PUBLISHED",
        test_series: data.test_series_id ? { connect: { id: data.test_series_id } } : undefined,
      },
    });

    // Attach questions if provided
    if (data.question_ids?.length) {
      await this.prisma.testQuestion.createMany({
        data: data.question_ids.map((qId, idx) => ({
          test_id: test.id,
          question_id: qId,
          order: idx + 1,
          section: 0,
        })),
      });
    }

    this.logger.log(`✅ Test created: ${test.id} by ${creatorId}`);
    return test;
  }

  async updateTest(
    testId: string,
    userId: string,
    role: string,
    data: {
      title?: string;
      description?: string;
      duration_minutes?: number;
      total_marks?: number;
      passing_marks?: number;
      positive_marks?: number;
      negative_marks?: number;
      section_config?: any;
      start_time?: Date | null;
      end_time?: Date | null;
    },
  ) {
    await this.checkTestPermission(testId, userId, role);

    return this.prisma.test.update({
      where: { id: testId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async publishTest(testId: string, userId: string, role: string) {
    await this.checkTestPermission(testId, userId, role);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { _count: { select: { test_questions: true } } },
    });
    if (!test) throw new NotFoundException("Test not found");
    if (test._count.test_questions === 0)
      throw new BadRequestException("Cannot publish a test with no questions");

    return this.prisma.test.update({
      where: { id: testId },
      data: { status: "PUBLISHED" },
    });
  }

  async deleteTest(testId: string, userId: string, role: string) {
    await this.checkTestPermission(testId, userId, role);
    
    // Find all users who took this test so we can update their stats after deletion
    const attempts = await this.prisma.attempt.findMany({
      where: { test_id: testId },
      select: { user_id: true },
      distinct: ['user_id']
    });

    const result = await this.prisma.test.delete({
      where: { id: testId },
    });
    
    // Recalculate stats for users affected by the deletion to update the global leaderboard
    for (const attempt of attempts) {
      await this.updateUserStats(attempt.user_id);
    }
    
    return result;
  }

  async addQuestionsToTest(testId: string, questionIds: string[], userId: string, role: string) {
    await this.checkTestPermission(testId, userId, role);

    const existingCount = await this.prisma.testQuestion.count({
      where: { test_id: testId },
    });

    await this.prisma.testQuestion.createMany({
      data: questionIds.map((qId, idx) => ({
        test_id: testId,
        question_id: qId,
        order: existingCount + idx + 1,
        section: 0,
      })),
      skipDuplicates: true,
    });

    return { message: `${questionIds.length} questions added` };
  }

  async updateTestQuestions(testId: string, questionIds: string[], userId: string, role: string) {
    await this.checkTestPermission(testId, userId, role);

    await this.prisma.testQuestion.deleteMany({
      where: { test_id: testId },
    });

    await this.prisma.testQuestion.createMany({
      data: questionIds.map((qId, idx) => ({
        test_id: testId,
        question_id: qId,
        order: idx + 1,
        section: 0,
      })),
    });

    return { message: "Test questions updated successfully" };
  }

  async listTeacherTests(userId: string, role: string, filters: { skip?: number; take?: number; topicId?: string; courseId?: string; sectionId?: string; chapterId?: string; search?: string; createdOnly?: boolean; testSeriesId?: string }) {
    const where: any = {};
    if (role !== "ADMIN" || filters.createdOnly) {
      where.created_by = userId;
    }

    if (filters.search) {
      where.title = { contains: filters.search, mode: "insensitive" };
    }
    if (filters.topicId) {
      where.topic_id = filters.topicId;
    } else if (filters.chapterId) {
      where.topic = { chapter_id: filters.chapterId };
    } else if (filters.sectionId) {
      where.topic = { chapter: { section_id: filters.sectionId } };
    } else if (filters.testSeriesId) {
      where.test_series = { some: { id: filters.testSeriesId } };
    } else if (filters.courseId) {
      where.topic = { chapter: { section: { course_id: filters.courseId } } };
    }

    const [tests, total] = await Promise.all([
      this.prisma.test.findMany({
        where,
        skip: filters.skip || 0,
        take: filters.take || 20,
        orderBy: { created_at: "desc" },
        include: {
          _count: { select: { test_questions: true, attempts: true } },
          topic: {
            select: {
              name: true,
              chapter: {
                select: {
                  name: true,
                  section: {
                    select: {
                      name: true,
                      course: { select: { name: true } }
                    }
                  }
                }
              }
            }
          }
        },
      }),
      this.prisma.test.count({ where }),
    ]);

    return { data: tests, total };
  }

  /* ════════════════════════════════════════════
   *  TEST LISTING (Public / Student)
   * ════════════════════════════════════════════ */

  async listPublishedTests(params: {
    topicId?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { topicId, search, skip = 0, take = 20 } = params;
    const where: any = {
      status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] },
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (topicId) {
      where.topic_id = topicId;
    }

    const [tests, total] = await Promise.all([
      this.prisma.test.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          duration_minutes: true,
          total_marks: true,
          status: true,
          start_time: true,
          end_time: true,
          created_at: true,
          _count: { select: { test_questions: true, attempts: true } },
        },
      }),
      this.prisma.test.count({ where }),
    ]);

    return { data: tests, total, skip, take };
  }

  async getTestDetails(testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        test_questions: { include: { question: { select: { marks: true } } } },
        _count: { select: { test_questions: true, attempts: true } },
      },
    });
    if (!test) throw new NotFoundException("Test not found");
    const actualTotal = test.test_questions.reduce((acc, tq) => acc + (test.positive_marks || tq.marks_override || tq.question?.marks || 0), 0) || test.total_marks;
    return { ...test, total_marks: actualTotal };
  }

  async getTestPreview(testId: string, userId: string, role: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        test_questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              select: {
                id: true,
                question_type: true,
                content_json: true,
                options_json: true,
                answer_key: true,
                solution_json: true,
                difficulty: true,
                marks: true,
                negative_marks: true,
                topic_id: true,
              }
            }
          },
        },
        _count: { select: { test_questions: true, attempts: true } },
      },
    });
    if (!test) throw new NotFoundException("Test not found");
    const actualTotal = test.test_questions.reduce((acc, tq) => acc + (test.positive_marks || tq.marks_override || tq.question?.marks || 0), 0) || test.total_marks;
    return { ...test, total_marks: actualTotal };
  }

  /* ════════════════════════════════════════════
   *  ATTEMPT FLOW (Student)
   * ════════════════════════════════════════════ */

  async startAttempt(testId: string, userId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        test_questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              select: {
                id: true,
                question_type: true,
                content_json: true,
                options_json: true,
                difficulty: true,
                marks: true,
                negative_marks: true,
                topic_id: true,
              },
            },
          },
        },
      },
    });

    if (!test) throw new NotFoundException("Test not found");
    if (!["PUBLISHED", "ONGOING"].includes(test.status))
      throw new BadRequestException("This test is not available");

    // Check for existing in-progress attempt
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        user_id: userId,
        test_id: testId,
        status: "IN_PROGRESS",
      },
    });

    if (existingAttempt) {
      // Resume existing attempt
      const responses = await this.prisma.response.findMany({
        where: { attempt_id: existingAttempt.id },
      });
      return {
        attempt: existingAttempt,
        questions: test.test_questions.map((tq) => ({
          test_question_id: tq.id,
          order: tq.order,
          section: tq.section,
          ...tq.question,
          marks: test.positive_marks || tq.marks_override || tq.question.marks,
          negative_marks: test.negative_marks ?? tq.question.negative_marks ?? 0,
        })),
        responses,
        duration_minutes: test.duration_minutes,
        resumed: true,
      };
    }

    // Determine attempt number
    const prevAttempts = await this.prisma.attempt.count({
      where: { user_id: userId, test_id: testId },
    });

    const attempt = await this.prisma.attempt.create({
      data: {
        user_id: userId,
        test_id: testId,
        attempt_no: prevAttempts + 1,
        status: "IN_PROGRESS",
        max_score: test.total_marks,
        practice_mode: prevAttempts > 0, // reattempts = practice mode
      },
    });

    this.logger.log(
      `✅ Attempt started: ${attempt.id} (attempt #${attempt.attempt_no}) for test ${testId}`,
    );

    return {
      attempt,
      questions: test.test_questions.map((tq) => ({
        test_question_id: tq.id,
        order: tq.order,
        section: tq.section,
        ...tq.question,
        marks: test.positive_marks || tq.marks_override || tq.question.marks,
        negative_marks: test.negative_marks ?? tq.question.negative_marks ?? 0,
      })),
      responses: [],
      duration_minutes: test.duration_minutes,
      resumed: false,
    };
  }

  async saveAnswer(
    attemptId: string,
    userId: string,
    data: {
      test_question_id: string;
      question_id: string;
      topic_id: string;
      answer_json: any;
      time_on_question?: number;
      marked_for_review?: boolean;
    },
  ) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new NotFoundException("Attempt not found");
    if (attempt.user_id !== userId)
      throw new ForbiddenException("Not your attempt");
    if (attempt.status !== "IN_PROGRESS")
      throw new BadRequestException("Attempt already submitted");

    // Upsert the response
    const existing = await this.prisma.response.findFirst({
      where: {
        attempt_id: attemptId,
        question_id: data.question_id,
      },
    });

    if (existing) {
      return this.prisma.response.update({
        where: { id: existing.id },
        data: {
          answer_json: data.answer_json,
          time_on_question: data.time_on_question,
          marked_for_review: data.marked_for_review ?? existing.marked_for_review,
        },
      });
    }

    return this.prisma.response.create({
      data: {
        attempt_id: attemptId,
        test_question_id: data.test_question_id,
        question_id: data.question_id,
        topic_id: data.topic_id,
        answer_json: data.answer_json,
        time_on_question: data.time_on_question,
        marked_for_review: data.marked_for_review ?? false,
      },
    });
  }

  async submitAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: {
          include: {
            question: {
              select: {
                answer_key: true,
                question_type: true,
                marks: true,
                negative_marks: true,
              },
            },
          },
        },
        test: {
          include: {
            test_questions: {
              include: { question: { select: { marks: true } } }
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException("Attempt not found");
    if (attempt.user_id !== userId)
      throw new ForbiddenException("Not your attempt");
    if (attempt.status !== "IN_PROGRESS")
      throw new BadRequestException("Attempt already submitted");

    // Score each response
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let actualMaxScore = 0;

    for (const tq of attempt.test.test_questions) {
      actualMaxScore += attempt.test.positive_marks || tq.marks_override || tq.question.marks || 0;
    }

    for (const response of attempt.responses) {
      const testQuestion = attempt.test.test_questions.find(tq => tq.id === response.test_question_id);
      const pMarks = attempt.test.positive_marks || testQuestion?.marks_override || response.question.marks;
      const nMarks = attempt.test.negative_marks ?? response.question.negative_marks;

      const result = this.scoreResponse(
        response.answer_json,
        response.question.answer_key as any,
        response.question.question_type,
        pMarks,
        nMarks,
      );

      await this.prisma.response.update({
        where: { id: response.id },
        data: {
          is_correct: result.isCorrect,
          marks_obtained: result.marks,
        },
      });

      totalScore += result.marks;
      if (result.isCorrect) correctCount++;
      else if (result.marks < 0) wrongCount++;
    }

    const skipped =
      attempt.test.test_questions.length - attempt.responses.length;
    const timeTaken = Math.floor(
      (Date.now() - attempt.started_at.getTime()) / 1000,
    );

    // Calculate rank
    const betterAttempts = await this.prisma.attempt.count({
      where: {
        test_id: attempt.test_id,
        attempt_no: 1,
        status: "SCORED",
        score: { gt: totalScore }
      }
    });
    const rank = betterAttempts + 1;

    // Update attempt
    const updated = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SCORED",
        score: totalScore,
        max_score: actualMaxScore,
        submitted_at: new Date(),
        time_taken_sec: timeTaken,
        rank: rank,
      },
    });

    // Mark tests completed in Topic Progress if linked to a topic
    if (attempt.test.topic_id) {
      const progress = await this.prisma.topicProgress.upsert({
        where: { user_id_topic_id: { user_id: userId, topic_id: attempt.test.topic_id } },
        create: { user_id: userId, topic_id: attempt.test.topic_id, tests_completed: true },
        update: { tests_completed: true }
      });

      const notesCount = await this.prisma.note.count({ where: { topic_id: attempt.test.topic_id, approval_status: 'APPROVED' } });
      const requireNotes = notesCount > 0;

      if ((progress.notes_viewed || !requireNotes) && progress.tests_completed && !progress.is_completed) {
        await this.prisma.topicProgress.update({
          where: { id: progress.id },
          data: { is_completed: true, completed_at: new Date() }
        });
      }
    }

    // Record daily activity for streak
    await this.recordDailyActivity(userId, "test_attempt");

    // Update user stats
    await this.updateUserStats(userId);

    this.logger.log(
      `✅ Attempt scored: ${attemptId} — ${totalScore}/${attempt.max_score} (${correctCount} correct, ${wrongCount} wrong, ${skipped} skipped)`,
    );

    return {
      ...updated,
      correct: correctCount,
      wrong: wrongCount,
      skipped,
      total_questions: attempt.test.test_questions.length,
    };
  }

  /* ════════════════════════════════════════════
   *  SCORING ENGINE
   * ════════════════════════════════════════════ */

  private scoreResponse(
    studentAnswer: any,
    answerKey: any,
    questionType: string,
    marks: number,
    negativeMark: number,
  ): { isCorrect: boolean; marks: number } {
    if (!studentAnswer || studentAnswer === null) {
      return { isCorrect: false, marks: 0 }; // Unanswered = 0
    }

    try {
      switch (questionType) {
        case "SINGLE_CORRECT": {
          const correct =
            studentAnswer?.selected_option === answerKey?.correct_option;
          return {
            isCorrect: correct,
            marks: correct ? marks : -negativeMark,
          };
        }

        case "MULTIPLE_CORRECT": {
          const selected = (studentAnswer?.selected_options || []).sort();
          const correct = (answerKey?.correct_options || []).sort();
          const isCorrect =
            JSON.stringify(selected) === JSON.stringify(correct);
          return {
            isCorrect,
            marks: isCorrect ? marks : -negativeMark,
          };
        }

        case "TRUE_FALSE": {
          const correct = studentAnswer?.answer === answerKey?.answer;
          return {
            isCorrect: correct,
            marks: correct ? marks : -negativeMark,
          };
        }

        case "FILL_BLANK": {
          const blanks = answerKey?.blanks || [];
          let allCorrect = true;
          for (const blank of blanks) {
            const studentVal = studentAnswer?.blanks?.[blank.position] || "";
            const expected = blank.answer;
            const match = blank.case_sensitive
              ? studentVal === expected
              : studentVal.toLowerCase() === expected.toLowerCase();
            if (!match) allCorrect = false;
          }
          return {
            isCorrect: allCorrect,
            marks: allCorrect ? marks : -negativeMark,
          };
        }

        case "NUMERICAL": {
          const diff = Math.abs(
            Number(studentAnswer?.value) - Number(answerKey?.value),
          );
          const tolerance = answerKey?.tolerance || 0;
          const correct = diff <= tolerance;
          return {
            isCorrect: correct,
            marks: correct ? marks : -negativeMark,
          };
        }

        case "MATCHING": {
          const pairs = answerKey?.pairs || [];
          const studentPairs = studentAnswer?.pairs || [];
          const isCorrect =
            pairs.length === studentPairs.length &&
            pairs.every(
              (p: any) =>
                studentPairs.find(
                  (sp: any) =>
                    sp.left_id === p.left_id && sp.right_id === p.right_id,
                ),
            );
          return {
            isCorrect,
            marks: isCorrect ? marks : -negativeMark,
          };
        }

        default:
          return { isCorrect: false, marks: 0 };
      }
    } catch {
      return { isCorrect: false, marks: 0 };
    }
  }

  /* ════════════════════════════════════════════
   *  USER STATS & STREAK
   * ════════════════════════════════════════════ */

  async updateUserStats(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { user_id: userId, status: "SCORED", attempt_no: 1 },
      select: { score: true, max_score: true },
    });

    if (attempts.length === 0) return;

    const totalScore = attempts.reduce((s, a) => s + (a.score || 0), 0);
    const bestScore = Math.max(...attempts.map((a) => a.score || 0));
    const avgAccuracy =
      attempts.reduce(
        (s, a) =>
          s + ((a.score || 0) / (a.max_score || 1)) * 100,
        0,
      ) / attempts.length;

    // Calculate streak
    const activities = await this.prisma.dailyActivity.findMany({
      where: { user_id: userId },
      orderBy: { activity_date: "desc" },
      take: 365,
    });

    let currentStreak = 0;
    let longestStreak = 0;
    const today = getISTMidnight();

    let checkDate = new Date(today);

    const uniqueISTDates = new Set<number>();
    const normalizedActivities: Date[] = [];
    for (const act of activities) {
      const actMidnight = getISTMidnight(new Date(act.activity_date));
      if (!uniqueISTDates.has(actMidnight.getTime())) {
        uniqueISTDates.add(actMidnight.getTime());
        normalizedActivities.push(actMidnight);
      }
    }

    for (const actMidnight of normalizedActivities) {
      const diff = Math.floor(
        (checkDate.getTime() - actMidnight.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diff === 0) {
        if (currentStreak === 0) currentStreak = 1;
        checkDate = actMidnight;
      } else if (diff === 1) {
        currentStreak++;
        checkDate = actMidnight;
      } else {
        break;
      }
    }

    // Recalculate longest
    let tempStreak = 0;
    let prevDate: Date | null = null;
    for (const actMidnight of normalizedActivities) {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const gap = Math.floor(
          (prevDate.getTime() - actMidnight.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (gap === 1) tempStreak++;
        else if (gap > 1) tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = actMidnight;
    }

    await this.prisma.userStats.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        total_tests: attempts.length,
        total_score: totalScore,
        best_score: bestScore,
        avg_accuracy: Math.round(avgAccuracy * 100) / 100,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      },
      update: {
        total_tests: attempts.length,
        total_score: totalScore,
        best_score: bestScore,
        avg_accuracy: Math.round(avgAccuracy * 100) / 100,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      },
    });
  }

  async recordDailyActivity(userId: string, type: string) {
    const today = getISTMidnight();

    await this.prisma.dailyActivity.upsert({
      where: {
        user_id_activity_date: {
          user_id: userId,
          activity_date: today,
        },
      },
      create: {
        user_id: userId,
        activity_date: today,
        activity_type: type,
        activity_count: 1,
      },
      update: {
        activity_count: { increment: 1 },
      },
    });
  }

  /* ════════════════════════════════════════════
   *  GET ATTEMPT WITH SOLUTIONS (for results)
   * ════════════════════════════════════════════ */

  async getAttemptResult(attemptId: string, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            duration_minutes: true,
            total_marks: true,
            positive_marks: true,
            negative_marks: true,
            passing_marks: true,
            created_by: true,
            topic: {
              select: {
                chapter: {
                  select: {
                    section: {
                      select: {
                        course_id: true,
                        test_series_id: true,
                      }
                    }
                  }
                }
              }
            },
            _count: { select: { test_questions: true } },
            test_questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    question_type: true,
                    content_json: true,
                    options_json: true,
                    answer_key: true,
                    solution_json: true,
                    difficulty: true,
                    marks: true,
                    negative_marks: true,
                    topic: {
                      select: {
                        id: true,
                        name: true,
                        chapter: {
                          select: {
                            name: true,
                            section: { 
                              select: { 
                                name: true,
                                course_id: true,
                                test_series_id: true,
                                course: { select: { id: true, name: true } },
                                test_series: { select: { id: true, name: true } }
                              } 
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        responses: {
          include: {
            question: {
              select: {
                id: true,
                question_type: true,
                content_json: true,
                options_json: true,
                answer_key: true,
                solution_json: true,
                difficulty: true,
                marks: true,
                negative_marks: true,
                topic: {
                  select: {
                    id: true,
                    name: true,
                    chapter: {
                      select: {
                        name: true,
                        section: { 
                          select: { 
                            name: true,
                            course_id: true,
                            test_series_id: true,
                            course: { select: { id: true, name: true } },
                            test_series: { select: { id: true, name: true } }
                          } 
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!attempt) throw new NotFoundException("Attempt not found");
    if (attempt.user_id !== userId)
      throw new ForbiddenException("Not your attempt");
    if (attempt.status === "IN_PROGRESS")
      throw new BadRequestException("Attempt not yet submitted");

    return attempt;
  }

  /* ════════════════════════════════════════════
   *  LEADERBOARD
   * ════════════════════════════════════════════ */

  async getTestLeaderboard(testId: string, currentUserId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { test_questions: { include: { question: { select: { marks: true } } } } }
    });
    const actualMaxScore = test?.test_questions.reduce((acc, tq) => acc + (test?.positive_marks || tq.marks_override || tq.question?.marks || 0), 0) || 0;

    const attempts = await this.prisma.attempt.findMany({
      where: {
        test_id: testId,
        attempt_no: 1,
        status: "SCORED"
      },
      orderBy: [
        { score: "desc" },
        { time_taken_sec: "asc" },
        { submitted_at: "asc" }
      ],
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
          }
        }
      }
    });

    // Build ranking
    const leaderboard = attempts.map((a, index) => ({
      rank: index + 1,
      attempt_id: a.id,
      score: a.score,
      max_score: actualMaxScore > 0 ? actualMaxScore : a.max_score,
      time_taken_sec: a.time_taken_sec,
      submitted_at: a.submitted_at,
      user: a.user
    }));

    const top50 = leaderboard.slice(0, 50);
    const currentUserEntry = leaderboard.find(l => l.user.id === currentUserId);

    return {
      leaderboard: top50,
      currentUserRank: currentUserEntry ? currentUserEntry.rank : null,
      total_participants: leaderboard.length
    };
  }

  /* ════════════════════════════════════════════
   *  TEST SERIES CRUD (Teacher / Admin)
   * ════════════════════════════════════════════ */

  async createTestSeries(creatorId: string, role: string, data: any) {
    if (!["ADMIN", "TEACHER"].includes(role)) {
      throw new ForbiddenException("Only admins and teachers can create test series.");
    }
    
    return this.prisma.testSeries.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        created_by: creatorId,
        status: data.status || "DRAFT",
        launch_date: data.launch_date,
        price: data.price,
        discount_price: data.discount_price,
      }
    });
  }

  async updateTestSeries(seriesId: string, userId: string, role: string, data: any) {
    const series = await this.prisma.testSeries.findUnique({
      where: { id: seriesId },
      include: { staff: true }
    });
    if (!series) throw new NotFoundException("Test series not found");

    if (role !== "ADMIN" && series.created_by !== userId && !series.staff.some(s => s.user_id === userId)) {
      throw new ForbiddenException("You don't have permission to edit this test series");
    }

    return this.prisma.testSeries.update({
      where: { id: seriesId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status,
        launch_date: data.launch_date,
        price: data.price,
        discount_price: data.discount_price,
      }
    });
  }

  async deleteTestSeries(seriesId: string, userId: string, role: string) {
    const series = await this.prisma.testSeries.findUnique({ where: { id: seriesId } });
    if (!series) throw new NotFoundException("Test series not found");
    if (role !== "ADMIN" && series.created_by !== userId) {
      throw new ForbiddenException("Only the creator or an admin can delete this test series");
    }

    return this.prisma.testSeries.delete({ where: { id: seriesId } });
  }

  async getAdminTestSeries(userId: string, role: string) {
    const where: any = {};
    if (role === 'INTERN') {
      // Interns see test series where their assigned teacher is creator or staff
      const intern = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { assigned_teacher_id: true }
      });
      if (!intern?.assigned_teacher_id) {
        return []; // No assigned teacher = no test series
      }
      where.OR = [
        { created_by: intern.assigned_teacher_id },
        { staff: { some: { user_id: intern.assigned_teacher_id } } }
      ];
    } else if (role !== 'ADMIN') {
      // TEACHER: see test series they created or are staff on
      where.OR = [
        { created_by: userId },
        { staff: { some: { user_id: userId } } }
      ];
    }
    // ADMIN: where stays {} (see all)

    return this.prisma.testSeries.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { tests: true, enrollments: true } },
        staff: { include: { user: { select: { id: true, first_name: true, last_name: true, email: true } } } }
      }
    });
  }

  async assignTestSeriesStaff(seriesId: string, staffId: string, role: string) {
    if (role !== "ADMIN") throw new ForbiddenException("Only admins can assign staff to test series");
    
    return this.prisma.testSeriesStaff.upsert({
      where: { test_series_id_user_id: { test_series_id: seriesId, user_id: staffId } },
      create: { test_series_id: seriesId, user_id: staffId },
      update: {}
    });
  }

  async removeTestSeriesStaff(seriesId: string, staffId: string, role: string) {
    if (role !== "ADMIN") throw new ForbiddenException("Only admins can remove staff from test series");

    await this.prisma.testSeriesStaff.delete({
      where: { test_series_id_user_id: { test_series_id: seriesId, user_id: staffId } }
    }).catch(() => {});
    return { success: true };
  }

  /* ════════════════════════════════════════════
   *  TEST SERIES DETAIL & TEST MANAGEMENT
   * ════════════════════════════════════════════ */

  async getTestSeriesDetail(seriesId: string, userId: string, role: string) {
    const series = await this.prisma.testSeries.findUnique({
      where: { id: seriesId },
      include: {
        staff: {
          include: {
            user: {
              select: { id: true, first_name: true, last_name: true, email: true }
            }
          }
        },
        tests: {
          orderBy: { created_at: "desc" },
          include: {
            _count: { select: { test_questions: true, attempts: true } },
            topic: {
              select: {
                name: true,
                chapter: {
                  select: {
                    name: true,
                    section: {
                      select: {
                        name: true,
                        course: { select: { name: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        _count: { select: { enrollments: true, tests: true } }
      }
    });

    if (!series) throw new NotFoundException("Test series not found");

    // Only admin or assigned staff can view details
    if (role !== "ADMIN" && series.created_by !== userId && !series.staff.some(s => s.user_id === userId)) {
      throw new ForbiddenException("You don't have permission to view this test series");
    }

    return series;
  }

  async addTestsToSeries(seriesId: string, testIds: string[], userId: string, role: string) {
    const series = await this.prisma.testSeries.findUnique({
      where: { id: seriesId },
      include: { staff: true }
    });
    if (!series) throw new NotFoundException("Test series not found");

    if (role !== "ADMIN" && series.created_by !== userId && !series.staff.some(s => s.user_id === userId)) {
      throw new ForbiddenException("You don't have permission to manage this test series");
    }

    // Connect the tests to this series
    await this.prisma.testSeries.update({
      where: { id: seriesId },
      data: {
        tests: {
          connect: testIds.map(id => ({ id }))
        }
      }
    });

    this.logger.log(`✅ Added ${testIds.length} tests to series ${seriesId}`);
    return { message: `${testIds.length} test(s) added to series` };
  }

  async removeTestFromSeries(seriesId: string, testId: string, userId: string, role: string) {
    const series = await this.prisma.testSeries.findUnique({
      where: { id: seriesId },
      include: { staff: true }
    });
    if (!series) throw new NotFoundException("Test series not found");

    if (role !== "ADMIN" && series.created_by !== userId && !series.staff.some(s => s.user_id === userId)) {
      throw new ForbiddenException("You don't have permission to manage this test series");
    }

    await this.prisma.testSeries.update({
      where: { id: seriesId },
      data: {
        tests: {
          disconnect: { id: testId }
        }
      }
    });

    this.logger.log(`✅ Removed test ${testId} from series ${seriesId}`);
    return { message: "Test removed from series" };
  }
}

