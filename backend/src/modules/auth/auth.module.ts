import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { OtpService } from "./otp.service";
import { PasswordResetService } from "./password-reset.service";
import { EmailModule } from "../email/email.module";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    EmailModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: `${configService.get<number>("JWT_EXPIRY_HOURS", 1)}h`,
        },
      }),
    }),
  ],
  providers: [AuthService, OtpService, PasswordResetService, PrismaService],
  controllers: [AuthController],
  exports: [AuthService, OtpService, PasswordResetService],
})
export class AuthModule {}
