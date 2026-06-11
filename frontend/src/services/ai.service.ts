import { api } from "@/lib/api";

export const AiService = {
  generateQuestions(data: { topicName: string; count: number; contextNotes?: string }) {
    return api.post("/admin/questions/ai/generate", data).then((r) => r.data);
  },

  findSimilarQuestions(data: { text: string; threshold?: number }) {
    return api.post("/admin/questions/ai/similarity", data).then((r) => r.data);
  }
};
