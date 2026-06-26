import { api } from "@/lib/api";

export const AiService = {
  async getQuota() {
    const res = await api.get('/questions/ai/quota');
    return res.data;
  },

  generateQuestions(data: { 
    topicId?: string;
    testId?: string;
    topicName?: string;
    topicDesc?: string;
    courseName?: string;
    courseDesc?: string;
    sectionName?: string;
    sectionDesc?: string;
    chapterName?: string;
    chapterDesc?: string;
    count: number; 
    questionType: string;
    difficulty: string;
    useNotes: boolean;
    customInstructions?: string; 
  }) {
    return api.post("/admin/questions/ai/generate", data).then((r) => r.data);
  },

  findSimilarQuestions(data: { text: string; threshold?: number }) {
    return api.post("/admin/questions/ai/similarity", data).then((r) => r.data);
  }
};
