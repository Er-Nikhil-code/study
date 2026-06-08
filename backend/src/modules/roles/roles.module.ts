import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
    }),
  ],
  controllers: [RolesController],
  providers: [RolesService, PrismaService],
  exports: [RolesService],
})
export class RolesModule {}
