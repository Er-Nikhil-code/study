import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from "@nestjs/common";
import { NotesService } from "./notes.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("notes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @Roles("INTERN", "TEACHER", "ADMIN")
  createNote(@Body() data: { topic_id: string; title: string; content_html: string }, @Req() req: any) {
    return this.notesService.createNote(data, req.user.userId || req.user.sub, req.user.role);
  }

  @Get()
  @Roles("INTERN", "TEACHER", "ADMIN")
  getNotes(
    @Req() req: any,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const filters: any = {};
    if (req.user.role === "INTERN") {
      filters.intern_only = req.user.userId || req.user.sub;
    } else if (req.user.role === "TEACHER") {
      filters.teacher_id = req.user.userId || req.user.sub;
    } else if (req.user.role === "ADMIN") {
      filters.admin_search = true;
    }

    if (search) filters.search = search;

    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;

    return this.notesService.listNotes(filters, skipNum, takeNum);
  }

  @Get("pending")
  @Roles("TEACHER", "ADMIN")
  getPendingNotes(@Req() req: any) {
    return this.notesService.getPendingNotes(req.user.userId || req.user.sub, req.user.role);
  }

  @Patch(":id/review")
  @Roles("TEACHER", "ADMIN")
  reviewNote(
    @Param("id") id: string,
    @Body() data: { status: "APPROVED" | "REJECTED"; rejection_note?: string; content_html?: string },
    @Req() req: any
  ) {
    return this.notesService.reviewNote(id, data.status, req.user.userId || req.user.sub, data.rejection_note, data.content_html);
  }

  @Get("topic/:topicId")
  @Roles("STUDENT", "INTERN", "TEACHER", "ADMIN")
  getApprovedNotes(@Param("topicId") topicId: string) {
    return this.notesService.getApprovedNotesByTopic(topicId);
  }
}
