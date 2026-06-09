import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
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
      response_id: string;
      question_id: string;
      reason: string;
      description: string;
      screenshot_url?: string;
    },
  ) {
    return this.challengesService.submitChallenge(req.user.sub, body);
  }

  /* ── Student: my challenges ── */
  @Get("mine")
  async getMyChallenges(@Request() req: any) {
    return this.challengesService.getMyChallenges(req.user.sub);
  }

  /* ── Teacher: list assigned challenges ── */
  @Get("assigned")
  @UseGuards(RolesGuard)
  @Roles("TEACHER", "ADMIN")
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
      action: "ACCEPT" | "REJECT" | "REVISE_SOLUTION" | "REVISE_ANSWER_KEY" | "ESCALATE" | "FORWARD_TO_INTERN";
      resolution_note?: string;
      revised_answer_key?: any;
      revised_solution_json?: any;
    },
  ) {
    return this.challengesService.resolveChallenge(id, req.user.sub, body);
  }
}
