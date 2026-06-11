import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { AiGeneratorService } from "./ai-generator.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
    }),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, AiGeneratorService, PrismaService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
