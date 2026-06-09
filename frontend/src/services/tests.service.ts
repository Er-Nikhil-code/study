import { api } from "@/lib/api";

export const TestsService = {
  getAll() {
    return api.get("/tests");
  },

  create(data: any) {
    return api.post("/tests", data).then(r => r.data);
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
