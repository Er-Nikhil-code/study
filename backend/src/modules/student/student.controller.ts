import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  Header,
  Post,
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
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
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
    @Query("course_id") courseId?: string,
    @Query("test_series_id") testSeriesId?: string,
  ) {
    const p = (period === "weekly" || period === "monthly" || period === "global")
      ? period
      : "weekly";
    return this.studentService.getLeaderboard(p, take ? parseInt(take, 10) : 50, req.user.role, courseId, testSeriesId);
  }

  @Get("test-series")
  async getTestSeries(
    @Request() req: any,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.studentService.getTestSeries(req.user.sub, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get("test-series/tests")
  async getTestSeriesTests(
    @Request() req: any,
    @Query("test_type") testType?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.studentService.getTestSeriesTests(req.user.sub, {
      test_type: testType as any,
      test_series_id: req.query.test_series_id as string,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Post("test-series/:id/enroll")
  async enrollTestSeries(
    @Request() req: any,
    @Param("id") id: string
  ) {
    return this.studentService.enrollInTestSeries(req.user.sub, id);
  }

  @Get("teacher/dashboard")
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @UseGuards(RolesGuard)
  @Roles("TEACHER", "ADMIN", "INTERN")
  async getTeacherDashboard(@Request() req: any) {
    return this.studentService.getTeacherDashboard(req.user.sub);
  }

  @Get("intern/dashboard")
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @UseGuards(RolesGuard)
  @Roles("INTERN", "ADMIN")
  async getInternDashboard(@Request() req: any) {
    return this.studentService.getInternDashboard(req.user.sub);
  }

  @Get("intern/earnings")
  @UseGuards(RolesGuard)
  @Roles("INTERN", "ADMIN")
  async getInternEarnings(@Request() req: any) {
    return this.studentService.getInternEarnings(req.user.sub);
  }
}
