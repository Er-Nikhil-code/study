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
  Req,
} from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import {
  CreateQuestionRequestSchema,
  UpdateQuestionSchema,
} from "./dto/question.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("admin/questions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post()
  @Roles("INTERN", "TEACHER", "ADMIN")
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(@Body() body: any, @Req() req: any) {
    const parsed = CreateQuestionRequestSchema.parse(body);
    const dataForService = {
      ...parsed,
      question_type: parsed.type,
    };
    return this.questionsService.createQuestion(
      req.user.id || req.user.sub,
      dataForService as any,
      req.user.role,
    );
  }

  @Get("topics")
  @Roles("INTERN", "TEACHER", "ADMIN")
  async listTopics() {
    return this.questionsService.findAllTopics();
  }

  @Get()
  @Roles("INTERN", "TEACHER", "ADMIN")
  async listQuestions(
    @Query("topic_id") topicId?: string,
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Req() req?: any,
  ) {
    const filters: any = {};
    if (topicId) filters.topic_id = topicId;
    if (type) filters.question_type = type;
    if (difficulty) filters.difficulty = difficulty;
    // Teachers can only see their own questions unless they're admins
    if (req.user.role === "TEACHER") {
      filters.created_by = req.user.id;
    }

    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;

    return this.questionsService.findAllQuestions(filters, skipNum, takeNum);
  }

  @Get(":id")
  @Roles("TEACHER", "ADMIN")
  async getQuestion(@Param("id") id: string, @Req() req: any) {
    const question = await this.questionsService.findQuestionById(id);

    // Teachers can only view their own questions
    if (req.user.role === "TEACHER" && question.created_by !== req.user.id) {
      throw new Error("Forbidden: You can only view your own questions");
    }

    return question;
  }

  @Patch(":id")
  @Roles("TEACHER", "ADMIN")
  async updateQuestion(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    // Check ownership
    const question = await this.questionsService.findQuestionById(id);
    if (req.user.role === "TEACHER" && question.created_by !== req.user.id) {
      throw new Error("Forbidden: You can only edit your own questions");
    }

    const parsed = UpdateQuestionSchema.parse(body);
    return this.questionsService.updateQuestion(id, parsed);
  }

  @Delete(":id")
  @Roles("TEACHER", "ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param("id") id: string, @Req() req: any) {
    const question = await this.questionsService.findQuestionById(id);
    if (req.user.role === "TEACHER" && question.created_by !== req.user.id) {
      throw new Error("Forbidden: You can only delete your own questions");
    }

    await this.questionsService.deleteQuestion(id);
  }

  @Get(":id/versions")
  @Roles("TEACHER", "ADMIN")
  async getVersions(@Param("id") id: string, @Req() req: any) {
    const question = await this.questionsService.findQuestionById(id);
    if (req.user.role === "TEACHER" && question.created_by !== req.user.id) {
      throw new Error(
        "Forbidden: You can only view your own question versions",
      );
    }

    return this.questionsService.getQuestionVersions(id);
  }

  @Post(":id/restore/:version")
  @Roles("TEACHER", "ADMIN")
  async restoreVersion(
    @Param("id") id: string,
    @Param("version") version: string,
    @Req() req: any,
  ) {
    const question = await this.questionsService.findQuestionById(id);
    if (req.user.role === "TEACHER" && question.created_by !== req.user.id) {
      throw new Error(
        "Forbidden: You can only restore your own question versions",
      );
    }

    return this.questionsService.restoreQuestionVersion(
      id,
      parseInt(version, 10),
    );
  }

  /* ── Approval workflow ── */

  @Post(":id/submit-for-review")
  @Roles("INTERN")
  @HttpCode(HttpStatus.OK)
  async submitForReview(@Param("id") id: string, @Req() req: any) {
    return this.questionsService.submitForReview(id, req.user.id || req.user.sub);
  }

  @Get("review/pending")
  @Roles("TEACHER", "ADMIN")
  async listPendingReview(
    @Req() req: any,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.questionsService.listPendingReview(
      req.user.sub,
      req.user.role,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
  }

  @Post(":id/approve")
  @Roles("TEACHER", "ADMIN")
  @HttpCode(HttpStatus.OK)
  async approveQuestion(@Param("id") id: string, @Req() req: any) {
    return this.questionsService.approveQuestion(id, req.user.id || req.user.sub);
  }

  @Post(":id/reject")
  @Roles("TEACHER", "ADMIN")
  @HttpCode(HttpStatus.OK)
  async rejectQuestion(
    @Param("id") id: string,
    @Body() body: { note: string },
    @Req() req: any,
  ) {
    return this.questionsService.rejectQuestion(id, req.user.id || req.user.sub, body.note);
  }
}
