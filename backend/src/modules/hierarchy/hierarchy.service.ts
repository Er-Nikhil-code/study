import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HierarchyService {
  constructor(private prisma: PrismaService) {}

  // Course
  createCourse(data: { name: string; code: string }) {
    return this.prisma.course.create({ data });
  }
  getCourses() {
    return this.prisma.course.findMany({ include: { sections: true }, orderBy: { created_at: 'asc' } });
  }

  // Section
  createSection(data: { course_id: string; name: string; order: number }) {
    return this.prisma.section.create({ data });
  }
  getSections(courseId: string) {
    return this.prisma.section.findMany({ where: { course_id: courseId }, include: { chapters: true }, orderBy: { order: 'asc' } });
  }

  // Chapter
  createChapter(data: { section_id: string; name: string; order: number }) {
    return this.prisma.chapter.create({ data });
  }
  getChapters(sectionId: string) {
    return this.prisma.chapter.findMany({ where: { section_id: sectionId }, include: { topics: true }, orderBy: { order: 'asc' } });
  }

  // Topic
  createTopic(data: { chapter_id: string; name: string; order: number }) {
    return this.prisma.topic.create({ data });
  }
  getTopics(chapterId: string) {
    return this.prisma.topic.findMany({ where: { chapter_id: chapterId }, orderBy: { order: 'asc' } });
  }

  // Full Hierarchy
  getFullHierarchy() {
    return this.prisma.course.findMany({
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
  }
}
