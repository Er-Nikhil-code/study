import { api } from "@/lib/api";

export const TestsService = {
  getAll() {
    return api.get("/tests");
  },

  getById(id: string) {
    return api.get(`/tests/${id}`);
  },

  getPayload(id: string) {
    return api.get(`/tests/${id}/payload`);
  },

  start(id: string) {
    return api.post(`/tests/${id}/start`);
  },

  submit(id: string, payload: unknown) {
    return api.post(`/tests/${id}/submit`, payload);
  },
};
