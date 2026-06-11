import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TestsService } from "./tests.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("tests")
export class TestsController {
  constructor(private testsService: TestsService) { }

  /* ── Public / Student ── */

  @Get()
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
  async getTest(@Param("id") id: string) {
    return this.testsService.getTestDetails(id);
  }

  @Get(":id/leaderboard")
  @UseGuards(JwtAuthGuard)
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  async createTest(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      topic_id: string;
      description?: string;
      duration_minutes: number;
      total_marks: number;
      passing_marks?: number;
      positive_marks: number;
      negative_marks: number;
      section_config?: any;
      question_ids?: string[];
    },
  ) {
    return this.testsService.createTest(req.user.sub, req.user.role, body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
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
    },
  ) {
    return this.testsService.updateTest(id, req.user.sub, req.user.role, body);
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  @HttpCode(HttpStatus.OK)
  async publishTest(@Param("id") id: string, @Request() req: any) {
    return this.testsService.publishTest(id, req.user.sub);
  }

  @Post(":id/questions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TEACHER", "ADMIN")
  async addQuestions(
    @Param("id") id: string,
    @Request() req: any,
    @Body() body: { question_ids: string[] },
  ) {
    return this.testsService.addQuestionsToTest(
      id,
      body.question_ids,
      req.user.sub,
    );
  }
}
