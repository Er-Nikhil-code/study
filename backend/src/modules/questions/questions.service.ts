import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateQuestionRequestType,
  UpdateQuestionType,
  CreateQuestionSchema,
} from "./dto/question.dto";

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new question
   */
  async createQuestion(userId: string, data: CreateQuestionRequestType) {
    try {
      this.logger.debug(`📝 [QUESTIONS] Creating question for user ${userId}`);

      // Validate topic exists
      const topic = await this.prisma.topic.findUnique({
        where: { id: data.topic_id },
      });

      if (!topic) {
        throw new NotFoundException(
          `Topic with ID "${data.topic_id}" not found`,
        );
      }

      // Create question
      const question = await this.prisma.question.create({
        data: {
          topic_id: data.topic_id,
          created_by: userId,
          title: data.title,
          question_type: (data as any).question_type || data.type,
          content_json: data.content_json || [],
          options_json: (data as any).options_json || undefined,
          answer_key: (data as any).answer_key || {},
          solution_json: data.solution_json || undefined,
          difficulty: data.difficulty,
          marks: data.marks,
          negative_marks: data.negative_marks,
        },
      });

      this.logger.log(`✅ [QUESTIONS] Question created: ${question.id}`);

      return question;
    } catch (error: any) {
      this.logger.error(
        `❌ [QUESTIONS] Error creating question: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Find all questions with filters and pagination
   */
  async findAllQuestions(
    filters?: {
      topic_id?: string;
      question_type?: string;
      difficulty?: string;
      created_by?: string;
    },
    skip = 0,
    take = 20,
  ) {
    try {
      this.logger.debug(`🔍 [QUESTIONS] Fetching questions with filters`);

      const where: any = {};
      if (filters?.topic_id) where.topic_id = filters.topic_id;
      if (filters?.question_type) where.question_type = filters.question_type;
      if (filters?.difficulty) where.difficulty = filters.difficulty;
      if (filters?.created_by) where.created_by = filters.created_by;

      const [questions, total] = await Promise.all([
        this.prisma.question.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: "desc" },
          include: {
            topic: {
              select: { id: true, name: true },
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
  async updateQuestion(id: string, data: UpdateQuestionType) {
    try {
      this.logger.debug(`✏️  [QUESTIONS] Updating question ${id}`);

      const question = await this.prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID "${id}" not found`);
      }

      // If answer_key is changing, create version snapshot
      if (
        data.answer_key &&
        JSON.stringify(data.answer_key) !== JSON.stringify(question.answer_key)
      ) {
        this.logger.debug(`📸 [QUESTIONS] Creating version snapshot for ${id}`);

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

        this.logger.debug(`✓ [QUESTIONS] Version snapshot created`);
      }

      // Update question
      const updated = await this.prisma.question.update({
        where: { id },
        data: {
          title: data.title || undefined,
          content_json: data.content_json || undefined,
          options_json: data.options_json || undefined,
          answer_key: data.answer_key || undefined,
          solution_json: data.solution_json || undefined,
          difficulty: data.difficulty || undefined,
          marks: data.marks || undefined,
          negative_marks: data.negative_marks || undefined,
          version: question.version + 1,
        },
      });

      this.logger.log(`✅ [QUESTIONS] Question updated: ${id}`);

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
