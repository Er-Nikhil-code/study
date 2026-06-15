import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HierarchyService {
  constructor(private prisma: PrismaService) {}

  private async checkCoursePermission(courseId: string, userId: string, role: string) {
    if (role === "ADMIN") return;
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (course?.created_by !== userId) throw new ForbiddenException("Only the course creator can perform this action at the course level");
  }

  private async checkSectionPermission(sectionId: string, userId: string, role: string) {
    if (role === "ADMIN") return;
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true, test_series: true, managers: true }
    });
    if (!section) throw new NotFoundException("Section not found");
    if (section.course?.created_by === userId) return;
    if (section.test_series?.created_by === userId) return;
    if (section.managers.some(m => m.id === userId)) return;
    throw new ForbiddenException("You are not authorized to manage this section");
  }

  private async checkTestSeriesPermission(testSeriesId: string, userId: string, role: string) {
    if (role === "ADMIN") return;
    const testSeries = await this.prisma.testSeries.findUnique({ where: { id: testSeriesId } });
    if (testSeries?.created_by !== userId) throw new ForbiddenException("Only the test series creator can perform this action at the test series level");
  }

  // Course
  createCourse(data: { name: string; code: string; description: string; created_by?: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: Date }) {
    return this.prisma.course.create({ data });
  }
  async updateCourse(id: string, userId: string, role: string, data: { name?: string; code?: string; description?: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: Date }) {
    await this.checkCoursePermission(id, userId, role);
    return this.prisma.course.update({ where: { id }, data });
  }
  private async preserveQuestions(params: { courseId?: string, testSeriesId?: string, sectionId?: string, chapterId?: string, topicId?: string }) {
    // Find all topics affected
    let topics: Array<{ id: string }> = [];
    if (params.topicId) {
      topics = [{ id: params.topicId }];
    } else if (params.chapterId) {
      topics = await this.prisma.topic.findMany({ where: { chapter_id: params.chapterId }, select: { id: true } });
    } else if (params.sectionId) {
      topics = await this.prisma.topic.findMany({ where: { chapter: { section_id: params.sectionId } }, select: { id: true } });
    } else if (params.courseId) {
      topics = await this.prisma.topic.findMany({ where: { chapter: { section: { course_id: params.courseId } } }, select: { id: true } });
    } else if (params.testSeriesId) {
      topics = await this.prisma.topic.findMany({ where: { chapter: { section: { test_series_id: params.testSeriesId } } }, select: { id: true } });
    }
    const topicIds = topics.map(t => t.id);
    if (topicIds.length === 0) return;

    // Check if there are any questions to preserve
    const qCount = await this.prisma.question.count({ where: { topic_id: { in: topicIds } } });
    if (qCount === 0) return;

    // Get or create Orphaned topic
    let orphanCourse = await this.prisma.course.findFirst({ where: { name: "Orphaned Questions (System)" } });
    if (!orphanCourse) {
      orphanCourse = await this.prisma.course.create({
        data: { name: "Orphaned Questions (System)", code: "ORPHAN", description: "System course for orphaned questions", status: "HIDDEN" }
      });
    }
    let orphanSection = await this.prisma.section.findFirst({ where: { course_id: orphanCourse.id } });
    if (!orphanSection) {
      orphanSection = await this.prisma.section.create({ data: { course_id: orphanCourse.id, name: "Orphaned Section", description: "", order: 1 } });
    }
    let orphanChapter = await this.prisma.chapter.findFirst({ where: { section_id: orphanSection.id } });
    if (!orphanChapter) {
      orphanChapter = await this.prisma.chapter.create({ data: { section_id: orphanSection.id, name: "Orphaned Chapter", description: "", order: 1 } });
    }
    let orphanTopic = await this.prisma.topic.findFirst({ where: { chapter_id: orphanChapter.id } });
    if (!orphanTopic) {
      orphanTopic = await this.prisma.topic.create({ data: { chapter_id: orphanChapter.id, name: "Orphaned Topic", description: "", order: 1 } });
    }

    // Move all questions from the deleted topics to the orphan topic, EXCEPT if the topic being deleted IS the orphan topic
    const idsToMove = topicIds.filter(id => id !== orphanTopic.id);
    if (idsToMove.length > 0) {
      await this.prisma.question.updateMany({
        where: { topic_id: { in: idsToMove } },
        data: { topic_id: orphanTopic.id }
      });
    }
  }

  async deleteCourse(id: string, userId: string, role: string) {
    await this.checkCoursePermission(id, userId, role);
    await this.preserveQuestions({ courseId: id });
    return this.prisma.course.delete({ where: { id } });
  }

  async deleteTestSeries(id: string, userId: string, role: string) {
    await this.checkTestSeriesPermission(id, userId, role);
    await this.preserveQuestions({ testSeriesId: id });
    return this.prisma.testSeries.delete({ where: { id } });
  }
  getCourses() {
    return this.prisma.course.findMany({ include: { sections: true }, orderBy: { created_at: 'asc' } });
  }

  // Section
  async createSection(userId: string, role: string, data: { course_id?: string; test_series_id?: string; name: string; description: string; order: number }) {
    if (data.course_id) {
      await this.checkCoursePermission(data.course_id, userId, role);
    } else if (data.test_series_id) {
      await this.checkTestSeriesPermission(data.test_series_id, userId, role);
    } else {
      throw new ForbiddenException("Either course_id or test_series_id must be provided");
    }
    return this.prisma.section.create({ data });
  }
  async updateSection(id: string, userId: string, role: string, data: { name?: string; description?: string; order?: number }) {
    await this.checkSectionPermission(id, userId, role);
    return this.prisma.section.update({ where: { id }, data });
  }
  getSections(courseId: string) {
    return this.prisma.section.findMany({ where: { course_id: courseId }, include: { chapters: true }, orderBy: { order: 'asc' } });
  }
  async deleteSection(id: string, userId: string, role: string) {
    await this.checkSectionPermission(id, userId, role);
    await this.preserveQuestions({ sectionId: id });
    return this.prisma.section.delete({ where: { id } });
  }

  // Chapter
  async createChapter(userId: string, role: string, data: { section_id: string; name: string; description: string; order: number }) {
    await this.checkSectionPermission(data.section_id, userId, role);
    return this.prisma.chapter.create({ data });
  }
  async updateChapter(id: string, userId: string, role: string, data: { name?: string; description?: string; order?: number }) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });
    if (!chapter) throw new NotFoundException();
    await this.checkSectionPermission(chapter.section_id, userId, role);
    return this.prisma.chapter.update({ where: { id }, data });
  }
  getChapters(sectionId: string) {
    return this.prisma.chapter.findMany({ where: { section_id: sectionId }, include: { topics: true }, orderBy: { order: 'asc' } });
  }
  async deleteChapter(id: string, userId: string, role: string) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });
    if (!chapter) throw new NotFoundException();
    await this.checkSectionPermission(chapter.section_id, userId, role);
    await this.preserveQuestions({ chapterId: id });
    return this.prisma.chapter.delete({ where: { id } });
  }

  async createTopic(userId: string, role: string, data: { chapter_id: string; name: string; description: string; order: number }) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id: data.chapter_id } });
    if (!chapter) throw new NotFoundException();
    await this.checkSectionPermission(chapter.section_id, userId, role);
    return this.prisma.topic.create({ data });
  }
  async updateTopic(id: string, userId: string, role: string, data: { name?: string; description?: string; order?: number }) {
    const topic = await this.prisma.topic.findUnique({ where: { id }, include: { chapter: true } });
    if (!topic) throw new NotFoundException();
    await this.checkSectionPermission(topic.chapter.section_id, userId, role);
    return this.prisma.topic.update({ where: { id }, data });
  }
  getTopics(chapterId: string) {
    return this.prisma.topic.findMany({ where: { chapter_id: chapterId }, orderBy: { order: 'asc' } });
  }
  async deleteTopic(id: string, userId: string, role: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id }, include: { chapter: true } });
    if (!topic) throw new NotFoundException();
    await this.checkSectionPermission(topic.chapter.section_id, userId, role);
    await this.preserveQuestions({ topicId: id });
    return this.prisma.topic.delete({ where: { id } });
  }

  // Enrollment
  async enrollCourse(courseId: string, userId: string) {
    try {
      const enrollment = await this.prisma.courseEnrollment.create({
        data: { course_id: courseId, user_id: userId }
      });
      // Sync legacy string field to prevent Admin overwrites
      await this.prisma.user.update({
        where: { id: userId },
        data: { course_enrolled: courseId }
      });
      return enrollment;
    } catch (e: any) {
      if (e.code === 'P2002') {
        return { message: "Already enrolled", alreadyEnrolled: true };
      }
      return { message: "Successfully enrolled" };
    }
  }

  async getCourseEnrollments(courseId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: { course_id: courseId },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
            profile_picture: true,
            created_at: true,
          }
        }
      },
      orderBy: { enrolled_at: 'desc' }
    });
  }

  async getTestSeriesEnrollments(seriesId: string) {
    return this.prisma.testSeriesEnrollment.findMany({
      where: { test_series_id: seriesId },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
            profile_picture: true,
            created_at: true,
          }
        }
      },
      orderBy: { enrolled_at: 'desc' }
    });
  }

  // Topic Progress
  async markNotesViewed(topicId: string, userId: string) {
    const progress = await this.prisma.topicProgress.upsert({
      where: { user_id_topic_id: { user_id: userId, topic_id: topicId } },
      create: { user_id: userId, topic_id: topicId, notes_viewed: true },
      update: { notes_viewed: true }
    });

    const notesCount = await this.prisma.note.count({ where: { topic_id: topicId, approval_status: 'APPROVED' } });
    const requireNotes = notesCount > 0;

    if ((progress.notes_viewed || !requireNotes) && progress.tests_completed && !progress.is_completed) {
      await this.prisma.topicProgress.update({
        where: { id: progress.id },
        data: { is_completed: true, completed_at: new Date() }
      });
    }
    return { success: true };
  }

  async markTestsCompleted(topicId: string, userId: string) {
    const progress = await this.prisma.topicProgress.upsert({
      where: { user_id_topic_id: { user_id: userId, topic_id: topicId } },
      create: { user_id: userId, topic_id: topicId, tests_completed: true },
      update: { tests_completed: true }
    });

    const notesCount = await this.prisma.note.count({ where: { topic_id: topicId, approval_status: 'APPROVED' } });
    const requireNotes = notesCount > 0;

    if ((progress.notes_viewed || !requireNotes) && progress.tests_completed && !progress.is_completed) {
      await this.prisma.topicProgress.update({
        where: { id: progress.id },
        data: { is_completed: true, completed_at: new Date() }
      });
    }
  }

  async getStudentProgress(userId: string) {
    return this.prisma.topicProgress.findMany({
      where: { user_id: userId }
    });
  }

  // Course Staff Management
  async assignCourseStaff(courseId: string, userId: string, role: string) {
    if (role !== "ADMIN") throw new ForbiddenException("Only admin can assign course staff");
    
    return this.prisma.courseStaff.upsert({
      where: { course_id_user_id: { course_id: courseId, user_id: userId } },
      update: {},
      create: { course_id: courseId, user_id: userId }
    });
  }

  async removeCourseStaff(courseId: string, userId: string, role: string) {
    if (role !== "ADMIN") throw new ForbiddenException("Only admin can remove course staff");
    
    return this.prisma.courseStaff.delete({
      where: { course_id_user_id: { course_id: courseId, user_id: userId } }
    });
  }

  async assignSectionManagers(sectionId: string, managerIds: string[], role: string) {
    if (role !== "ADMIN") throw new ForbiddenException("Only admin can assign section managers");
    
    return this.prisma.section.update({
      where: { id: sectionId },
      data: { managers: { set: managerIds.map(id => ({ id })) } }
    });
  }

  // Full Hierarchy
  async getFullHierarchy(userId?: string) {
    let userRole = null;
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      userRole = user?.role;
    }

    const courses = await this.prisma.course.findMany({
      where: userRole === 'STUDENT' ? { status: 'PUBLISHED' } : {},
      include: {
        _count: { select: { enrollments: true } },
        staff: {
          include: { user: { select: { id: true, first_name: true, last_name: true, email: true, role: true } } }
        },
        sections: {
          include: {
            managers: { select: { id: true, first_name: true, last_name: true, email: true } },
            chapters: {
              include: {
                topics: {
                  include: {
                    _count: { select: { notes: { where: { approval_status: 'APPROVED' } } } }
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    if (!userId) {
      return courses;
    }

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { user_id: userId }
    });
    const enrolledCourseMap = new Map<string, Date>();
    enrollments.forEach(e => enrolledCourseMap.set(e.course_id, e.enrolled_at));

    // Fetch user attempts
    const attempts = await this.prisma.attempt.findMany({
      where: { user_id: userId }
    });

    // Fetch user topic progress
    const progressRecords = await this.prisma.topicProgress.findMany({
      where: { user_id: userId }
    });
    const progressMap = new Map<string, any>();
    progressRecords.forEach(p => progressMap.set(p.topic_id, p));

    // We need to map attempts to topics. But attempts are tied to test_id.
    // Fetch all tests so we can map them.
    const tests = await this.prisma.test.findMany({
      select: { 
        id: true, 
        topic_id: true, 
        title: true,
        total_marks: true,
        passing_marks: true,
        _count: { select: { test_questions: true } }
      }
    });

    const topicTestsMap = new Map<string, any[]>(); // topicId -> Test[]
    tests.forEach(t => {
      if (t.topic_id) {
        const arr = topicTestsMap.get(t.topic_id) || [];
        arr.push(t);
        topicTestsMap.set(t.topic_id, arr);
      }
    });

    const totalAspirantsCounts = await this.prisma.attempt.groupBy({
      by: ['test_id'],
      _count: { _all: true }
    });
    const aspirantsCountMap = new Map<string, number>();
    totalAspirantsCounts.forEach(t => aspirantsCountMap.set(t.test_id, t._count._all));

    const latestAttemptMap = new Map<string, any>(); // testId -> latest attempt
    attempts.forEach(a => {
      const existing = latestAttemptMap.get(a.test_id);
      if (!existing || existing.started_at < a.started_at) {
        latestAttemptMap.set(a.test_id, a);
      }
    });

    // Attach data to the hierarchy
    return courses.map(course => {
      const isEnrolled = enrolledCourseMap.has(course.id);
      const enrolledAt = enrolledCourseMap.get(course.id);
      const mappedSections = course.sections.map(section => {
        const mappedChapters = section.chapters.map(chapter => {
          const mappedTopics = chapter.topics.map(topic => {
            const topicTests = topicTestsMap.get(topic.id) || [];
            
            const testsWithAttempts = topicTests.map(t => {
              const latestAttempt = latestAttemptMap.get(t.id);
              return {
                id: t.id,
                title: t.title,
                total_marks: t.total_marks,
                passing_marks: t.passing_marks,
                questions_count: t._count?.test_questions || 0,
                has_attempted: !!latestAttempt,
                latest_attempt_id: latestAttempt ? latestAttempt.id : null,
                score: latestAttempt ? latestAttempt.score : null,
                rank: latestAttempt ? latestAttempt.rank : null,
                total_aspirants: aspirantsCountMap.get(t.id) || 0,
              };
            });

            const firstTest = testsWithAttempts[0];
            const prog = progressMap.get(topic.id);

            return {
              ...topic,
              tests: testsWithAttempts,
              test_id: firstTest ? firstTest.id : null,
              has_attempted_tests: firstTest ? firstTest.has_attempted : false,
              latest_attempt_id: firstTest ? firstTest.latest_attempt_id : null,
              is_completed: prog?.is_completed || false,
              notes_viewed: prog?.notes_viewed || false,
              tests_completed: prog?.tests_completed || false,
              has_notes: (topic._count?.notes || 0) > 0
            };
          });
          return { ...chapter, topics: mappedTopics };
        });
        return { ...section, chapters: mappedChapters };
      });
      return { 
        ...course, 
        is_enrolled: isEnrolled, 
        enrolled_at: enrolledAt ? enrolledAt.toISOString() : null,
        sections: mappedSections,
        enrollment_count: course._count?.enrollments || 0 
      };
    });
  }

  // Full Hierarchy for Test Series
  async getTestSeriesHierarchy(userId?: string) {
    let userRole = null;
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      userRole = user?.role;
    }

    const testSeriesList = await this.prisma.testSeries.findMany({
      where: userRole === 'STUDENT' ? { status: 'PUBLISHED' } : {},
      include: {
        _count: { select: { enrollments: true } },
        staff: {
          include: { user: { select: { id: true, first_name: true, last_name: true, email: true, role: true } } }
        },
        sections: {
          include: {
            managers: { select: { id: true, first_name: true, last_name: true, email: true } },
            chapters: {
              include: {
                topics: {
                  include: {
                    _count: { select: { notes: { where: { approval_status: 'APPROVED' } } } }
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    if (!userId) {
      return testSeriesList;
    }

    const enrollments = await this.prisma.testSeriesEnrollment.findMany({
      where: { user_id: userId }
    });
    const enrolledSeriesMap = new Map<string, Date>();
    enrollments.forEach(e => enrolledSeriesMap.set(e.test_series_id, e.enrolled_at));

    // Fetch user attempts
    const attempts = await this.prisma.attempt.findMany({
      where: { user_id: userId }
    });

    // Fetch user topic progress
    const progressRecords = await this.prisma.topicProgress.findMany({
      where: { user_id: userId }
    });
    const progressMap = new Map<string, any>();
    progressRecords.forEach(p => progressMap.set(p.topic_id, p));

    const tests = await this.prisma.test.findMany({
      select: { 
        id: true, 
        topic_id: true, 
        title: true,
        total_marks: true,
        passing_marks: true,
        _count: { select: { test_questions: true } }
      }
    });

    const topicTestsMap = new Map<string, any[]>();
    tests.forEach(t => {
      if (t.topic_id) {
        const arr = topicTestsMap.get(t.topic_id) || [];
        arr.push(t);
        topicTestsMap.set(t.topic_id, arr);
      }
    });

    const totalAspirantsCountsTS = await this.prisma.attempt.groupBy({
      by: ['test_id'],
      _count: { _all: true }
    });
    const aspirantsCountMapTS = new Map<string, number>();
    totalAspirantsCountsTS.forEach(t => aspirantsCountMapTS.set(t.test_id, t._count._all));

    const latestAttemptMap = new Map<string, any>();
    attempts.forEach(a => {
      const existing = latestAttemptMap.get(a.test_id);
      if (!existing || existing.started_at < a.started_at) {
        latestAttemptMap.set(a.test_id, a);
      }
    });

    return testSeriesList.map(series => {
      const isEnrolled = enrolledSeriesMap.has(series.id);
      const enrolledAt = enrolledSeriesMap.get(series.id);
      const mappedSections = series.sections.map(section => {
        const mappedChapters = section.chapters.map(chapter => {
          const mappedTopics = chapter.topics.map(topic => {
            const topicTests = topicTestsMap.get(topic.id) || [];
            
            const testsWithAttempts = topicTests.map(t => {
              const latestAttempt = latestAttemptMap.get(t.id);
              return {
                id: t.id,
                title: t.title,
                total_marks: t.total_marks,
                passing_marks: t.passing_marks,
                questions_count: t._count?.test_questions || 0,
                has_attempted: !!latestAttempt,
                latest_attempt_id: latestAttempt ? latestAttempt.id : null,
                score: latestAttempt ? latestAttempt.score : null,
                rank: latestAttempt ? latestAttempt.rank : null,
                total_aspirants: aspirantsCountMapTS.get(t.id) || 0,
              };
            });

            const firstTest = testsWithAttempts[0];
            const prog = progressMap.get(topic.id);

            return {
              ...topic,
              tests: testsWithAttempts,
              test_id: firstTest ? firstTest.id : null,
              has_attempted_tests: firstTest ? firstTest.has_attempted : false,
              latest_attempt_id: firstTest ? firstTest.latest_attempt_id : null,
              is_completed: prog?.is_completed || false,
              notes_viewed: prog?.notes_viewed || false,
              tests_completed: prog?.tests_completed || false,
              has_notes: (topic._count?.notes || 0) > 0
            };
          });
          return { ...chapter, topics: mappedTopics };
        });
        return { ...section, chapters: mappedChapters };
      });
      return { 
        ...series, 
        is_enrolled: isEnrolled, 
        enrolled_at: enrolledAt ? enrolledAt.toISOString() : null,
        sections: mappedSections,
        enrollment_count: series._count?.enrollments || 0 
      };
    });
  }

  // Bulk Reorder
  async reorderHierarchy(items: { id: string; type: 'SECTION' | 'CHAPTER' | 'TOPIC'; order: number }[]) {
    return this.prisma.$transaction(
      items.map((item) => {
        if (item.type === 'SECTION') {
          return this.prisma.section.update({
            where: { id: item.id },
            data: { order: item.order }
          });
        } else if (item.type === 'CHAPTER') {
          return this.prisma.chapter.update({
            where: { id: item.id },
            data: { order: item.order }
          });
        } else if (item.type === 'TOPIC') {
          return this.prisma.topic.update({
            where: { id: item.id },
            data: { order: item.order }
          });
        }
        throw new NotFoundException(`Invalid item type: ${item.type}`);
      })
    );
  }
}
