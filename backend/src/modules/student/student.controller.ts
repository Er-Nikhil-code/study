import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { StudentService } from "./student.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("student")
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Get("dashboard")
  async getDashboard(@Request() req: any) {
    return this.studentService.getDashboardStats(req.user.sub);
  }

  @Get("results")
  async getResults(
    @Request() req: any,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.studentService.getResults(req.user.sub, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get("leaderboard")
  async getLeaderboard(
    @Request() req: any,
    @Query("period") period?: string,
    @Query("take") take?: string,
  ) {
    const p = (period === "weekly" || period === "monthly" || period === "global")
      ? period
      : "weekly";
    return this.studentService.getLeaderboard(p, take ? parseInt(take, 10) : 50, req.user.role);
  }

  @Get("test-series")
  async getTestSeries(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.studentService.getTestSeries({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get("teacher/dashboard")
  @UseGuards(RolesGuard)
  @Roles("TEACHER", "ADMIN", "INTERN")
  async getTeacherDashboard(@Request() req: any) {
    return this.studentService.getTeacherDashboard(req.user.sub);
  }
}
