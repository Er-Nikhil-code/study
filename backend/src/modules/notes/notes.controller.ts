import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from "@nestjs/common";
import { NotesService } from "./notes.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("notes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @Roles("TEACHER", "ADMIN")
  createNote(@Body() data: { topic_id: string; title: string; pdf_url: string }, @Req() req: any) {
    return this.notesService.createNote(data, req.user.userId || req.user.sub, req.user.role);
  }

  @Get()
  @Roles("TEACHER", "ADMIN")
  getNotes(
    @Req() req: any,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const filters: any = {};
    if (req.user.role === "TEACHER") {
      filters.teacher_id = req.user.userId || req.user.sub;
    } else if (req.user.role === "ADMIN") {
      filters.admin_search = true;
    }

    if (search) filters.search = search;

    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;

    return this.notesService.listNotes(filters, skipNum, takeNum);
  }

  @Get(":id")
  @Roles("TEACHER", "ADMIN")
  getNoteById(@Param("id") id: string, @Req() req: any) {
    return this.notesService.getNoteById(id, req.user.userId || req.user.sub, req.user.role);
  }

  @Patch(":id")
  @Roles("TEACHER", "ADMIN")
  updateNote(
    @Param("id") id: string,
    @Body() data: { title?: string; pdf_url?: string; topic_id?: string },
    @Req() req: any
  ) {
    return this.notesService.updateNote(id, data, req.user.userId || req.user.sub, req.user.role);
  }

  @Get("topic/:topicId")
  @Roles("STUDENT", "TEACHER", "ADMIN")
  getNotesByTopic(@Param("topicId") topicId: string) {
    return this.notesService.getNotesByTopic(topicId);
  }

  @Delete(":id")
  @Roles("TEACHER", "ADMIN")
  deleteNote(@Param("id") id: string, @Req() req: any) {
    return this.notesService.deleteNote(id, req.user.userId || req.user.sub, req.user.role);
  }
}
