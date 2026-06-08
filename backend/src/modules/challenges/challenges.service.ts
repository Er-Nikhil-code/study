import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(private prisma: PrismaService) {}

  /* ════════════════════════════════════════════
   *  STUDENT: Submit a challenge
   * ════════════════════════════════════════════ */

  async submitChallenge(
    userId: string,
    data: {
      response_id: string;
      question_id: string;
      reason: string;
      description: string;
      screenshot_url?: string;
    },
  ) {
    // Find the question to get its creator
    const question = await this.prisma.question.findUnique({
      where: { id: data.question_id },
      select: { id: true, created_by: true, title: true },
    });
    if (!question) throw new NotFoundException("Question not found");

    // Create the challenge — auto-assign to question creator
    const challenge = await this.prisma.challenge.create({
      data: {
        response_id: data.response_id,
        question_id: data.question_id,
        submitted_by: userId,
        assigned_to: question.created_by,
        status: "PENDING",
        reason: data.reason as any,
        description: data.description,
        screenshot_url: data.screenshot_url,
      },
    });

    // Create notification for the teacher
    await this.prisma.notificationEvent.create({
      data: {
        user_id: question.created_by,
        type: "CHALLENGE_RESOLVED",
        title: "New Question Challenge",
        message: `A student has challenged your question: "${question.title}" — Reason: ${data.reason}`,
        data_json: {
          challenge_id: challenge.id,
          question_id: data.question_id,
          reason: data.reason,
        },
      },
    });

    this.logger.log(
      `✅ Challenge submitted: ${challenge.id} for Q:${data.question_id} → Teacher:${question.created_by}`,
    );

    return challenge;
  }

  /* ════════════════════════════════════════════
   *  TEACHER: List assigned challenges
   * ════════════════════════════════════════════ */

  async getTeacherChallenges(
    teacherId: string,
    params: {
      status?: string;
      skip?: number;
      take?: number;
    },
  ) {
    const { status, skip = 0, take = 20 } = params;
    const where: any = { assigned_to: teacherId };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          question: {
            select: {
              id: true,
              title: true,
              question_type: true,
              content_json: true,
              options_json: true,
              answer_key: true,
              solution_json: true,
            },
          },
          created_by: {
            select: { id: true, first_name: true, last_name: true, email: true },
          },
        },
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return { data: challenges, total, skip, take };
  }

  /* ════════════════════════════════════════════
   *  TEACHER: Resolve challenge
   * ════════════════════════════════════════════ */

  async resolveChallenge(
    challengeId: string,
    teacherId: string,
    data: {
      action: "ACCEPT" | "REJECT" | "REVISE_SOLUTION" | "REVISE_ANSWER_KEY" | "ESCALATE";
      resolution_note?: string;
      revised_answer_key?: any;
      revised_solution_json?: any;
    },
  ) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { question: true },
    });

    if (!challenge) throw new NotFoundException("Challenge not found");
    if (challenge.assigned_to !== teacherId)
      throw new ForbiddenException("This challenge is not assigned to you");
    if (challenge.status !== "PENDING")
      throw new BadRequestException("Challenge already resolved");

    let newStatus: string;

    switch (data.action) {
      case "ACCEPT":
      case "REVISE_SOLUTION":
      case "REVISE_ANSWER_KEY":
        newStatus = "RESOLVED";
        break;
      case "REJECT":
        newStatus = "REJECTED";
        break;
      case "ESCALATE":
        newStatus = "ESCALATED";
        break;
      default:
        throw new BadRequestException("Invalid action");
    }

    // If revising answer key, update the question
    if (data.action === "REVISE_ANSWER_KEY" && data.revised_answer_key) {
      await this.prisma.question.update({
        where: { id: challenge.question_id },
        data: {
          answer_key: data.revised_answer_key,
          version: { increment: 1 },
        },
      });
    }

    // If revising solution, update the question
    if (data.action === "REVISE_SOLUTION" && data.revised_solution_json) {
      await this.prisma.question.update({
        where: { id: challenge.question_id },
        data: {
          solution_json: data.revised_solution_json,
          version: { increment: 1 },
        },
      });
    }

    // Update the challenge
    const updated = await this.prisma.challenge.update({
      where: { id: challengeId },
      data: {
        status: newStatus as any,
        resolution_note: data.resolution_note,
        revised_answer_key: data.revised_answer_key,
        resolved_at: new Date(),
      },
    });

    // Notify the student
    await this.prisma.notificationEvent.create({
      data: {
        user_id: challenge.submitted_by,
        type: "CHALLENGE_RESOLVED",
        title: "Challenge Update",
        message: `Your challenge for "${challenge.question.title}" has been ${newStatus.toLowerCase()}.`,
        data_json: {
          challenge_id: challengeId,
          question_id: challenge.question_id,
          action: data.action,
          status: newStatus,
        },
      },
    });

    this.logger.log(
      `✅ Challenge ${challengeId} ${newStatus} by teacher ${teacherId}`,
    );

    return updated;
  }

  /* ════════════════════════════════════════════
   *  STUDENT: My challenges
   * ════════════════════════════════════════════ */

  async getMyChallenges(userId: string) {
    return this.prisma.challenge.findMany({
      where: { submitted_by: userId },
      orderBy: { created_at: "desc" },
      include: {
        question: {
          select: { id: true, title: true },
        },
      },
    });
  }
}
