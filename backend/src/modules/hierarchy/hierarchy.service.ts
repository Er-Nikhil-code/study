import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HierarchyService {
  constructor(private prisma: PrismaService) {}

  // Course
  createCourse(data: { name: string; code: string; created_by?: string }) {
    return this.prisma.course.create({ data });
  }
  updateCourse(id: string, data: { name?: string; code?: string }) {
    return this.prisma.course.update({ where: { id }, data });
  }
  getCourses() {
    return this.prisma.course.findMany({ include: { sections: true }, orderBy: { created_at: 'asc' } });
  }

  // Section
  createSection(data: { course_id: string; name: string; order: number }) {
    return this.prisma.section.create({ data });
  }
  updateSection(id: string, data: { name?: string; order?: number }) {
    return this.prisma.section.update({ where: { id }, data });
  }
  getSections(courseId: string) {
    return this.prisma.section.findMany({ where: { course_id: courseId }, include: { chapters: true }, orderBy: { order: 'asc' } });
  }

  // Chapter
  createChapter(data: { section_id: string; name: string; order: number }) {
    return this.prisma.chapter.create({ data });
  }
  updateChapter(id: string, data: { name?: string; order?: number }) {
    return this.prisma.chapter.update({ where: { id }, data });
  }
  getChapters(sectionId: string) {
    return this.prisma.chapter.findMany({ where: { section_id: sectionId }, include: { topics: true }, orderBy: { order: 'asc' } });
  }

  // Topic
  createTopic(data: { chapter_id: string; name: string; description?: string; order: number }) {
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
      throw e;
    }
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
    
    // We need to map attempts to topics. But attempts are tied to test_id.
    // Fetch all tests so we can map them.
    const tests = await this.prisma.test.findMany({
      select: { id: true, topic_id: true }
    });

    const topicTestsMap = new Map<string, string>(); // topicId -> testId (assuming 1 test per topic)
    tests.forEach(t => topicTestsMap.set(t.topic_id, t.id));

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
            const testId = topicTestsMap.get(topic.id);
            const latestAttempt = testId ? latestAttemptMap.get(testId) : null;
            return {
              ...topic,
              test_id: testId || null,
              has_attempted_tests: !!latestAttempt,
              latest_attempt_id: latestAttempt ? latestAttempt.id : null
            };
          });
          return { ...chapter, topics: mappedTopics };
        });
        return { ...section, chapters: mappedChapters };
      });
      return { ...course, is_enrolled: isEnrolled, sections: mappedSections };
    });
  }
}
