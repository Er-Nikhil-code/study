import { api } from "@/lib/api";

export const ResultsService = {
  getMyResults() {
    return api.get("/results");
  },

  getAttempt(attemptId: string) {
    return api.get(`/results/${attemptId}`);
  },

  getSolutions(attemptId: string) {
    return api.get(`/results/${attemptId}/solutions`);
  },
};
