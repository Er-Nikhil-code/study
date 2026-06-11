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
        select: { id: true, created_by: true, content_json: true },
      });
      if (!question) throw new NotFoundException("Question not found");
      creatorId = question.created_by;
      itemTitle = Array.isArray(question.content_json) && (question.content_json as any)[0]?.content ? (question.content_json as any)[0].content.substring(0, 50) : "Question Content";
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
        type: "CUSTOM",
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
    
    // Fetch assigned interns to also show their challenges
    const interns = await this.prisma.user.findMany({
      where: { assigned_teacher_id: teacherId },
      select: { id: true },
    });
    const internIds = interns.map(i => i.id);

    const where: any = { assigned_to: { in: [teacherId, ...internIds] } };
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
   *  TEACHER: Get escalation targets
   * ════════════════════════════════════════════ */

  async getEscalationTargets(teacherId: string) {
    const [interns, admins] = await Promise.all([
      this.prisma.user.findMany({
        where: { assigned_teacher_id: teacherId, role: "INTERN" },
        select: { id: true, first_name: true, last_name: true, email: true, role: true }
      }),
      this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, first_name: true, last_name: true, email: true, role: true }
      })
    ]);

    return {
      interns,
      admins
    };
  }

  /* ════════════════════════════════════════════
   *  TEACHER: Resolve challenge
   * ════════════════════════════════════════════ */

  async resolveChallenge(
    challengeId: string,
    teacherId: string,
    data: {
      action: "ACCEPT" | "REJECT" | "REVISE_CONTENT" | "REVISE_SOLUTION" | "REVISE_ANSWER_KEY" | "ESCALATE" | "FORWARD_TO_INTERN";
      resolution_note?: string;
      revised_answer_key?: any;
      revised_solution_json?: any;
      revised_content_json?: any;
      forward_to_user_id?: string;
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
    const itemTitle = isNote ? challenge.note?.title : (Array.isArray(challenge.question?.content_json) && (challenge.question?.content_json as any)[0]?.content ? (challenge.question?.content_json as any)[0].content.substring(0, 50) : "Question Content");
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
      case "REVISE_CONTENT":
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

    // Handle Escalation separately (assigns to someone else, doesn't resolve)
    if (data.action === "ESCALATE") {
      if (!data.forward_to_user_id) throw new BadRequestException("forward_to_user_id is required for ESCALATE");

      // Verify the target user is an ADMIN or an Intern assigned to this teacher
      const targetUser = await this.prisma.user.findUnique({
        where: { id: data.forward_to_user_id },
        select: { id: true, role: true, assigned_teacher_id: true }
      });

      if (!targetUser) throw new NotFoundException("Target user not found");

      const isTargetAdmin = targetUser.role === "ADMIN";
      const isTargetIntern = targetUser.role === "INTERN" && targetUser.assigned_teacher_id === teacherId;

      if (!isTargetAdmin && !isTargetIntern) {
        throw new ForbiddenException("Can only escalate to Admins or your assigned Interns");
      }

      const updated = await this.prisma.challenge.update({
        where: { id: challengeId },
        data: {
          assigned_to: targetUser.id,
          status: "ESCALATED",
          resolution_note: data.resolution_note || "Escalated for further review",
        },
      });

      // Notify the target user
      await this.prisma.notificationEvent.create({
        data: {
          user_id: targetUser.id,
          type: "CUSTOM",
          title: "Challenge Escalated to You",
          message: `A teacher escalated a challenge for "${itemTitle}" to you for review. ${data.resolution_note || ""}`.trim(),
          data_json: { challenge_id: challengeId },
        },
      });

      this.logger.log(`↗️ Challenge ${challengeId} escalated to ${targetUser.id} by teacher ${teacherId}`);
      return updated;
    }

    // If revising question content, update the question
    if (data.action === "REVISE_CONTENT" && data.revised_content_json && challenge.question_id) {
      await this.prisma.question.update({
        where: { id: challenge.question_id },
        data: {
          content_json: data.revised_content_json,
          version: { increment: 1 },
        },
      });
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
          select: { id: true, content_json: true },
        },
        note: {
          select: { id: true, title: true },
        }
      },
    });
  }
}
