import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { OtpService } from "../modules/auth/otp.service";
import { PasswordResetService } from "../modules/auth/password-reset.service";

/**
 * Scheduled cleanup jobs for OTP records and password reset tokens
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private otpService: OtpService,
    private passwordResetService: PasswordResetService,
  ) {}

  /**
   * Delete expired OTP records every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredOtps(): Promise<void> {
    try {
      const deletedCount = await this.otpService.deleteExpiredOtps();
      if (deletedCount > 0) {
        this.logger.debug(`OTP cleanup: Deleted ${deletedCount} expired records`);
      }
    } catch (error: any) {
      this.logger.error(
        `Error during OTP cleanup: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
    }
  }

  /**
   * Delete expired password reset tokens every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const deletedCount =
        await this.passwordResetService.deleteExpiredTokens();
      if (deletedCount > 0) {
        this.logger.debug(
          `Token cleanup: Deleted ${deletedCount} expired reset tokens`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Error during token cleanup: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
    }
  }
}
