import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TestsController } from "./tests.controller";
import { TestsService } from "./tests.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
    }),
  ],
  controllers: [TestsController],
  providers: [TestsService, PrismaService],
  exports: [TestsService],
})
export class TestsModule { }
