import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AdminService } from "../admin/admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

/**
 * /api/notifications — accessible by all authenticated users
 * Fetches and manages notifications for the currently logged-in user.
 */
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private adminService: AdminService) {}

  @Get()
  async getMyNotifications(
    @Request() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 30;
    return this.adminService.getNotifications(req.user.sub, {
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  async markRead(@Request() req: any, @Param("id") id: string) {
    return this.adminService.markNotificationRead(id, req.user.sub);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.OK)
  async markAllRead(@Request() req: any) {
    return this.adminService.markAllNotificationsRead(req.user.sub);
  }

  @Delete("clear-all")
  @HttpCode(HttpStatus.OK)
  async clearAllNotifications(@Request() req: any) {
    return this.adminService.deleteAllNotifications(req.user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Request() req: any, @Param("id") id: string) {
    return this.adminService.deleteNotification(id, req.user.sub);
  }
}
