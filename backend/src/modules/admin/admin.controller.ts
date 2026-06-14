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
  Request,
  Header,
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
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
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
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getUsers({
      search,
      role,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
  }

  /**
   * GET /api/admin/users/:id
   * Get detailed profile of a user
   */
  @Get("users/:id")
  async getUserById(@Param("id") id: string) {
    return this.adminService.getUserById(id);
  }

  /**
   * POST /api/admin/users
   * Create a new user (e.g. Intern) directly from Admin panel
   */
  @Post("users")
  async createUser(@Body() body: any) {
    return this.adminService.createUser(body);
  }

  /**
   * PATCH /api/admin/users/:id
   * Update user role or details
   */
  @Patch("users/:id")
  async updateUser(
    @Param("id") id: string,
    @Body() body: { role?: string; first_name?: string; last_name?: string; assigned_teacher_id?: string | null; is_active?: boolean; custom_role_id?: string | null; course_enrolled?: string | null; add_enrollment?: string[]; remove_enrollment?: string[] },
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
   * POST /api/admin/notifications
   * Send a manual custom notification to a specific user
   */
  @Post("notifications")
  async sendNotification(
    @Request() req: any,
    @Body() body: { user_id: string; title: string; message: string }
  ) {
    return this.adminService.sendNotification(body.user_id, body.title, body.message, req.user.sub);
  }

  @Get("notifications/sent")
  async getSentNotifications(@Request() req: any) {
    return this.adminService.getSentNotifications(req.user.sub);
  }

  @Delete("notifications/sent/:id")
  async deleteSentNotification(
    @Request() req: any,
    @Param("id") notificationId: string
  ) {
    return this.adminService.deleteSentNotification(req.user.sub, notificationId);
  }

  @Get("notifications/received")
  async getReceivedNotifications(@Request() req: any) {
    return this.adminService.getReceivedNotifications(req.user.sub);
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
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getQuestions({
      search,
      type,
      difficulty,
      topic_id: topicId,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
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
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getRoles({
      search,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
  }

  @Get("roles/hierarchy")
  async getRoleHierarchy() {
    return this.adminService.getRoleHierarchy();
  }

  @Post("roles/seed")
  @HttpCode(HttpStatus.OK)
  async seedRoles() {
    return this.adminService.seedRoles();
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
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getAuditLogs({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
  }

  @Post("audit-logs/clear")
  @HttpCode(HttpStatus.OK)
  async clearAuditLogs() {
    return this.adminService.clearAuditLogs();
  }

  @Get("system-status")
  async getSystemStatus() {
    return this.adminService.getSystemStatus();
  }


  /* ─── Notifications (all authenticated users via /api/notifications) ─── */
  @Get("activity")
  async getRecentActivity(@Query("take") take?: string) {
    return this.adminService.getRecentActivity(take ? parseInt(take, 10) : 10);
  }

  /* ─── Enrollments ─── */
  @Get("enrollments")
  async getEnrollments(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("course_id") courseId?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getEnrollments({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      course_id: courseId,
    });
  }
}

