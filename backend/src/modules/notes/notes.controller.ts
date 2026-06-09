import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from "@nestjs/common";
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
    return this.notesService.createNote(data, req.user.userId, req.user.role);
  }

  @Get("pending")
  @Roles("TEACHER", "ADMIN")
  getPendingNotes(@Req() req: any) {
    return this.notesService.getPendingNotes(req.user.userId, req.user.role);
  }

  @Patch(":id/review")
  @Roles("TEACHER", "ADMIN")
  reviewNote(
    @Param("id") id: string,
    @Body() data: { status: "APPROVED" | "REJECTED"; rejection_note?: string },
    @Req() req: any
  ) {
    return this.notesService.reviewNote(id, data.status, req.user.userId, data.rejection_note);
  }

  @Get("topic/:topicId")
  @Roles("STUDENT", "INTERN", "TEACHER", "ADMIN")
  getApprovedNotes(@Param("topicId") topicId: string) {
    return this.notesService.getApprovedNotesByTopic(topicId);
  }
}
