import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from "@nestjs/common";
import { UserCacheInterceptor } from "../common/interceptors/user-cache.interceptor";
import { ChallengesService } from "./challenges.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("challenges")
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  /* ── Student: submit challenge ── */
  @Post()
  async submitChallenge(
    @Request() req: any,
    @Body()
    body: {
      response_id?: string;
      question_id?: string;
      note_id?: string;
      reason: string;
      description: string;
      screenshot_url?: string;
    },
  ) {
    return this.challengesService.submitChallenge(req.user.sub, body);
  }

  /* ── Student: my challenges ── */
  @UseGuards(JwtAuthGuard)
  @Get("mine")
  @UseInterceptors(UserCacheInterceptor)
  async getMyChallenges(@Request() req: any) {
    return this.challengesService.getMyChallenges(req.user.sub);
  }

  /* ── Student: withdraw challenge ── */
  @UseGuards(JwtAuthGuard)
  @Delete("withdraw/:id")
  async withdrawChallenge(@Param("id") id: string, @Request() req: any) {
    return this.challengesService.withdrawChallenge(id, req.user.sub);
  }

  /* ── Teacher: list assigned challenges ── */
  @Get("assigned")
  @UseGuards(RolesGuard)
  @Roles("TEACHER", "ADMIN")
  @UseInterceptors(UserCacheInterceptor)
  async getAssignedChallenges(
    @Request() req: any,
    @Query("status") status?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.challengesService.getTeacherChallenges(req.user.sub, {
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  /* ── Teacher: get escalation targets ── */
  @Get("escalation-targets")
  @UseGuards(RolesGuard)
  @Roles("TEACHER", "ADMIN")
  @UseInterceptors(UserCacheInterceptor)
  async getEscalationTargets(@Request() req: any) {
    return this.challengesService.getEscalationTargets(req.user.sub);
  }

  /* ── Teacher: resolve challenge ── */
  @Post(":id/resolve")
  @UseGuards(RolesGuard)
  @Roles("TEACHER", "ADMIN")
  @HttpCode(HttpStatus.OK)
  async resolveChallenge(
    @Param("id") id: string,
    @Request() req: any,
    @Body()
    body: {
      action: "ACCEPT" | "REJECT" | "REVISE_CONTENT" | "REVISE_SOLUTION" | "REVISE_ANSWER_KEY" | "ESCALATE" | "FORWARD_TO_INTERN";
      resolution_note?: string;
      revised_answer_key?: any;
      revised_solution_json?: any;
      revised_content_json?: any;
      forward_to_user_id?: string;
    },
  ) {
    return this.challengesService.resolveChallenge(id, req.user.sub, body);
  }

  /* ── Admin: delete challenge ── */
  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  async deleteChallenge(@Param("id") id: string, @Request() req: any) {
    return this.challengesService.deleteChallenge(id, req.user.role);
  }

  /* ── Chat: Add message ── */
  @Post(":id/messages")
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @Param("id") id: string,
    @Request() req: any,
    @Body() body: { message: string },
  ) {
    return this.challengesService.addMessage(id, req.user.sub, body.message);
  }
}
