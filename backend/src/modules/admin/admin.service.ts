import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Dashboard stats — live counts from database
   */
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalStudents,
        totalTeachers,
        pendingApprovals,
        totalQuestions,
        totalTests,
        totalAttempts,
        openChallenges,
        totalRoles,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: "STUDENT" } }),
        this.prisma.user.count({ where: { role: "TEACHER" } }),
        this.prisma.teacherApplication.count({
          where: { status: "PENDING" },
        }),
        this.prisma.question.count(),
        this.prisma.test.count(),
        this.prisma.attempt.count(),
        this.prisma.challenge.count({ where: { status: "PENDING" } }),
        this.prisma.role.count(),
      ]);

      return {
        totalUsers,
        totalStudents,
        totalTeachers,
        pendingApprovals,
        totalQuestions,
        totalTests,
        totalAttempts,
        openChallenges,
        totalRoles,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [ADMIN] Error fetching dashboard stats: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Paginated user list with search and role filter
   */
  async getUsers(params: {
    search?: string;
    role?: string;
    skip?: number;
    take?: number;
  }) {
    try {
      const { search, role, skip = 0, take = 20 } = params;

      const where: any = {};

      if (role && role !== "ALL") {
        where.role = role;
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
            email_verified_at: true,
            created_at: true,
            last_login_at: true,
            assigned_teacher_id: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return { data: users, total, skip, take };
    } catch (error: any) {
      this.logger.error(
        `❌ [ADMIN] Error fetching users: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Update user role or details
   */
  async updateUser(
    id: string,
    data: { role?: string; first_name?: string; last_name?: string; assigned_teacher_id?: string | null },
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      const updateData: any = {};
      if (data.role) updateData.role = data.role;
      if (data.first_name !== undefined) updateData.first_name = data.first_name;
      if (data.last_name !== undefined) updateData.last_name = data.last_name;
      if (data.assigned_teacher_id !== undefined) updateData.assigned_teacher_id = data.assigned_teacher_id;

      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          assigned_teacher_id: true,
          created_at: true,
        },
      });

      this.logger.log(`✅ [ADMIN] User updated: ${id}`);
      return updated;
    } catch (error: any) {
      this.logger.error(
        `❌ [ADMIN] Error updating user: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      if (user.role === "ADMIN") {
        // Count admins to prevent deleting the last one
        const adminCount = await this.prisma.user.count({
          where: { role: "ADMIN" },
        });
        if (adminCount <= 1) {
          throw new BadRequestException("Cannot delete the last admin user");
        }
      }

      await this.prisma.user.delete({ where: { id } });
      this.logger.log(`✅ [ADMIN] User deleted: ${id}`);
      return { message: "User deleted successfully" };
    } catch (error: any) {
      this.logger.error(
        `❌ [ADMIN] Error deleting user: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Paginated questions with search and filters (admin view — all questions)
   */
  async getQuestions(params: {
    search?: string;
    type?: string;
    difficulty?: string;
    topic_id?: string;
    skip?: number;
    take?: number;
  }) {
    try {
      const { search, type, difficulty, topic_id, skip = 0, take = 20 } = params;

      const where: any = {};

      if (type && type !== "ALL") where.question_type = type;
      if (difficulty && difficulty !== "ALL") where.difficulty = difficulty;
      if (topic_id) where.topic_id = topic_id;

      if (search) {
        where.title = { contains: search, mode: "insensitive" };
      }

      const [questions, total] = await Promise.all([
        this.prisma.question.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: "desc" },
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                chapter: {
                  select: {
                    id: true,
                    name: true,
                    subject: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.question.count({ where }),
      ]);

      return { data: questions, total, skip, take };
    } catch (error: any) {
      this.logger.error(
        `❌ [ADMIN] Error fetching questions: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Force-delete a question (admin override — bypasses active test check)
   */
  async deleteQuestion(id: string) {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id },
      });
      if (!question) {
        throw new NotFoundException(`Question with ID "${id}" not found`);
      }

      await this.prisma.question.delete({ where: { id } });
      this.logger.log(`✅ [ADMIN] Question force-deleted: ${id}`);
      return { message: "Question deleted successfully" };
    } catch (error: any) {
      this.logger.error(
        `❌ [ADMIN] Error deleting question: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }
}
