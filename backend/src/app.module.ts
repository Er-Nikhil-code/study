import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuditInterceptor } from "./modules/common/interceptors/audit.interceptor";
import { PrismaService } from "./prisma/prisma.service";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./modules/auth/auth.module";
import { EmailModule } from "./modules/email/email.module";
import { RolesModule } from "./modules/roles/roles.module";
import { QuestionsModule } from "./modules/questions/questions.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { TestsModule } from "./modules/tests/tests.module";
import { StudentModule } from "./modules/student/student.module";
import { ChallengesModule } from "./modules/challenges/challenges.module";
import { HierarchyModule } from "./modules/hierarchy/hierarchy.module";
import { NotesModule } from "./modules/notes/notes.module";
import { SocketModule } from "./modules/socket/socket.module";
import { TeacherModule } from "./modules/teacher/teacher.module";
import { CartModule } from "./modules/cart/cart.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { CleanupService } from "./jobs/cleanup.service";
import { KeepAliveService } from "./jobs/keep-alive.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ScheduleModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "1h" },
    }),
    ThrottlerModule.forRoot([
      {
        name: "register",
        ttl: 900000, // 15 minutes in milliseconds
        limit: 5, // 5 requests per 15 minutes
      },
      {
        name: "verifyOtp",
        ttl: 900000, // 15 minutes
        limit: 10, // 10 requests per 15 minutes
      },
      {
        name: "forgotPassword",
        ttl: 1800000, // 30 minutes
        limit: 5, // 5 requests per 30 minutes
      },
      {
        name: "resetPassword",
        ttl: 1800000, // 30 minutes
        limit: 5, // 5 requests per 30 minutes
      },
    ]),
    AuthModule,
    EmailModule,
    RolesModule,
    QuestionsModule,
    AdminModule,
    HealthModule,
    TestsModule,
    StudentModule,
    ChallengesModule,
    HierarchyModule,
    NotesModule,
    SocketModule,
    TeacherModule,
    CartModule,
    PaymentModule,
  ],
  providers: [
    CleanupService, 
    KeepAliveService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    }
  ],
})
export class AppModule {}
