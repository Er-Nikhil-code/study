import { api } from "@/lib/api";

export const QuestionsService = {
  getAll(params?: any) {
    return api.get("/questions", { params });
  },

  getById(id: string) {
    return api.get(`/questions/${id}`);
  },

  create(data: unknown) {
    return api.post("/questions", data);
  },

  update(id: string, data: unknown) {
    return api.patch(`/questions/${id}`, data);
  },

  delete(id: string) {
    return api.delete(`/questions/${id}`);
  },

  versions(id: string) {
    return api.get(`/questions/${id}/versions`);
  },
};
