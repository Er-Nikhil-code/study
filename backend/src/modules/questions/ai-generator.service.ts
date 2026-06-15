import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

const AiQuestionOutputSchema = z.array(z.object({
  questionText: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string()
  })),
  answerKey: z.string(),
  solutionText: z.string().optional(),
  difficulty: z.string()
}));

@Injectable()
export class AiGeneratorService {
  private readonly logger = new Logger(AiGeneratorService.name);
  private ai?: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. AI generation will fail.');
    }
  }

  async generateQuestions(
    userId: string,
    role: string,
    context: {
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
    },
    count: number,
    questionType: string,
    difficulty: string,
    useNotes: boolean,
    customInstructions?: string
  ) {
    if (!this.ai) {
      throw new HttpException('AI generation is not configured on the server', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (role !== 'ADMIN' && count > 5) {
      throw new HttpException('Cannot generate more than 5 questions at a time', HttpStatus.BAD_REQUEST);
    }

    // Rate Limiting
    if (role === 'TEACHER') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const generatedToday = await this.prisma.question.count({
        where: {
          created_by: userId,
          created_at: { gte: todayStart },
          approval_status: 'AI_GENERATED'
        }
      });

      if (generatedToday + count > 50) {
        throw new HttpException(`Daily limit exceeded. You can only generate ${50 - generatedToday} more questions today.`, HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    let contextNotesStr = '';
    if (useNotes && context.topicId) {
      const note = await this.prisma.note.findFirst({
        where: { topic_id: context.topicId },
        orderBy: { created_at: 'desc' }
      });
      if (!note) {
        throw new HttpException('notes unavailable', HttpStatus.BAD_REQUEST);
      }
      contextNotesStr = note.content_html; // strip tags or send as is
    } else if (useNotes && !context.topicId) {
      throw new HttpException('Notes reference not available for Test Series tests', HttpStatus.BAD_REQUEST);
    }

    let hierarchyContextStr = `You are an expert educator creating high-quality assessment questions.
Below is the curriculum context for the questions you need to generate:
- Course: ${context.courseName || "Unknown"} ${context.courseDesc ? `(${context.courseDesc})` : ""}
- Section: ${context.sectionName || "Unknown"} ${context.sectionDesc ? `(${context.sectionDesc})` : ""}
- Chapter: ${context.chapterName || "Unknown"} ${context.chapterDesc ? `(${context.chapterDesc})` : ""}
- Topic: ${context.topicName || "Unknown"} ${context.topicDesc ? `(${context.topicDesc})` : ""}
`;

    let optionsInstruction = 'Provide exactly 4 options per question.';
    if (questionType === 'TRUE_FALSE') {
      optionsInstruction = 'Provide exactly 2 options per question: "True" (id: "A") and "False" (id: "B").';
    } else if (questionType === 'FILL_BLANK') {
      optionsInstruction = 'Provide exactly 4 options per question. One of them should be the exact text that goes in the blank.';
    } else if (questionType === 'MULTIPLE_CORRECT') {
      optionsInstruction = 'Provide exactly 4 options per question, where multiple options might be correct (but output a single string of correct ids separated by commas for the answerKey, e.g. "A,C").';
    } else if (questionType === 'NUMERICAL') {
      optionsInstruction = 'Provide exactly 4 options per question. One of them must be the correct numerical answer.';
    } else if (questionType === 'ASSERTION_REASON') {
      optionsInstruction = `This is an Assertion-Reasoning question. The questionText MUST clearly state both the "Assertion (A): [statement]" and "Reason (R): [statement]".
Provide exactly 4 standard options with these exact texts:
A: "Both Assertion (A) and Reason (R) are true and R is the correct explanation of A."
B: "Both Assertion (A) and Reason (R) are true but R is NOT the correct explanation of A."
C: "Assertion (A) is true but Reason (R) is false."
D: "Assertion (A) is false but Reason (R) is true."`;
    }

    const prompt = `${hierarchyContextStr}

Task: Generate ${count} ${difficulty} difficulty ${questionType} questions specifically for the Topic "${context.topicName}".
${useNotes && contextNotesStr ? `Use the following notes as context/reference:\n${contextNotesStr}\n` : ''}
${customInstructions ? `Custom Instructions: ${customInstructions}\n` : ''}
Ensure the questions vary appropriately within the specified difficulty and are relevant to the provided course hierarchy context. ${optionsInstruction}
CRITICAL: The options array MUST use string IDs exactly as follows: "A", "B", "C", "D". Do NOT use numbers.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING }
                    }
                  }
                },
                answerKey: { type: Type.STRING, description: "The id of the correct option" },
                solutionText: { type: Type.STRING, description: "Explanation for the correct answer" },
                difficulty: { type: Type.STRING, enum: ["EASY", "MEDIUM", "HARD"] }
              },
              required: ["questionText", "options", "answerKey", "solutionText", "difficulty"]
            }
          }
        }
      });

      const rawText = response.text;
      if (!rawText) throw new Error("No output from model");
      
      const parsedQuestions = JSON.parse(rawText);
      const validatedQuestions = AiQuestionOutputSchema.parse(parsedQuestions);

      // Normalization step to ensure A, B, C, D mapping just in case the AI hallucinates numbers
      const idMap: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E", "6": "F" };
      
      const normalizedQuestions = validatedQuestions.map(q => {
        const newOptions = q.options.map(opt => ({
          ...opt,
          id: idMap[opt.id] || opt.id
        }));
        
        let newAnswerKey = q.answerKey;
        if (newAnswerKey.includes(",")) {
           newAnswerKey = newAnswerKey.split(",").map(k => idMap[k.trim()] || k.trim()).join(",");
        } else {
           newAnswerKey = idMap[newAnswerKey] || newAnswerKey;
        }

        return { ...q, options: newOptions, answerKey: newAnswerKey };
      });

      return normalizedQuestions;

    } catch (error: any) {
      this.logger.error(`AI Generation failed: ${error.message}`);
      throw new HttpException('Failed to generate questions using AI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // To compute embeddings for a given text
  async computeEmbedding(text: string): Promise<number[]> {
    if (!this.ai) {
      throw new HttpException('AI embedding is not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    try {
      const response = await this.ai.models.embedContent({
        model: 'gemini-embedding-001', // Use active embedding model
        contents: text,
        config: {
          outputDimensionality: 768,
        }
      });
      return response.embeddings?.[0]?.values || [];
    } catch (e: any) {
      this.logger.error(`Embedding failed: ${e.message}`);
      return [];
    }
  }

  // Semantic similarity search using pgvector
  async searchSimilarQuestions(queryEmbedding: number[], limit: number = 5, threshold: number = 0.2) {
    if (queryEmbedding.length === 0) return [];
    
    // Using pgvector cosine distance `<=>` operator
    const query = `
      SELECT id, content_json, (embedding <=> $1::vector) as distance
      FROM "Question"
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT $2
    `;
    
    // We must format the embedding array as a vector string: '[0.1, 0.2, ...]'
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    try {
      const results = await this.prisma.$queryRawUnsafe<any[]>(query, vectorString, limit);
      
      // Filter out those above distance threshold (distance = 1 - cosine_similarity)
      return results.filter(r => r.distance < threshold);
    } catch (e: any) {
      this.logger.error(`Similarity search failed: ${e.message}`);
      return [];
    }
  }
}
