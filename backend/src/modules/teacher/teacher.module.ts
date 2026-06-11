import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TeacherController } from "./teacher.controller";
import { TeacherService } from "./teacher.service";

@Module({
  controllers: [TeacherController],
  providers: [TeacherService, PrismaService],
  exports: [TeacherService],
})
export class TeacherModule {}
