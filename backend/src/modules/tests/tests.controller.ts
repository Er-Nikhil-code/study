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
  Request,
  HttpCode,
  HttpStatus,
  Put,
  UseInterceptors,
} from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { UserCacheInterceptor } from "../common/interceptors/user-cache.interceptor";
import { TestsService } from "./tests.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("tests")
export class TestsController {
  constructor(private testsService: TestsService) { }

  /* ── Public / Student ── */

  @Get()
  @UseInterceptors(CacheInterceptor)
  async listTests(
    @Query("topic_id") topicId?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.testsService.listPublishedTests({
      topicId,
      search,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
  }

  @Get(":id")
  @UseInterceptors(CacheInterceptor)
  async getTest(@Param("id") id: string) {
    return this.testsService.getTestDetails(id);
  }

  @Get(":id/leaderboard")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserCacheInterceptor)
  async getTestLeaderboard(
    @Param("id") id: string,
    @Request() req: any
  ) {
    return this.testsService.getTestLeaderboard(id, req.user.sub);
  }

  /* ── Attempt flow (authenticated students) ── */

  @Post(":id/start")
  @UseGuards(JwtAuthGuard)
  async startAttempt(@Param("id") testId: string, @Request() req: any) {
    return this.testsService.startAttempt(testId, req.user.sub);
  }

  @Post(":testId/attempt/:attemptId/answer")
  @UseGuards(JwtAuthGuard)
  async saveAnswer(
    @Param("attemptId") attemptId: string,
    @Request() req: any,
    @Body()
    body: {
      test_question_id: string;
      question_id: string;
      topic_id: string;
      answer_json: any;
      time_on_question?: number;
      marked_for_review?: boolean;
    },
  ) {
    return this.testsService.saveAnswer(attemptId, req.user.sub, body);
  }

  @Post(":testId/attempt/:attemptId/submit")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitAttempt(
    @Param("attemptId") attemptId: string,
    @Request() req: any,
  ) {
    return this.testsService.submitAttempt(attemptId, req.user.sub);
  }

  @Get(":testId/attempt/:attemptId/result")
  @UseGuards(JwtAuthGuard)
  async getAttemptResult(
    @Param("attemptId") attemptId: string,
    @Request() req: any,
  ) {
    return this.testsService.getAttemptResult(attemptId, req.user.sub);
  }

  /* ── Teacher / Admin endpoints ── */

  @Get("manage/list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  @UseInterceptors(UserCacheInterceptor)
  async listTeacherTests(
    @Request() req: any,
    @Query("topic_id") topicId?: string,
    @Query("course_id") courseId?: string,
    @Query("section_id") sectionId?: string,
    @Query("chapter_id") chapterId?: string,
    @Query("search") search?: string,
    @Query("created_only") createdOnly?: string,
    @Query("test_series_id") testSeriesId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.testsService.listTeacherTests(req.user.sub, req.user.role, {
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      topicId,
      courseId,
      sectionId,
      chapterId,
      testSeriesId,
      search,
      createdOnly: createdOnly === "true",
    });
  }

  @Get(":id/preview")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  async getTestPreview(@Param("id") id: string, @Request() req: any) {
    return this.testsService.getTestPreview(id, req.user.sub, req.user.role);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  async createTest(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      topic_id?: string;
      test_series_id?: string;
      description?: string;
      duration_minutes: number;
      total_marks: number;
      passing_marks?: number;
      positive_marks: number;
      negative_marks: number;
      section_config?: any;
      question_ids?: string[];
      test_type?: any;
    },
  ) {
    return this.testsService.createTest(req.user.sub, req.user.role, body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  async updateTest(
    @Param("id") id: string,
    @Request() req: any,
    @Body()
    body: {
      title?: string;
      description?: string;
      duration_minutes?: number;
      total_marks?: number;
      passing_marks?: number;
      positive_marks?: number;
      negative_marks?: number;
      start_time?: string;
      end_time?: string;
    },
  ) {
    return this.testsService.updateTest(id, req.user.sub, req.user.role, {
      ...body,
      start_time: body.start_time ? new Date(body.start_time) : undefined,
      end_time: body.end_time ? new Date(body.end_time) : undefined,
    });
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  @HttpCode(HttpStatus.OK)
  async publishTest(@Param("id") id: string, @Request() req: any) {
    return this.testsService.publishTest(id, req.user.sub, req.user.role);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTest(@Param("id") id: string, @Request() req: any) {
    await this.testsService.deleteTest(id, req.user.sub, req.user.role);
  }

  @Post(":id/questions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  async addQuestions(
    @Param("id") id: string,
    @Request() req: any,
    @Body() body: { question_ids: string[] },
  ) {
    return this.testsService.addQuestionsToTest(
      id,
      body.question_ids,
      req.user.sub,
      req.user.role,
    );
  }

  @Put(":id/questions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  async updateQuestions(
    @Param("id") id: string,
    @Request() req: any,
    @Body() body: { question_ids: string[] },
  ) {
    return this.testsService.updateTestQuestions(
      id,
      body.question_ids,
      req.user.sub,
      req.user.role,
    );
  }

  /* ════════════════════════════════════════════
   *  TEST SERIES ENDPOINTS (Teacher / Admin)
   * ════════════════════════════════════════════ */

  @Get("series/manage")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INTERN", "TEACHER", "ADMIN")
  @UseInterceptors(UserCacheInterceptor)
  async getAdminTestSeries(@Request() req: any) {
    return this.testsService.getAdminTestSeries(req.user.sub, req.user.role);
  }

  @Post("series")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  async createTestSeries(@Request() req: any, @Body() body: any) {
    return this.testsService.createTestSeries(req.user.sub, req.user.role, body);
  }

  @Patch("series/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  async updateTestSeries(@Param("id") id: string, @Request() req: any, @Body() body: any) {
    return this.testsService.updateTestSeries(id, req.user.sub, req.user.role, body);
  }

  @Delete("series/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTestSeries(@Param("id") id: string, @Request() req: any) {
    await this.testsService.deleteTestSeries(id, req.user.sub, req.user.role);
  }

  @Post("series/:id/staff")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async assignTestSeriesStaff(@Param("id") id: string, @Request() req: any, @Body() body: { user_id: string }) {
    return this.testsService.assignTestSeriesStaff(id, body.user_id, req.user.role);
  }

  @Delete("series/:id/staff/:userId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async removeTestSeriesStaff(@Param("id") id: string, @Param("userId") userId: string, @Request() req: any) {
    return this.testsService.removeTestSeriesStaff(id, userId, req.user.role);
  }

  @Get("series/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  async getTestSeriesDetail(@Param("id") id: string, @Request() req: any) {
    return this.testsService.getTestSeriesDetail(id, req.user.sub, req.user.role);
  }

  @Post("series/:id/tests")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  async addTestsToSeries(@Param("id") id: string, @Request() req: any, @Body() body: { test_ids: string[] }) {
    return this.testsService.addTestsToSeries(id, body.test_ids, req.user.sub, req.user.role);
  }

  @Delete("series/:id/tests/:testId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  async removeTestFromSeries(@Param("id") id: string, @Param("testId") testId: string, @Request() req: any) {
    return this.testsService.removeTestFromSeries(id, testId, req.user.sub, req.user.role);
  }
}

