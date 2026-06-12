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

  startAttempt(id: string) {
    return api.post(`/tests/${id}/start`).then(res => res.data);
  },

  saveAnswer(attemptId: string, data: any) {
    return api.post(`/tests/any/attempt/${attemptId}/answer`, data).then(res => res.data); // backend uses testId parameter but it might not strictly need the exact testId if attemptId is unique, or I can pass it if I want. Wait, the controller is `@Post(":testId/attempt/:attemptId/answer")`.
  },

  submitAttempt(attemptId: string) {
    return api.post(`/tests/any/attempt/${attemptId}/submit`).then(res => res.data);
  },

  getAttemptResult(attemptId: string) {
    return api.get(`/tests/any/attempt/${attemptId}/result`);
  },

  getTeacherTests(params?: any) {
    return api.get("/tests/manage/list", { params }).then(res => res.data);
  },

  update(id: string, data: any) {
    return api.patch(`/tests/${id}`, data).then(res => res.data);
  },

  updateQuestions(id: string, questionIds: string[]) {
    return api.put(`/tests/${id}/questions`, { question_ids: questionIds }).then(res => res.data);
  },
};
