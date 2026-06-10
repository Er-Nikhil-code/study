import { api } from "@/lib/api";

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalQuestions: number;
  openChallenges: number;
  totalRoles: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  email_verified_at: string | null;
  created_at: string;
  last_login_at: string | null;
  assigned_teacher_id?: string | null;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions_json: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminQuestion {
  id: string;
  title: string;
  question_type: string;
  difficulty: string;
  marks: number;
  negative_marks: number;
  created_at: string;
  created_by: string;
  topic: {
    id: string;
    name: string;
    chapter: {
      id: string;
      name: string;
      section?: {
        id: string;
        name: string;
        course?: {
          id: string;
          name: string;
        };
      };
    };
  };
}

class AdminService {
  /* ─── Dashboard ─── */
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>("/admin/dashboard/stats");
    return res.data;
  }

  /* ─── Users ─── */
  async getUsers(params?: {
    search?: string;
    role?: string;
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<AdminUser>> {
    const res = await api.get<PaginatedResponse<AdminUser>>("/admin/users", {
      params,
    });
    return res.data;
  }

  async createUser(data: any): Promise<AdminUser> {
    const res = await api.post<AdminUser>("/admin/users", data);
    return res.data;
  }

  async updateUser(
    id: string,
    data: { role?: string; first_name?: string; last_name?: string; assigned_teacher_id?: string | null; is_active?: boolean },
  ): Promise<AdminUser> {
    const res = await api.patch<AdminUser>(`/admin/users/${id}`, data);
    return res.data;
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  }

  /* ─── Roles ─── */
  async getRoles(params?: {
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<AdminRole>> {
    const res = await api.get<PaginatedResponse<AdminRole>>(
      "/admin/roles",
      { params },
    );
    return res.data;
  }

  async createRole(data: {
    name: string;
    description?: string;
    designation?: string;
    level?: number;
    parent_id?: string | null;
    permissions?: string[];
  }): Promise<AdminRole> {
    const res = await api.post<AdminRole>("/admin/roles", data);
    return res.data;
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
      description?: string;
      designation?: string;
      level?: number;
      parent_id?: string | null;
      permissions?: string[];
    },
  ): Promise<AdminRole> {
    const res = await api.patch<AdminRole>(`/admin/roles/${id}`, data);
    return res.data;
  }

  async deleteRole(id: string): Promise<void> {
    await api.delete(`/admin/roles/${id}`);
  }

  async getRoleHierarchy(): Promise<AdminRole[]> {
    const res = await api.get<AdminRole[]>("/admin/roles/hierarchy");
    return res.data;
  }

  async assignRole(userId: string, roleName: string): Promise<void> {
    await api.post("/admin/roles/assign", { user_id: userId, role_name: roleName });
  }

  async seedRoles(): Promise<void> {
    await api.post("/admin/roles/seed");
  }

  /* ─── Questions ─── */
  async getQuestions(params?: {
    search?: string;
    type?: string;
    difficulty?: string;
    topic_id?: string;
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<AdminQuestion>> {
    const res = await api.get<PaginatedResponse<AdminQuestion>>(
      "/admin/questions",
      { params },
    );
    return res.data;
  }

  async deleteQuestion(id: string): Promise<void> {
    await api.delete(`/admin/questions/${id}`);
  }

  /* ─── Audit Logs ─── */
  async getAuditLogs(params?: {
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<any>> {
    const res = await api.get<PaginatedResponse<any>>("/admin/audit-logs", { params });
    return res.data;
  }

  async clearAuditLogs() {
    const res = await api.post("/admin/audit-logs/clear");
    return res.data;
  }

  async getSystemStatus() {
    const res = await api.get("/admin/system-status");
    return res.data;
  }

  /* ─── Notifications ─── */
  async getNotifications(params?: { skip?: number; take?: number }): Promise<{
    data: any[];
    total: number;
    unread_count: number;
    skip: number;
    take: number;
  }> {
    const res = await api.get("/notifications", { params });
    return res.data;
  }

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  }

  /* ─── Recent Activity (admin only) ─── */
  async getRecentActivity(take = 10): Promise<{
    recent_users: any[];
    recent_challenges: any[];
    recent_questions: any[];
  }> {
    const res = await api.get("/admin/activity", { params: { take } });
    return res.data;
  }
}

export const adminService = new AdminService();
export default adminService;
