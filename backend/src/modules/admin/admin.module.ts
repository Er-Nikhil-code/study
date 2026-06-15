import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { NotificationsController } from "./notifications.controller";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
    }),
  ],
  controllers: [AdminController, NotificationsController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule { }
