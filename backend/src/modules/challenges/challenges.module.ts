import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ChallengesController } from "./challenges.controller";
import { ChallengesService } from "./challenges.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
    }),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, PrismaService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
