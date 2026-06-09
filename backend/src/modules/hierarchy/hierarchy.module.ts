import { Module } from "@nestjs/common";
import { HierarchyController } from "./hierarchy.controller";
import { HierarchyService } from "./hierarchy.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [HierarchyController],
  providers: [HierarchyService, PrismaService],
  exports: [HierarchyService],
})
export class HierarchyModule {}
