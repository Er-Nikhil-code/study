import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async createNote(data: { topic_id: string; title: string; pdf_url: string }, userId: string, role: string) {
    if (role !== "ADMIN" && role !== "TEACHER") {
      throw new BadRequestException("Only Admins and Teachers can create notes");
    }

    return this.prisma.note.create({
      data: {
        topic_id: data.topic_id,
        title: data.title,
        pdf_url: data.pdf_url,
        created_by: userId,
      },
    });
  }

  async updateNote(noteId: string, data: { title?: string; pdf_url?: string; topic_id?: string }, userId: string, role: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    if (role !== "ADMIN" && note.created_by !== userId) {
      throw new BadRequestException("You can only edit notes that you have created");
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.pdf_url && { pdf_url: data.pdf_url }),
        ...(data.topic_id && { topic_id: data.topic_id }),
      },
      include: {
        topic: { include: { chapter: { include: { section: { include: { course: true } } } } } }
      }
    });
  }

  async getNoteById(noteId: string, userId: string, role: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: {
        topic: { include: { chapter: { include: { section: { include: { course: true } } } } } }
      }
    });
    if (!note) throw new NotFoundException("Note not found");
    return note;
  }

  async getNotesByTopic(topicId: string) {
    return this.prisma.note.findMany({
      where: { topic_id: topicId },
      orderBy: { created_at: "asc" }
    });
  }

  async listNotes(
    filters: { teacher_id?: string; admin_search?: boolean; search?: string },
    skip = 0,
    take = 20
  ) {
    const where: any = {};

    if (filters.teacher_id) {
      where.created_by = filters.teacher_id;
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

  async deleteNote(noteId: string, userId: string, role: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    if (role !== "ADMIN" && note.created_by !== userId) {
      throw new BadRequestException("You can only delete your own notes");
    }

    return this.prisma.note.delete({ where: { id: noteId } });
  }
}
