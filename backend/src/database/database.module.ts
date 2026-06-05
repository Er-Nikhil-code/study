import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConfig } from "./database.config";
import { User } from "./entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { OtpRecord } from "./entities/otp-record.entity";
import { PasswordResetToken } from "./entities/password-reset-token.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      OtpRecord,
      PasswordResetToken,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
