import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HierarchyService {
  constructor(private prisma: PrismaService) {}

  // Course
  createCourse(data: { name: string; code: string; description: string; created_by?: string }) {
    return this.prisma.course.create({ data });
  }
  updateCourse(id: string, data: { name?: string; code?: string; description?: string }) {
    return this.prisma.course.update({ where: { id }, data });
  }
  deleteCourse(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }
  getCourses() {
    return this.prisma.course.findMany({ include: { sections: true }, orderBy: { created_at: 'asc' } });
  }

  // Section
  createSection(data: { course_id: string; name: string; description: string; order: number }) {
    return this.prisma.section.create({ data });
  }
  updateSection(id: string, data: { name?: string; description?: string; order?: number }) {
    return this.prisma.section.update({ where: { id }, data });
  }
  getSections(courseId: string) {
    return this.prisma.section.findMany({ where: { course_id: courseId }, include: { chapters: true }, orderBy: { order: 'asc' } });
  }

  // Chapter
  createChapter(data: { section_id: string; name: string; description: string; order: number }) {
    return this.prisma.chapter.create({ data });
  }
  updateChapter(id: string, data: { name?: string; description?: string; order?: number }) {
    return this.prisma.chapter.update({ where: { id }, data });
  }
  getChapters(sectionId: string) {
    return this.prisma.chapter.findMany({ where: { section_id: sectionId }, include: { topics: true }, orderBy: { order: 'asc' } });
  }

  createTopic(data: { chapter_id: string; name: string; description: string; order: number }) {
    return this.prisma.topic.create({ data });
  }
  updateTopic(id: string, data: { name?: string; description?: string; order?: number }) {
    return this.prisma.topic.update({ where: { id }, data });
  }
  getTopics(chapterId: string) {
    return this.prisma.topic.findMany({ where: { chapter_id: chapterId }, orderBy: { order: 'asc' } });
  }

  // Enrollment
  async enrollCourse(courseId: string, userId: string) {
    try {
      return await this.prisma.courseEnrollment.create({
        data: { course_id: courseId, user_id: userId }
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        return { message: "Already enrolled", alreadyEnrolled: true };
      }
      return { message: "Successfully enrolled" };
    }
  }

  // Topic Progress
  async markNotesViewed(topicId: string, userId: string) {
    const progress = await this.prisma.topicProgress.upsert({
      where: { user_id_topic_id: { user_id: userId, topic_id: topicId } },
      create: { user_id: userId, topic_id: topicId, notes_viewed: true },
      update: { notes_viewed: true }
    });

    if (progress.notes_viewed && progress.tests_completed && !progress.is_completed) {
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

    if (progress.notes_viewed && progress.tests_completed && !progress.is_completed) {
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

  // Full Hierarchy
  async getFullHierarchy(userId?: string) {
    const courses = await this.prisma.course.findMany({
      include: {
        sections: {
          include: {
            chapters: {
              include: {
                topics: true
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

    // Fetch user enrollments
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { user_id: userId }
    });
    const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));

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
      select: { id: true, topic_id: true, title: true }
    });

    const topicTestsMap = new Map<string, any[]>(); // topicId -> Test[]
    tests.forEach(t => {
      const arr = topicTestsMap.get(t.topic_id) || [];
      arr.push(t);
      topicTestsMap.set(t.topic_id, arr);
    });

    const latestAttemptMap = new Map<string, any>(); // testId -> latest attempt
    attempts.forEach(a => {
      const existing = latestAttemptMap.get(a.test_id);
      if (!existing || existing.started_at < a.started_at) {
        latestAttemptMap.set(a.test_id, a);
      }
    });

    // Attach data to the hierarchy
    return courses.map(course => {
      const isEnrolled = enrolledCourseIds.has(course.id);
      const mappedSections = course.sections.map(section => {
        const mappedChapters = section.chapters.map(chapter => {
          const mappedTopics = chapter.topics.map(topic => {
            const topicTests = topicTestsMap.get(topic.id) || [];
            
            const testsWithAttempts = topicTests.map(t => {
              const latestAttempt = latestAttemptMap.get(t.id);
              return {
                id: t.id,
                title: t.title,
                has_attempted: !!latestAttempt,
                latest_attempt_id: latestAttempt ? latestAttempt.id : null
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
              tests_completed: prog?.tests_completed || false
            };
          });
          return { ...chapter, topics: mappedTopics };
        });
        return { ...section, chapters: mappedChapters };
      });
      return { ...course, is_enrolled: isEnrolled, sections: mappedSections };
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
