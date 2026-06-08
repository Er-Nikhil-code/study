import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
    }),
  ],
  controllers: [StudentController],
  providers: [StudentService, PrismaService],
  exports: [StudentService],
})
export class StudentModule {}
