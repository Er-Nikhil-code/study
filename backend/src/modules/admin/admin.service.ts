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
        totalQuestions,
        openChallenges,
        totalRoles,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: "STUDENT" } }),
        this.prisma.user.count({ where: { role: "TEACHER" } }),
        this.prisma.question.count(),
        this.prisma.challenge.count({ where: { status: "PENDING" } }),
        this.prisma.role.count(),
      ]);

      return {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalQuestions,
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
            is_active: true,
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
    data: { role?: string; first_name?: string; last_name?: string; assigned_teacher_id?: string | null; is_active?: boolean },
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
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

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
   * Get User by ID with stats
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        custom_role: true,
        assigned_teacher: { select: { id: true, first_name: true, last_name: true, email: true } },
        user_stats: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    let extraStats: any = {};
    if (user.role === "INTERN") {
      const approvedCount = await this.prisma.question.count({
        where: { created_by: id, approval_status: "APPROVED" },
      });
      let earnings = 0;
      let remaining = approvedCount;
      let batch = Math.min(remaining, 300);
      earnings += batch * 3;
      remaining -= batch;
      if (remaining > 0) {
        let currentReward = 4;
        while (remaining > 0) {
          batch = Math.min(remaining, 500);
          earnings += batch * currentReward;
          remaining -= batch;
          if (remaining > 0) currentReward++;
        }
      }
      extraStats = { approved_questions: approvedCount, calculated_earnings: earnings };
    }

    const { password_hash, ...safeUser } = user as any;
    return { ...safeUser, ...extraStats };
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
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { id: search }
        ];
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
                    section: {
                      select: {
                        id: true,
                        name: true,
                        course: {
                          select: { id: true, name: true },
                        },
                      },
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

  /* ─── Custom Roles ─── */
  async getRoles(params: { search?: string; skip?: number; take?: number }) {
    const { search, skip = 0, take = 50 } = params;
    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
    
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        include: { _count: { select: { users: true } }, parent: { select: { id: true, name: true } } },
        orderBy: { level: 'asc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    const formattedData = data.map(role => ({
      ...role,
      user_count: role._count.users
    }));

    return { data: formattedData, total, skip, take };
  }

  async getRoleHierarchy() {
    return this.prisma.role.findMany({
      include: { children: true },
      orderBy: { level: 'asc' }
    });
  }

  async createRole(data: any) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        designation: data.designation,
        level: data.level,
        parent_id: data.parent_id,
        permissions_json: data.permissions || [],
      }
    });
  }

  async updateRole(id: string, data: any) {
    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        designation: data.designation,
        level: data.level,
        parent_id: data.parent_id,
        permissions_json: data.permissions,
      }
    });
  }

  async deleteRole(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  async assignRole(userId: string, roleName: string) {
    // If it's a base UserRole enum
    if (["STUDENT", "INTERN", "TEACHER", "ADMIN"].includes(roleName)) {
      return this.prisma.user.update({
        where: { id: userId },
        data: { role: roleName as any, custom_role_id: null }
      });
    }

    // Otherwise it's a custom role
    const customRole = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!customRole) throw new NotFoundException("Role not found");

    return this.prisma.user.update({
      where: { id: userId },
      data: { custom_role_id: customRole.id }
    });
  }

  /* ─── Audit Logs ─── */
  async getAuditLogs(params: { skip?: number; take?: number }) {
    const skip = params.skip || 0;
    const take = params.take || 50;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: { actor: { select: { id: true, first_name: true, last_name: true, email: true } } }
      }),
      this.prisma.auditLog.count()
    ]);

    return { data, total, skip, take };
  }

  async clearAuditLogs() {
    try {
      await this.prisma.auditLog.deleteMany();
      return { message: "Audit logs cleared successfully" };
    } catch (error) {
      throw new Error("Could not clear audit logs");
    }
  }

  async getSystemStatus() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - startTime;

      // This is a naive active user count. In a real system, you'd check a Redis store or socket server.
      // Here we count users created recently or with recent activity as "active" placeholder.
      const activeUsers = await this.prisma.user.count({
        where: {
          updated_at: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24), // Active in last 24h
          }
        }
      });

      return {
        uptime: process.uptime(),
        db_latency_ms: dbLatency,
        active_users: activeUsers,
        status: dbLatency < 100 ? "healthy" : "degraded",
      };
    } catch (error) {
      return {
        uptime: process.uptime(),
        db_latency_ms: -1,
        active_users: 0,
        status: "down",
      };
    }
  }

  /* ─── Notifications ─── */

  async getNotifications(userId: string, params: { skip?: number; take?: number }) {
    const skip = params.skip || 0;
    const take = params.take || 30;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notificationEvent.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.notificationEvent.count({ where: { user_id: userId } }),
      this.prisma.notificationEvent.count({ where: { user_id: userId, is_read: false } }),
    ]);

    return { data, total, unread_count: unreadCount, skip, take };
  }

  async markNotificationRead(notificationId: string, userId: string) {
    return this.prisma.notificationEvent.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notificationEvent.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  async getRecentActivity(take = 10) {
    const [recentUsers, recentChallenges, recentQuestions] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        take,
        select: { id: true, first_name: true, last_name: true, email: true, role: true, created_at: true },
      }),
      this.prisma.challenge.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true, status: true, reason: true, created_at: true,
          question: { select: { title: true } },
        },
      }),
      this.prisma.question.findMany({
        where: { approval_status: { in: ['APPROVED', 'REJECTED'] } },
        orderBy: { updated_at: 'desc' },
        take: 5,
        select: { id: true, title: true, approval_status: true, updated_at: true },
      }),
    ]);

    return { recent_users: recentUsers, recent_challenges: recentChallenges, recent_questions: recentQuestions };
  }
}

