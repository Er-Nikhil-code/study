/// <reference lib="dom" />
import { CreateQuestionRequestSchema } from "./src/modules/questions/dto/question.dto";

const mappedData = {
  topic_id: "test",
  type: "FILL_BLANK",
  difficulty: "MEDIUM",
  marks: 1,
  negative_marks: 0,
  content_json: [{ type: "TEXT", content: "Test" }],
  answer_key: {
    blanks: [{ position: 1, answer: "test", case_sensitive: false }]
  },
  solution_json: [],
  approval_status: "APPROVED"
};

try {
  const parsed = CreateQuestionRequestSchema.parse(mappedData);
  console.log("Zod parsed successfully:", JSON.stringify(parsed));
} catch (e: any) {
  console.error("Zod failed:", e.errors || e);
}
