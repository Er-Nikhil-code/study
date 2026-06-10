import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from "@nestjs/common";
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

  @Post("courses")
  @Roles("TEACHER", "ADMIN")
  createCourse(@Request() req: any, @Body() data: { name: string; code: string }) {
    return this.hierarchyService.createCourse({ ...data, created_by: req.user.id });
  }

  @Post("courses/:id/enroll")
  @Roles("STUDENT", "INTERN", "TEACHER", "ADMIN")
  enrollCourse(@Param("id") id: string, @Request() req: any) {
    return this.hierarchyService.enrollCourse(id, req.user.sub);
  }

  @Patch("courses/:id")
  @Roles("TEACHER", "ADMIN")
  updateCourse(@Param("id") id: string, @Body() data: { name?: string; code?: string }) {
    return this.hierarchyService.updateCourse(id, data);
  }

  @Post("sections")
  @Roles("TEACHER", "ADMIN")
  createSection(@Body() data: { course_id: string; name: string; order: number }) {
    return this.hierarchyService.createSection(data);
  }

  @Patch("sections/:id")
  @Roles("TEACHER", "ADMIN")
  updateSection(@Param("id") id: string, @Body() data: { name?: string; order?: number }) {
    return this.hierarchyService.updateSection(id, data);
  }

  @Post("chapters")
  @Roles("TEACHER", "ADMIN")
  createChapter(@Body() data: { section_id: string; name: string; order: number }) {
    return this.hierarchyService.createChapter(data);
  }

  @Patch("chapters/:id")
  @Roles("TEACHER", "ADMIN")
  updateChapter(@Param("id") id: string, @Body() data: { name?: string; order?: number }) {
    return this.hierarchyService.updateChapter(id, data);
  }

  @Post("topics")
  @Roles("TEACHER", "ADMIN")
  createTopic(@Body() data: { chapter_id: string; name: string; description?: string; order: number }) {
    return this.hierarchyService.createTopic(data);
  }

  @Patch("topics/:id")
  @Roles("TEACHER", "ADMIN")
  updateTopic(@Param("id") id: string, @Body() data: { name?: string; description?: string; order?: number }) {
    return this.hierarchyService.updateTopic(id, data);
  }
}
