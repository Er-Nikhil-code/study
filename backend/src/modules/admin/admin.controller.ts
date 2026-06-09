import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * GET /api/admin/dashboard/stats
   * Live dashboard statistics
   */
  @Get("dashboard/stats")
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * GET /api/admin/users
   * Paginated user list with search and role filter
   */
  @Get("users")
  async getUsers(
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.adminService.getUsers({
      search,
      role,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  /**
   * PATCH /api/admin/users/:id
   * Update user role or details
   */
  @Patch("users/:id")
  async updateUser(
    @Param("id") id: string,
    @Body() body: { role?: string; first_name?: string; last_name?: string; assigned_teacher_id?: string | null; is_active?: boolean },
  ) {
    return this.adminService.updateUser(id, body);
  }

  /**
   * DELETE /api/admin/users/:id
   * Delete a user
   */
  @Delete("users/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param("id") id: string) {
    await this.adminService.deleteUser(id);
  }

  /**
   * GET /api/admin/questions
   * Paginated questions with search and filters
   */
  @Get("questions")
  async getQuestions(
    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("topic_id") topicId?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.adminService.getQuestions({
      search,
      type,
      difficulty,
      topic_id: topicId,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  /**
   * DELETE /api/admin/questions/:id
   * Force-delete a question (admin override)
   */
  @Delete("questions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param("id") id: string) {
    await this.adminService.deleteQuestion(id);
  }

  /* ─── Custom Roles ─── */
  @Get("roles")
  async getRoles(
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.adminService.getRoles({
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
  }

  @Get("roles/hierarchy")
  async getRoleHierarchy() {
    return this.adminService.getRoleHierarchy();
  }

  @Post("roles")
  async createRole(@Body() body: any) {
    return this.adminService.createRole(body);
  }

  @Patch("roles/:id")
  async updateRole(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateRole(id, body);
  }

  @Delete("roles/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param("id") id: string) {
    await this.adminService.deleteRole(id);
  }

  @Post("roles/assign")
  @HttpCode(HttpStatus.OK)
  async assignRole(@Body() body: { userId: string; roleName: string }) {
    await this.adminService.assignRole(body.userId, body.roleName);
  }

  /* ─── Audit Logs ─── */
  @Get("audit-logs")
  async getAuditLogs(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.adminService.getAuditLogs({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
  }
}
