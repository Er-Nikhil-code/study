import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import * as crypto from "crypto";

export enum TokenVerificationResult {
  SUCCESS = "SUCCESS",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED = "EXPIRED",
  ALREADY_USED = "ALREADY_USED",
  NOT_FOUND = "NOT_FOUND",
}

export interface TokenVerificationDto {
  result: TokenVerificationResult;
  userId?: string;
  error?: string;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate a secure random token and return its hash
   * Returns both the token (for URL) and hash (for storage)
   */
  generateResetToken(): { token: string; tokenHash: string } {
    // Generate 32-byte random token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash the token for storage
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    return { token, tokenHash };
  }

  /**
   * Create password reset token record
   */
  async createResetToken(
    userId: string,
    ipAddress?: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    try {
      const { token, tokenHash } = this.generateResetToken();
      const expiryMinutes = this.configService.get<number>(
        "PASSWORD_RESET_TOKEN_EXPIRY_MINUTES",
        2,
      );
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Delete old unused tokens for this user
      await (this.prisma as any).passwordResetToken.deleteMany({
        where: {
          user_id: userId,
          used_at: null,
        },
      });

      // Create new token
      await (this.prisma as any).passwordResetToken.create({
        data: {
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt,
          ip_address: ipAddress,
        },
      });

      this.logger.log(`Password reset token created for user: ${userId}`);

      return { token, expiresAt };
    } catch (error: any) {
      this.logger.error(
        `Error creating password reset token for user ${userId}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(token: string): Promise<TokenVerificationDto> {
    try {
      // Hash the provided token
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // Find token record
      const record = await (this.prisma as any).passwordResetToken.findUnique({
        where: { token_hash: tokenHash },
      });

      if (!record) {
        this.logger.warn("Reset token not found");
        return {
          result: TokenVerificationResult.NOT_FOUND,
          error: "Token not found",
        };
      }

      // Check if already used
      if (record.used_at) {
        this.logger.warn(
          `Reset token already used for user: ${record.user_id}`,
        );
        return {
          result: TokenVerificationResult.ALREADY_USED,
          error: "Token has already been used",
        };
      }

      // Check if expired
      if (new Date() > record.expires_at) {
        this.logger.warn(`Reset token expired for user: ${record.user_id}`);
        return {
          result: TokenVerificationResult.EXPIRED,
          error: "Token has expired",
        };
      }

      this.logger.log(`Reset token verified for user: ${record.user_id}`);
      return {
        result: TokenVerificationResult.SUCCESS,
        userId: record.user_id,
      };
    } catch (error: any) {
      this.logger.error(
        `Error verifying reset token: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Mark reset token as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await (this.prisma as any).passwordResetToken.update({
        where: { token_hash: tokenHash },
        data: { used_at: new Date() },
      });

      this.logger.log("Reset token marked as used");
    } catch (error: any) {
      this.logger.error(
        `Error marking token as used: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Delete expired reset tokens (cleanup job)
   */
  async deleteExpiredTokens(): Promise<number> {
    try {
      const result = await (this.prisma as any).passwordResetToken.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
          used_at: null,
        },
      });

      this.logger.log(`Deleted ${result.count} expired password reset tokens`);
      return result.count;
    } catch (error: any) {
      this.logger.error(
        `Error deleting password reset token: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Invalidate all active reset tokens for a user (e.g., after password change)
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    try {
      await (this.prisma as any).passwordResetToken.deleteMany({
        where: {
          user_id: userId,
          used_at: null,
        },
      });

      this.logger.log(`Invalidated all reset tokens for user: ${userId}`);
    } catch (error: any) {
      this.logger.error(
        `Error invalidating tokens for user ${userId}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }
}
