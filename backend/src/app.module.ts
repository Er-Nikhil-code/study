import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { EmailModule } from "./modules/email/email.module";
import { CleanupService } from "./jobs/cleanup.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ScheduleModule.forRoot(),
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
  ],
  providers: [CleanupService],
})
export class AppModule {}
