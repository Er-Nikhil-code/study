import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import * as crypto from "crypto";

export enum OtpVerificationResult {
  SUCCESS = "SUCCESS",
  INVALID_OTP = "INVALID_OTP",
  EXPIRED = "EXPIRED",
  TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",
  NOT_FOUND = "NOT_FOUND",
}

export interface OtpStatusDto {
  email: string;
  next_retry_time?: Date;
  attempts_remaining: number;
  expires_at?: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate a cryptographically secure 6-digit OTP
   */
  generateOtp(): string {
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
    return otp;
  }

  /**
   * Create and store OTP record for email
   */
  async createOtpRecord(email: string): Promise<any> {
    const otp = this.generateOtp();
    const otpValidityMinutes = this.configService.get<number>(
      "OTP_VALIDITY_MINUTES",
      10,
    );

    const expiresAt = new Date(Date.now() + otpValidityMinutes * 60 * 1000);

    // Delete old OTP records for this email (cleanup)
    await (this.prisma as any).otpRecord.deleteMany({
      where: { email },
    });

    const record = await (this.prisma as any).otpRecord.create({
      data: {
        email,
        otp_code: otp,
        attempts: 0,
        expires_at: expiresAt,
      },
    });

    this.logger.log(`OTP created for email: ${email}`);
    return record;
  }

  /**
   * Verify OTP for email
   */
  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ result: OtpVerificationResult; error?: string }> {
    try {
      const record = await (this.prisma as any).otpRecord.findFirst({
        where: { email },
        orderBy: { created_at: "desc" },
      });

      if (!record) {
        this.logger.warn(`OTP record not found for email: ${email}`);
        return {
          result: OtpVerificationResult.NOT_FOUND,
          error: "OTP not found",
        };
      }

      // Check if expired
      if (new Date() > record.expires_at) {
        this.logger.warn(`OTP expired for email: ${email}`);
        return {
          result: OtpVerificationResult.EXPIRED,
          error: "OTP has expired",
        };
      }

      // Check max attempts
      const maxAttempts = this.configService.get<number>("OTP_MAX_ATTEMPTS", 3);
      if (record.attempts >= maxAttempts) {
        this.logger.warn(`Max OTP attempts exceeded for email: ${email}`);
        return {
          result: OtpVerificationResult.TOO_MANY_ATTEMPTS,
          error: "Maximum attempts exceeded",
        };
      }

      // Check OTP match
      if (record.otp_code !== otp) {
        await (this.prisma as any).otpRecord.update({
          where: { id: record.id },
          data: { attempts: record.attempts + 1 },
        });
        this.logger.warn(`Invalid OTP for email: ${email}`);
        return {
          result: OtpVerificationResult.INVALID_OTP,
          error: "Invalid OTP",
        };
      }

      // OTP is valid - mark as verified
      await (this.prisma as any).otpRecord.update({
        where: { id: record.id },
        data: { verified_at: new Date() },
      });

      this.logger.log(`OTP verified successfully for email: ${email}`);
      return { result: OtpVerificationResult.SUCCESS };
    } catch (error: any) {
      this.logger.error(
        `Error verifying OTP for email ${email}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Get OTP status for email
   */
  async getOtpStatus(email: string): Promise<OtpStatusDto> {
    const record = await (this.prisma as any).otpRecord.findFirst({
      where: { email },
      orderBy: { created_at: "desc" },
    });

    if (!record) {
      return {
        email,
        attempts_remaining: this.configService.get<number>(
          "OTP_MAX_ATTEMPTS",
          3,
        ),
      };
    }

    const maxAttempts = this.configService.get<number>("OTP_MAX_ATTEMPTS", 3);
    const attemptsRemaining = Math.max(0, maxAttempts - record.attempts);

    return {
      email,
      attempts_remaining: attemptsRemaining,
      expires_at: record.expires_at,
      next_retry_time: record.attempts > 0 ? new Date() : undefined,
    };
  }

  /**
   * Delete expired OTP records (cleanup job)
   */
  async deleteExpiredOtps(): Promise<number> {
    try {
      const result = await (this.prisma as any).otpRecord.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Deleted ${result.count} expired OTP records`);
      return result.count;
    } catch (error: any) {
      this.logger.error(
        `Error deleting expired OTPs: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Mark OTP as used and clean up
   */
  async deleteOtpRecord(email: string): Promise<void> {
    try {
      await (this.prisma as any).otpRecord.deleteMany({
        where: { email },
      });
      this.logger.log(`Deleted OTP record for email: ${email}`);
    } catch (error: any) {
      this.logger.error(
        `Error deleting OTP record for email ${email}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }
}
