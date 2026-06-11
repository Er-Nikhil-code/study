import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async getInterns(teacherId: string) {
    const interns = await this.prisma.user.findMany({
      where: {
        assigned_teacher_id: teacherId,
        role: "INTERN",
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        created_at: true,
        _count: {
          select: {
            questions: true,
          }
        }
      }
    });

    const enrichedInterns = await Promise.all(interns.map(async (intern) => {
      // Get all their questions to calculate approval rate and activity heatmap
      const questions = await this.prisma.question.findMany({
        where: { created_by: intern.id },
        select: { created_at: true, approval_status: true }
      });

      const totalQuestions = questions.length;
      const approvedQuestions = questions.filter(q => q.approval_status === "APPROVED").length;
      const approvalRate = totalQuestions > 0 ? (approvedQuestions / totalQuestions) * 100 : 0;

      // Group by date for heatmap (last 30 days)
      const activityMap: Record<string, number> = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      questions.forEach(q => {
        if (q.created_at >= thirtyDaysAgo) {
          const dateKey = q.created_at.toISOString().split('T')[0];
          activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
        }
      });

      // Format heatmap for frontend
      const heatmap = Object.entries(activityMap).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...intern,
        stats: {
          total_submitted: totalQuestions,
          approved: approvedQuestions,
          approval_rate: Math.round(approvalRate),
          heatmap
        }
      };
    }));

    return enrichedInterns;
  }
}
