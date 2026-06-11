import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async createNote(data: { topic_id: string; title: string; content_html: string }, userId: string, role: string) {
    // Interns go to PENDING_REVIEW, Teachers/Admins go to APPROVED
    const status = role === "INTERN" ? "PENDING_REVIEW" : "APPROVED";

    return this.prisma.note.create({
      data: {
        ...data,
        created_by: userId,
        approval_status: status,
        ...(status === "APPROVED" && { approved_by: userId, approved_at: new Date() }),
      },
    });
  }

  async updateNote(noteId: string, data: { title?: string; content_html?: string }, userId: string, role: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    if (role === "TEACHER" && note.created_by !== userId) {
      throw new BadRequestException("You can only edit notes that you have created");
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content_html && { content_html: data.content_html }),
      }
    });
  }

  async getPendingNotes(userId: string, role: string) {
    if (role === "TEACHER") {
      // Get interns assigned to this teacher
      const interns = await this.prisma.user.findMany({
        where: { assigned_teacher_id: userId },
        select: { id: true },
      });
      const internIds = interns.map(i => i.id);

      return this.prisma.note.findMany({
        where: {
          approval_status: "PENDING_REVIEW",
          created_by: { in: internIds },
        },
        include: { topic: { include: { chapter: { include: { section: { include: { course: true } } } } } } }
      });
    }

    if (role === "ADMIN") {
      return this.prisma.note.findMany({
        where: { approval_status: "PENDING_REVIEW" },
        include: { topic: { include: { chapter: { include: { section: { include: { course: true } } } } } } }
      });
    }

    return [];
  }

  async reviewNote(noteId: string, status: "APPROVED" | "REJECTED", reviewerId: string, rejectionNote?: string, contentHtml?: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        approval_status: status,
        approved_by: status === "APPROVED" ? reviewerId : null,
        approved_at: status === "APPROVED" ? new Date() : null,
        rejection_note: status === "REJECTED" ? rejectionNote : null,
        ...(contentHtml && { content_html: contentHtml }),
      },
    });

    if (status === "APPROVED" && note.created_by) {
      await this.prisma.userStats.upsert({
        where: { user_id: note.created_by },
        update: { total_score: { increment: 5 } },
        create: { user_id: note.created_by, total_score: 5 }
      });
    }

    return updated;
  }

  async getApprovedNotesByTopic(topicId: string) {
    return this.prisma.note.findMany({
      where: { topic_id: topicId, approval_status: "APPROVED" },
      orderBy: { created_at: "asc" }
    });
  }

  async listNotes(
    filters: { intern_only?: string; teacher_id?: string; admin_search?: boolean; search?: string },
    skip = 0,
    take = 20
  ) {
    const where: any = {};

    if (filters.intern_only) {
      where.created_by = filters.intern_only;
    }
    
    if (filters.teacher_id) {
      const interns = await this.prisma.user.findMany({
        where: { assigned_teacher_id: filters.teacher_id },
        select: { id: true },
      });
      const internIds = interns.map(i => i.id);
      where.created_by = { in: [filters.teacher_id, ...internIds] };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { id: filters.search }
      ];
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          topic: { include: { chapter: { include: { section: { include: { course: true } } } } } }
        }
      }),
      this.prisma.note.count({ where })
    ]);

    return { data: notes, total, skip, take };
  }
}
