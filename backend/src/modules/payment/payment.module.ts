import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { HierarchyModule } from "../hierarchy/hierarchy.module";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [HierarchyModule, EmailModule],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
  exports: [PaymentService]
})
export class PaymentModule {}
