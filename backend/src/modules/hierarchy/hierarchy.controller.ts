import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { HierarchyService } from "./hierarchy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("admin/hierarchy")
@UseGuards(JwtAuthGuard, RolesGuard)
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get()
  @Roles("TEACHER", "ADMIN", "INTERN")
  getFullHierarchy() {
    return this.hierarchyService.getFullHierarchy();
  }

  @Post("courses")
  @Roles("TEACHER", "ADMIN")
  createCourse(@Body() data: { name: string; code: string }) {
    return this.hierarchyService.createCourse(data);
  }

  @Post("sections")
  @Roles("TEACHER", "ADMIN")
  createSection(@Body() data: { course_id: string; name: string; order: number }) {
    return this.hierarchyService.createSection(data);
  }

  @Post("chapters")
  @Roles("TEACHER", "ADMIN")
  createChapter(@Body() data: { section_id: string; name: string; order: number }) {
    return this.hierarchyService.createChapter(data);
  }

  @Post("topics")
  @Roles("TEACHER", "ADMIN")
  createTopic(@Body() data: { chapter_id: string; name: string; order: number }) {
    return this.hierarchyService.createTopic(data);
  }
}
