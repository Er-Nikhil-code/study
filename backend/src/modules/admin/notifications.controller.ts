import {
  Controller,
  Get,
  Patch,
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
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.adminService.getNotifications(req.user.sub, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 30,
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
}
