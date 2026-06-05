import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OtpService } from '../modules/auth/otp.service';
import { PasswordResetService } from '../modules/auth/password-reset.service';

/**
 * Scheduled cleanup jobs for OTP records and password reset tokens
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private otpService: OtpService,
    private passwordResetService: PasswordResetService
  ) {}

  /**
   * Delete expired OTP records every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredOtps(): Promise<void> {
    try {
      const deletedCount = await this.otpService.deleteExpiredOtps();
      this.logger.debug(`OTP cleanup: Deleted ${deletedCount} expired records`);
    } catch (error) {
      this.logger.error(`Error during OTP cleanup: ${error.message}`, error.stack);
    }
  }

  /**
   * Delete expired password reset tokens daily at 2 AM UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const deletedCount = await this.passwordResetService.deleteExpiredTokens();
      this.logger.debug(`Token cleanup: Deleted ${deletedCount} expired reset tokens`);
    } catch (error) {
      this.logger.error(`Error during token cleanup: ${error.message}`, error.stack);
    }
  }
}
