import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from "@nestjs/common";
import { HierarchyService } from "./hierarchy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("admin/hierarchy")
@UseGuards(JwtAuthGuard, RolesGuard)
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get()
  @Roles("TEACHER", "ADMIN", "INTERN", "STUDENT")
  getFullHierarchy(@Request() req: any) {
    return this.hierarchyService.getFullHierarchy(req.user.sub);
  }

  @Get("test-series")
  @Roles("TEACHER", "ADMIN", "INTERN", "STUDENT")
  getTestSeriesHierarchy(@Request() req: any) {
    return this.hierarchyService.getTestSeriesHierarchy(req.user.sub);
  }

  @Post("reorder")
  @Roles("TEACHER", "ADMIN")
  reorderHierarchy(@Body() items: { id: string; type: 'SECTION' | 'CHAPTER' | 'TOPIC'; order: number }[]) {
    return this.hierarchyService.reorderHierarchy(items);
  }

  @Post("courses")
  @Roles("TEACHER", "ADMIN")
  createCourse(@Request() req: any, @Body() data: { name: string; code: string; description: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: Date }) {
    return this.hierarchyService.createCourse({ ...data, created_by: req.user.sub });
  }

  @Post("courses/:id/enroll")
  @Roles("STUDENT", "INTERN", "TEACHER", "ADMIN")
  enrollCourse(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.enrollCourse(id, req.user.sub);
  }

  @Get("courses/:id/enrollments")
  @Roles("ADMIN", "TEACHER")
  getCourseEnrollments(@Param("id") id: string) {
    return this.hierarchyService.getCourseEnrollments(id);
  }

  @Get("test-series/:id/enrollments")
  @Roles("ADMIN", "TEACHER")
  getTestSeriesEnrollments(@Param("id") id: string) {
    return this.hierarchyService.getTestSeriesEnrollments(id);
  }

  @Patch("courses/:id")
  @Roles("TEACHER", "ADMIN")
  updateCourse(@Param("id") id: string, @Request() req: any, @Body() data: { name?: string; code?: string; description?: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: Date }) {
    return this.hierarchyService.updateCourse(id, req.user.sub, req.user.role, data);
  }

  @Delete("courses/:id")
  @Roles("ADMIN")
  deleteCourse(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.deleteCourse(id, req.user.sub, req.user.role);
  }

  @Delete("test-series/:id")
  @Roles("ADMIN")
  deleteTestSeries(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.deleteTestSeries(id, req.user.sub, req.user.role);
  }

  @Post("courses/:id/staff")
  @Roles("ADMIN")
  assignCourseStaff(@Param("id") id: string, @Request() req: any, @Body() data: { user_id: string }) {
    return this.hierarchyService.assignCourseStaff(id, data.user_id, req.user.role);
  }

  @Delete("courses/:id/staff/:userId")
  @Roles("ADMIN")
  removeCourseStaff(@Param("id") id: string, @Param("userId") userId: string, @Request() req: any) {
    return this.hierarchyService.removeCourseStaff(id, userId, req.user.role);
  }

  @Post("sections")
  @Roles("TEACHER", "ADMIN")
  createSection(@Request() req: any, @Body() data: { course_id: string; name: string; description: string; order: number }) {
    return this.hierarchyService.createSection(req.user.sub, req.user.role, data);
  }

  @Patch("sections/:id")
  @Roles("INTERN", "TEACHER", "ADMIN")
  updateSection(@Param("id") id: string, @Request() req: any, @Body() data: { name?: string; description?: string; order?: number }) {
    return this.hierarchyService.updateSection(id, req.user.sub, req.user.role, data);
  }

  @Patch("sections/:id/assign")
  @Roles("ADMIN")
  assignSectionManagers(@Param("id") id: string, @Request() req: any, @Body() data: { manager_ids: string[] }) {
    return this.hierarchyService.assignSectionManagers(id, data.manager_ids || [], req.user.role);
  }

  @Delete("sections/:id")
  @Roles("TEACHER", "ADMIN")
  deleteSection(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.deleteSection(id, req.user.sub, req.user.role);
  }

  @Post("chapters")
  @Roles("INTERN", "TEACHER", "ADMIN")
  createChapter(@Request() req: any, @Body() data: { section_id: string; name: string; description: string; order: number }) {
    return this.hierarchyService.createChapter(req.user.sub, req.user.role, data);
  }

  @Patch("chapters/:id")
  @Roles("INTERN", "TEACHER", "ADMIN")
  updateChapter(@Param("id") id: string, @Request() req: any, @Body() data: { name?: string; description?: string; order?: number }) {
    return this.hierarchyService.updateChapter(id, req.user.sub, req.user.role, data);
  }

  @Delete("chapters/:id")
  @Roles("INTERN", "TEACHER", "ADMIN")
  deleteChapter(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.deleteChapter(id, req.user.sub, req.user.role);
  }

  @Post("topics")
  @Roles("INTERN", "TEACHER", "ADMIN")
  createTopic(@Request() req: any, @Body() data: { chapter_id: string; name: string; description: string; order: number }) {
    return this.hierarchyService.createTopic(req.user.sub, req.user.role, data);
  }

  @Patch("topics/:id")
  @Roles("INTERN", "TEACHER", "ADMIN")
  updateTopic(@Param("id") id: string, @Request() req: any, @Body() data: { name?: string; description?: string; order?: number }) {
    return this.hierarchyService.updateTopic(id, req.user.sub, req.user.role, data);
  }

  @Delete("topics/:id")
  @Roles("INTERN", "TEACHER", "ADMIN")
  deleteTopic(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.deleteTopic(id, req.user.sub, req.user.role);
  }

  @Post("topics/:id/view-notes")
  @Roles("STUDENT", "INTERN", "TEACHER", "ADMIN")
  viewNotes(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.markNotesViewed(id, req.user.sub);
  }
}
