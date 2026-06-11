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
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import { AiGeneratorService } from "./ai-generator.service";
import { z } from "zod";
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
  constructor(
    private questionsService: QuestionsService,
    private aiGeneratorService: AiGeneratorService
  ) {}

  @Post()
  @Roles("INTERN", "TEACHER", "ADMIN")
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(@Body() body: any, @Req() req: any) {
    try {
      const parsed = CreateQuestionRequestSchema.parse(body);
      const dataForService = {
        ...parsed,
        question_type: parsed.type,
      };
      return await this.questionsService.createQuestion(
        req.user.id || req.user.sub,
        dataForService as any,
        req.user.role,
      );
    } catch (error: any) {
      if (error?.name === "ZodError" || error instanceof z.ZodError) {
        const issues = error.issues || error.errors || [];
        throw new BadRequestException(issues.map((e: any) => `${(e.path || []).join('.')}: ${e.message}`).join(', '));
      }
      throw error;
    }
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
    @Query("created_by_me") createdByMe?: string,
    @Req() req?: any,
  ) {
    const filters: any = {};
    if (topicId) filters.topic_id = topicId;
    if (type) filters.question_type = type;
    if (difficulty) filters.difficulty = difficulty;

    if (req.user.role === "INTERN") {
      filters.intern_only = req.user.id || req.user.sub;
    } else if (req.user.role === "TEACHER") {
      if (createdByMe === "true") {
        filters.teacher_id = req.user.id || req.user.sub;
      } else {
        filters.admin_search = true; // Teachers can see all questions just like admins
      }
    } else if (req.user.role === "ADMIN") {
      filters.admin_search = true;
    }

    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;

    return this.questionsService.findAllQuestions(filters, skipNum, takeNum);
  }

  @Get(":id")
  @Roles("INTERN", "TEACHER", "ADMIN")
  async getQuestion(@Param("id") id: string, @Req() req: any) {
    const question = await this.questionsService.findQuestionById(id);
    const userId = req.user.id || req.user.sub;

    // Interns can view approved questions + their own
    if (req.user.role === "INTERN") {
      if (question.created_by !== userId && question.approval_status !== "APPROVED") {
        throw new ForbiddenException("You can only view approved questions or your own");
      }
    }

    return question;
  }

  @Patch(":id")
  @Roles("INTERN", "TEACHER", "ADMIN")
  async updateQuestion(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const question = await this.questionsService.findQuestionById(id);
    const userId = req.user.id || req.user.sub;

    // Teachers and Interns can only edit their OWN questions
    if ((req.user.role === "TEACHER" || req.user.role === "INTERN") && question.created_by !== userId) {
      throw new ForbiddenException("You can only edit your own questions");
    }

    const parsed = UpdateQuestionSchema.parse(body);
    return this.questionsService.updateQuestion(id, parsed);
  }

  @Delete(":id")
  @Roles("TEACHER", "ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param("id") id: string, @Req() req: any) {
    const question = await this.questionsService.findQuestionById(id);
    const userId = req.user.id || req.user.sub;
    if (req.user.role === "TEACHER" && question.created_by !== userId) {
      throw new ForbiddenException("You can only delete your own questions");
    }

    await this.questionsService.deleteQuestion(id);
  }

  @Get(":id/versions")
  @Roles("TEACHER", "ADMIN")
  async getVersions(@Param("id") id: string, @Req() req: any) {
    const question = await this.questionsService.findQuestionById(id);
    const userId = req.user.id || req.user.sub;
    if (req.user.role === "TEACHER" && question.created_by !== userId) {
      throw new ForbiddenException("You can only view your own question versions");
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
    const userId = req.user.id || req.user.sub;
    if (req.user.role === "TEACHER" && question.created_by !== userId) {
      throw new ForbiddenException("You can only restore your own question versions");
    }

    const versionNum = parseInt(version, 10);
    return this.questionsService.restoreQuestionVersion(id, versionNum);
  }

  @Patch(":id/escalate")
  @Roles("TEACHER")
  async escalateQuestion(@Param("id") id: string, @Req() req: any) {
    return this.questionsService.escalateQuestion(id, req.user.id || req.user.sub);
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

  /* ── AI Generation workflow ── */

  @Post("ai/generate")
  @Roles("TEACHER", "ADMIN")
  async generateQuestions(@Body() body: { 
    topicId: string;
    topicName: string;
    topicDesc?: string;
    courseName?: string;
    courseDesc?: string;
    sectionName?: string;
    sectionDesc?: string;
    chapterName?: string;
    chapterDesc?: string;
    count: number; 
    questionType: string;
    difficulty: string;
    useNotes: boolean;
    customInstructions?: string;
  }, @Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.aiGeneratorService.generateQuestions(
      userId, 
      req.user.role, 
      body,
      body.count, 
      body.questionType,
      body.difficulty,
      body.useNotes,
      body.customInstructions
    );
  }

  @Post("ai/similarity")
  @Roles("TEACHER", "ADMIN")
  async findSimilarQuestions(@Body() body: { text: string; threshold?: number }, @Req() req: any) {
    const embedding = await this.aiGeneratorService.computeEmbedding(body.text);
    return this.aiGeneratorService.searchSimilarQuestions(embedding, 5, body.threshold || 0.2);
  }
}
