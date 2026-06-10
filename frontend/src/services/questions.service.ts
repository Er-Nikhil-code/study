import { api } from "@/lib/api";

export const QuestionsService = {
  getAll(params?: any) {
    return api.get("/admin/questions", { params }).then((r) => r.data);
  },

  getById(id: string) {
    return api.get(`/admin/questions/${id}`).then((r) => r.data);
  },

  create(data: unknown) {
    return api.post("/admin/questions", data).then((r) => r.data);
  },

  getTopics() {
    return api.get("/admin/questions/topics").then((r) => r.data);
  },

  update(id: string, data: unknown) {
    return api.patch(`/admin/questions/${id}`, data).then((r) => r.data);
  },

  delete(id: string) {
    return api.delete(`/admin/questions/${id}`).then((r) => r.data);
  },

  versions(id: string) {
    return api.get(`/admin/questions/${id}/versions`).then((r) => r.data);
  },

  restore(id: string, version: number) {
    return api.post(`/admin/questions/${id}/restore/${version}`).then((r) => r.data);
  },

  // Approval workflow
  submitForReview(id: string) {
    return api.post(`/admin/questions/${id}/submit-for-review`).then((r) => r.data);
  },

  getPendingReview(params?: any) {
    return api.get("/admin/questions/review/pending", { params }).then((r) => r.data);
  },

  approve(id: string) {
    return api.post(`/admin/questions/${id}/approve`).then((r) => r.data);
  },

  reject(id: string, note: string) {
    return api.post(`/admin/questions/${id}/reject`, { note }).then((r) => r.data);
  },

  escalate(id: string) {
    return api.patch(`/admin/questions/${id}/escalate`).then((r) => r.data);
  },
};
