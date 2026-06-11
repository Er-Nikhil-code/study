import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AiGeneratorService } from "./ai-generator.service";
import {
  CreateQuestionRequestType,
  UpdateQuestionType,
  CreateQuestionSchema,
} from "./dto/question.dto";

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private prisma: PrismaService,
    private aiGenerator: AiGeneratorService
  ) {}

  /**
   * Fetch all active topics for dropdowns
   */
  async findAllTopics() {
    return this.prisma.topic.findMany({
      select: {
        id: true,
        name: true,
        chapter: {
          select: {
            id: true,
            name: true,
            section: {
              select: { 
                id: true, 
                name: true,
                course: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Create a new question
   * Interns: question goes to PENDING_REVIEW
   * Teachers/Admins: question is auto-APPROVED
   */
  async createQuestion(userId: string, data: CreateQuestionRequestType, userRole?: string) {
    try {
      this.logger.debug(`📝 [QUESTIONS] Creating question for user ${userId} (role: ${userRole})`);

      // Validate topic exists
      const topic = await this.prisma.topic.findUnique({
        where: { id: data.topic_id },
      });

      if (!topic) {
        throw new NotFoundException(
          `Topic with ID "${data.topic_id}" not found`,
        );
      }

      const isIntern = userRole === "INTERN";
      
      return await this.prisma.$transaction(async (prisma) => {
        const questionData: any = {
          topic_id: data.topic_id,
          content_json: data.content_json,
          options_json: (data as any).options_json ?? undefined,
          answer_key: (data as any).answer_key,
          solution_json: data.solution_json ?? undefined,
          difficulty: data.difficulty,
          question_type: (data as any).question_type || data.type,
          marks: data.marks ?? 1,
          negative_marks: data.negative_marks ?? 0,
          created_by: userId,
          approval_status: isIntern ? "PENDING_REVIEW" : ((data as any).approval_status === "AI_GENERATED" ? "AI_GENERATED" : "APPROVED"),
          approved_by: isIntern ? null : userId,
          approved_at: isIntern ? null : new Date(),
        };

        // Generate embedding if not an intern draft
        if (questionData.approval_status !== "PENDING_REVIEW") {
          const textToEmbed = typeof data.content_json === "string" ? data.content_json : JSON.stringify(data.content_json);
          const embedding = await this.aiGenerator.computeEmbedding(textToEmbed);
          
          const q = await prisma.question.create({ data: questionData });
          
          if (embedding.length > 0) {
            const vectorStr = `[${embedding.join(',')}]`;
            await prisma.$executeRawUnsafe(`UPDATE "Question" SET embedding = $1::vector WHERE id = $2`, vectorStr, q.id);
          }
          
          await prisma.questionVersion.create({
            data: {
              question_id: q.id,
              version: 1,
              content_json: data.content_json,
              options_json: (data as any).options_json ?? undefined,
              answer_key: (data as any).answer_key,
              solution_json: data.solution_json ?? undefined,
            },
          });
          return q;
        } else {
          const q = await prisma.question.create({ data: questionData });
          await prisma.questionVersion.create({
            data: {
              question_id: q.id,
              version: 1,
              content_json: data.content_json,
              options_json: (data as any).options_json ?? undefined,
              answer_key: (data as any).answer_key,
              solution_json: data.solution_json ?? undefined,
            },
          });
          return q;
        }
      });
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error creating question: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /* ════════════════════════════════════════════
   *  APPROVAL WORKFLOW (Teacher reviews intern questions)
   * ════════════════════════════════════════════ */

  async submitForReview(questionId: string, userId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Question not found");
    if (question.created_by !== userId) throw new BadRequestException("Not the question creator");
    if (!["DRAFT", "NEEDS_REVISION"].includes(question.approval_status)) {
      throw new BadRequestException("Question is not in a submittable state");
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: { approval_status: "PENDING_REVIEW" },
    });
  }

  async listPendingReview(userId: string, userRole: string, skip = 0, take = 20) {
    let creatorIds: string[] | undefined = undefined;

    // If teacher, only show questions from their assigned interns
    if (userRole === "TEACHER") {
      const interns = await this.prisma.user.findMany({
        where: { assigned_teacher_id: userId },
        select: { id: true },
      });
      creatorIds = interns.map((i) => i.id);
      
      // If teacher has no interns, they have no pending questions
      if (creatorIds.length === 0) {
        return { data: [], total: 0, skip, take };
      }
    }

    const whereClause: any = { approval_status: "PENDING_REVIEW" };
    if (creatorIds) {
      whereClause.created_by = { in: creatorIds };
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          topic: { select: { id: true, name: true } },
        },
      }),
      this.prisma.question.count({
        where: whereClause,
      }),
    ]);
    return { data: questions, total, skip, take };
  }

  async approveQuestion(questionId: string, reviewerId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Question not found");
    if (question.approval_status !== "PENDING_REVIEW") {
      throw new BadRequestException("Question is not pending review");
    }

    // Notify the intern
    await this.prisma.notificationEvent.create({
      data: {
        user_id: question.created_by,
        type: "CUSTOM",
        title: "Question Approved ✅",
        message: `Your question (ID: ${question.id}) has been approved.`,
        data_json: { question_id: questionId },
      },
    });

    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        approval_status: "APPROVED",
        approved_by: reviewerId,
        approved_at: new Date(),
        rejection_note: null,
      },
    });

    // Award 10 points to Intern
    if (question.created_by) {
      await this.prisma.userStats.upsert({
        where: { user_id: question.created_by },
        update: { total_score: { increment: 10 } },
        create: { user_id: question.created_by, total_score: 10 }
      });
    }

    return updated;
  }

  async rejectQuestion(questionId: string, reviewerId: string, note: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Question not found");
    if (question.approval_status !== "PENDING_REVIEW") {
      throw new BadRequestException("Question is not pending review");
    }

    // Notify the intern
    await this.prisma.notificationEvent.create({
      data: {
        user_id: question.created_by,
        type: "CUSTOM",
        title: "Question Needs Revision",
        message: `Your question (ID: ${question.id}) needs changes: ${note}`,
        data_json: { question_id: questionId, note },
      },
    });

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        approval_status: "NEEDS_REVISION",
        rejection_note: note,
      },
    });
  }

  async escalateQuestion(questionId: string, teacherId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Question not found");
    if (question.approval_status !== "PENDING_REVIEW") {
      throw new BadRequestException("Only pending questions can be escalated");
    }

    this.logger.log(`⚠️ [QUESTIONS] Question ${questionId} escalated by teacher ${teacherId}`);

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        approval_status: "ESCALATED",
      },
    });
  }

  /**
   * Find all questions with filters and pagination
   */
  async findAllQuestions(
    filters?: {
      topic_id?: string;
      chapter_id?: string;
      section_id?: string;
      course_id?: string;
      question_type?: string;
      difficulty?: string;
      intern_only?: string;
      teacher_id?: string;
      admin_search?: boolean;
      is_pyq?: boolean;
      exam_year?: string;
    },
    skip = 0,
    take = 20,
  ) {
    try {
      this.logger.debug(`🔍 [QUESTIONS] Fetching questions with filters`);

      const where: any = {};
      
      // Topic hierarchy filtering
      if (filters?.topic_id) {
        where.topic_id = filters.topic_id;
      } else if (filters?.chapter_id) {
        where.topic = { chapter_id: filters.chapter_id };
      } else if (filters?.section_id) {
        where.topic = { chapter: { section_id: filters.section_id } };
      } else if (filters?.course_id) {
        where.topic = { chapter: { section: { course_id: filters.course_id } } };
      }

      if (filters?.question_type) where.question_type = filters.question_type;
      if (filters?.difficulty) where.difficulty = filters.difficulty;
      
      if (filters?.is_pyq) {
        where.options_json = { path: ['metadata', 'is_pyq'], equals: true };
      }
      if (filters?.exam_year) {
        if (!where.options_json) where.options_json = {};
        where.options_json = {
          ...where.options_json,
          path: ['metadata', 'exam_year'],
          equals: filters.exam_year
        };
      }
      if (filters?.intern_only) {
        where.created_by = filters.intern_only;
      }
      
      if (filters?.teacher_id) {
        const interns = await this.prisma.user.findMany({
          where: { assigned_teacher_id: filters.teacher_id },
          select: { id: true },
        });
        const internIds = interns.map(i => i.id);
        where.created_by = { in: [filters.teacher_id, ...internIds] };
      }

      const [questions, total] = await Promise.all([
        this.prisma.question.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: "desc" },
          include: {
            creator: { select: { first_name: true, last_name: true } },
            topic: {
              select: { 
                id: true, 
                name: true,
                chapter: {
                  select: {
                    id: true,
                    name: true,
                    section: {
                      select: {
                        id: true,
                        name: true,
                        course: { select: { id: true, name: true } }
                      }
                    }
                  }
                }
              },
            },
          },
        }),
        this.prisma.question.count({ where }),
      ]);

      return {
        data: questions,
        total,
        skip,
        take,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error fetching questions: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Get single question by ID
   */
  async findQuestionById(id: string) {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          topic: {
            select: { id: true, name: true, chapter_id: true },
          },
          version_history: {
            orderBy: { version: "desc" },
            take: 10,
          },
        },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID "${id}" not found`);
      }

      return question;
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error fetching question: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Update question (with versioning)
   */
  async updateQuestion(questionId: string, data: UpdateQuestionType) {
    try {
      this.logger.debug(`✏️  [QUESTIONS] Updating question ${questionId}`);

      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID "${questionId}" not found`);
      }

      // If answer_key is changing, create version snapshot
      if (
        data.answer_key &&
        JSON.stringify(data.answer_key) !== JSON.stringify(question.answer_key)
      ) {
        this.logger.debug(`📸 [QUESTIONS] Creating version snapshot for ${questionId}`);

        await this.prisma.questionVersion.create({
          data: {
            question_id: questionId,
            version: question.version,
            content_json: question.content_json || {},
            options_json: (question as any).options_json || undefined,
            answer_key: (question as any).answer_key || {},
            solution_json: question.solution_json || undefined,
          },
        });

        this.logger.debug(`✓ [QUESTIONS] Version snapshot created`);
      }

      // Update question
      const updated = await this.prisma.question.update({
        where: { id: questionId },
        data: {
          topic_id: data.topic_id ?? question.topic_id,
          question_type: (data.type ?? question.question_type) as any,
          content_json: (data.content_json ?? question.content_json) as any,
          options_json: (data as any).options_json ?? (question as any).options_json ?? undefined,
          answer_key: (data as any).answer_key ?? (question as any).answer_key,
          solution_json: (data.solution_json ?? question.solution_json) as any,
          difficulty: data.difficulty ?? question.difficulty,
          marks: data.marks ?? question.marks,
          negative_marks: data.negative_marks ?? question.negative_marks,
          version: question.version + 1,
        },
      });

      // Update embedding if content changed and it's approved/ai
      if (data.content_json && (updated.approval_status === "APPROVED" || updated.approval_status === "AI_GENERATED")) {
        const textToEmbed = typeof data.content_json === "string" ? data.content_json : JSON.stringify(data.content_json);
        const embedding = await this.aiGenerator.computeEmbedding(textToEmbed);
        if (embedding.length > 0) {
          const vectorStr = `[${embedding.join(',')}]`;
          await this.prisma.$executeRawUnsafe(`UPDATE "Question" SET embedding = $1::vector WHERE id = $2`, vectorStr, updated.id);
        }
      }

      this.logger.log(`✅ [QUESTIONS] Question updated: ${questionId}`);

      return updated;
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error updating question: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Delete question
   */
  async deleteQuestion(id: string) {
    try {
      this.logger.debug(`🗑️  [QUESTIONS] Deleting question ${id}`);

      const question = await this.prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID "${id}" not found`);
      }

      // Check if question is used in active tests
      const activeTestUsage = await this.prisma.testQuestion.count({
        where: {
          question_id: id,
          test: {
            status: { in: ["PUBLISHED", "ONGOING"] },
          },
        },
      });

      if (activeTestUsage > 0) {
        throw new BadRequestException(
          `Cannot delete question used in ${activeTestUsage} active test(s)`,
        );
      }

      // Delete question (cascade will handle versions, test_questions, responses)
      await this.prisma.question.delete({
        where: { id },
      });

      this.logger.log(`✅ [QUESTIONS] Question deleted: ${id}`);

      return { message: "Question deleted successfully" };
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error deleting question: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Get question version history
   */
  async getQuestionVersions(id: string, limit = 10) {
    try {
      const versions = await this.prisma.questionVersion.findMany({
        where: { question_id: id },
        orderBy: { version: "desc" },
        take: limit,
      });

      return {
        question_id: id,
        versions,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error fetching versions: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Restore question to previous version
   */
  async restoreQuestionVersion(id: string, version: number) {
    try {
      this.logger.debug(
        `⏮️  [QUESTIONS] Restoring question ${id} to v${version}`,
      );

      const versionSnapshot = await this.prisma.questionVersion.findUnique({
        where: {
          question_id_version: {
            question_id: id,
            version,
          },
        },
      });

      if (!versionSnapshot) {
        throw new NotFoundException(
          `Version ${version} not found for question ${id}`,
        );
      }

      const question = await this.prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID "${id}" not found`);
      }

      // Create snapshot of current version before restoring
      await this.prisma.questionVersion.create({
        data: {
          question_id: id,
          version: question.version,
          content_json: question.content_json || {},
          options_json: question.options_json || undefined,
          answer_key: question.answer_key || {},
          solution_json: question.solution_json || undefined,
        },
      });

      // Restore version
      const restored = await this.prisma.question.update({
        where: { id },
        data: {
          content_json: versionSnapshot.content_json || {},
          options_json: versionSnapshot.options_json || undefined,
          answer_key: versionSnapshot.answer_key || {},
          solution_json: versionSnapshot.solution_json || undefined,
          version: question.version + 1,
        },
      });

      this.logger.log(`✅ [QUESTIONS] Question restored to v${version}: ${id}`);

      return restored;
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error restoring version: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }
}
