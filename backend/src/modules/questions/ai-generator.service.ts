import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenAI, Type } from '@google/genai';

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

  async generateQuestions(userId: string, role: string, topicName: string, count: number, contextNotes?: string) {
    if (!this.ai) {
      throw new HttpException('AI generation is not configured on the server', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (count > 20) {
      throw new HttpException('Cannot generate more than 20 questions at a time', HttpStatus.BAD_REQUEST);
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

    const prompt = `Generate ${count} multiple-choice questions for the topic "${topicName}".
${contextNotes ? `Use the following notes as context:\n${contextNotes}\n` : ''}
Ensure the questions vary in difficulty. Provide 4 options per question.`;

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
      return parsedQuestions;

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
        model: 'text-embedding-004',
        contents: text
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
