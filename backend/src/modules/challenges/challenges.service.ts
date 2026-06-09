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
      response_id?: string;
      question_id?: string;
      note_id?: string;
      reason: string;
      description: string;
      screenshot_url?: string;
    },
  ) {
    if (!data.question_id && !data.note_id) {
      throw new BadRequestException("Must provide either question_id or note_id");
    }

    let creatorId = "";
    let itemTitle = "";

    if (data.question_id) {
      const question = await this.prisma.question.findUnique({
        where: { id: data.question_id },
        select: { id: true, created_by: true, title: true },
      });
      if (!question) throw new NotFoundException("Question not found");
      creatorId = question.created_by;
      itemTitle = question.title;
    } else if (data.note_id) {
      const note = await this.prisma.note.findUnique({
        where: { id: data.note_id },
        select: { id: true, created_by: true, title: true },
      });
      if (!note) throw new NotFoundException("Note not found");
      creatorId = note.created_by;
      itemTitle = note.title;
    }

    // Create the challenge — auto-assign to creator
    const challenge = await this.prisma.challenge.create({
      data: {
        response_id: data.response_id,
        question_id: data.question_id,
        note_id: data.note_id,
        submitted_by: userId,
        assigned_to: creatorId,
        status: "PENDING",
        reason: data.reason as any,
        description: data.description,
        screenshot_url: data.screenshot_url,
      },
    });

    // Create notification for the teacher
    await this.prisma.notificationEvent.create({
      data: {
        user_id: creatorId,
        type: "CHALLENGE_RESOLVED",
        title: `New ${data.note_id ? "Note" : "Question"} Challenge`,
        message: `A student has challenged your ${data.note_id ? "note" : "question"}: "${itemTitle}" — Reason: ${data.reason}`,
        data_json: {
          challenge_id: challenge.id,
          question_id: data.question_id,
          note_id: data.note_id,
          reason: data.reason,
        },
      },
    });

    this.logger.log(
      `✅ Challenge submitted: ${challenge.id} for ${data.note_id ? "Note" : "Q"}:${data.note_id || data.question_id} → Teacher:${creatorId}`,
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
      action: "ACCEPT" | "REJECT" | "REVISE_SOLUTION" | "REVISE_ANSWER_KEY" | "ESCALATE" | "FORWARD_TO_INTERN";
      resolution_note?: string;
      revised_answer_key?: any;
      revised_solution_json?: any;
    },
  ) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { question: true, note: true },
    });

    if (!challenge) throw new NotFoundException("Challenge not found");
    if (challenge.assigned_to !== teacherId)
      throw new ForbiddenException("This challenge is not assigned to you");
    if (challenge.status !== "PENDING")
      throw new BadRequestException("Challenge already resolved");

    const isNote = !!challenge.note_id;
    const itemTitle = isNote ? challenge.note?.title : challenge.question?.title;
    const creatorId = isNote ? challenge.note?.created_by : challenge.question?.created_by;

    // ── FORWARD TO INTERN ──
    // Re-assign the challenge to the intern who created the item
    if (data.action === "FORWARD_TO_INTERN") {
      const internId = creatorId;
      if (!internId) throw new BadRequestException("Creator not found");

      // Update challenge: reassign to intern
      const updated = await this.prisma.challenge.update({
        where: { id: challengeId },
        data: {
          assigned_to: internId,
          resolution_note: data.resolution_note || "Forwarded to creator for review",
        },
      });

      // Notify the intern
      await this.prisma.notificationEvent.create({
        data: {
          user_id: internId,
          type: "CUSTOM",
          title: "Challenge Forwarded to You",
          message: `A student challenged ${isNote ? "note" : "question"} "${itemTitle}". Your teacher has forwarded this to you for review. ${data.resolution_note || ""}`.trim(),
          data_json: {
            challenge_id: challengeId,
            question_id: challenge.question_id,
            note_id: challenge.note_id,
            forwarded_by: teacherId,
          },
        },
      });

      // Notify the student that their challenge is being reviewed
      await this.prisma.notificationEvent.create({
        data: {
          user_id: challenge.submitted_by,
          type: "CHALLENGE_RESOLVED",
          title: "Challenge Under Review",
          message: `Your challenge for "${itemTitle}" is being reviewed by the creator.`,
          data_json: {
            challenge_id: challengeId,
            question_id: challenge.question_id,
            note_id: challenge.note_id,
            status: "UNDER_REVIEW",
          },
        },
      });

      this.logger.log(
        `↪ Challenge ${challengeId} forwarded to intern ${internId} by teacher ${teacherId}`,
      );

      return updated;
    }

    // ── Standard resolution actions ──
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
    if (data.action === "REVISE_ANSWER_KEY" && data.revised_answer_key && challenge.question_id) {
      await this.prisma.question.update({
        where: { id: challenge.question_id },
        data: {
          answer_key: data.revised_answer_key,
          version: { increment: 1 },
        },
      });
    }

    // If revising solution, update the question
    if (data.action === "REVISE_SOLUTION" && data.revised_solution_json && challenge.question_id) {
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

    // Build a human-readable message for the student
    let studentMessage: string;
    switch (data.action) {
      case "ACCEPT":
        studentMessage = `Your challenge for "${itemTitle}" has been accepted. The item has been reviewed and corrected.`;
        break;
      case "REVISE_ANSWER_KEY":
        studentMessage = `Your challenge for "${itemTitle}" has been accepted. The answer key has been updated.`;
        break;
      case "REVISE_SOLUTION":
        studentMessage = `Your challenge for "${itemTitle}" has been accepted. The solution has been revised.`;
        break;
      case "REJECT":
        studentMessage = `Your challenge for "${itemTitle}" has been reviewed and rejected. ${data.resolution_note || "The original content is correct."}`;
        break;
      default:
        studentMessage = `Your challenge for "${itemTitle}" has been ${newStatus.toLowerCase()}.`;
    }

    // Notify the student
    await this.prisma.notificationEvent.create({
      data: {
        user_id: challenge.submitted_by,
        type: "CHALLENGE_RESOLVED",
        title: data.action === "REJECT" ? "Challenge Rejected" : "Challenge Resolved ✅",
        message: studentMessage,
        data_json: {
          challenge_id: challengeId,
          question_id: challenge.question_id,
          note_id: challenge.note_id,
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
        note: {
          select: { id: true, title: true },
        }
      },
    });
  }
}
