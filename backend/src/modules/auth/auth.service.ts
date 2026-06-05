import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { BrevoService } from '../email/brevo.service';
import { OtpService, OtpVerificationResult } from './otp.service';
import { PasswordResetService, TokenVerificationResult } from './password-reset.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private brevoService: BrevoService,
    private otpService: OtpService,
    private passwordResetService: PasswordResetService
  ) {}

  /**
   * Register user - step 1: create OTP and send email
   */
  async register(email: string, firstName: string): Promise<{ email_masked: string; otp_expiry_minutes: number }> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      // Create OTP record
      const otpRecord = await this.otpService.createOtpRecord(email);

      // Send OTP via Brevo
      await this.brevoService.sendOtpEmail(email, otpRecord.otp_code, firstName);

      // Mask email for response
      const emailMasked = this.maskEmail(email);
      const otpValidityMinutes = this.configService.get<number>('OTP_VALIDITY_MINUTES', 10);

      this.logger.log(`Registration initiated for email: ${email}`);

      return {
        email_masked: emailMasked,
        otp_expiry_minutes: otpValidityMinutes,
      };
    } catch (error) {
      this.logger.error(`Registration error for email ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify OTP and create user - step 2
   */
  async verifyOtpAndCreateUser(
    email: string,
    otp: string,
    password: string,
    firstName: string,
    lastName?: string,
    role: 'STUDENT' | 'PENDING_TEACHER' = 'STUDENT'
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify OTP
      const otpResult = await this.otpService.verifyOtp(email, otp);

      if (otpResult.result !== OtpVerificationResult.SUCCESS) {
        throw new BadRequestException(otpResult.error || 'OTP verification failed');
      }

      // Check if user already exists (double-check)
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: role === 'PENDING_TEACHER' ? 'PENDING_TEACHER' : 'STUDENT',
          email_verified_at: new Date(),
        },
      });

      // Create user stats
      await this.prisma.userStats.create({
        data: {
          user_id: user.id,
        },
      });

      // If teacher application, create the application record
      if (role === 'PENDING_TEACHER') {
        await this.prisma.teacherApplication.create({
          data: {
            user_id: user.id,
            verified_email_at: new Date(),
          },
        });
      }

      // Delete OTP record
      await this.otpService.deleteOtpRecord(email);

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);

      // Log to audit
      await this.logAudit(user.id, 'user_registered', 'user', user.id, null, { role });

      this.logger.log(`User registered successfully: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(
        `OTP verification and user creation error for email ${email}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Initiate password reset - step 1: send reset link
   */
  async forgotPassword(email: string): Promise<{ email_masked: string }> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.email_verified_at) {
        // Don't reveal if email exists (security)
        this.logger.log(`Password reset requested for non-existent or unverified email: ${email}`);
        return { email_masked: this.maskEmail(email) };
      }

      // Generate reset token
      const { token, expiresAt } = await this.passwordResetService.createResetToken(
        user.id
      );

      // Build reset URL
      const appUrl = this.configService.get<string>('APP_URL');
      const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

      // Send email via Brevo
      await this.brevoService.sendPasswordResetEmail(
        email,
        resetUrl,
        user.first_name
      );

      // Log to audit
      await this.logAudit(user.id, 'password_reset_requested', 'user', user.id, null, null);

      this.logger.log(`Password reset link sent to email: ${email}`);

      return { email_masked: this.maskEmail(email) };
    } catch (error) {
      this.logger.error(`Forgot password error for email ${email}: ${error.message}`, error.stack);
      // Don't throw error to not reveal if email exists
      return { email_masked: this.maskEmail(email) };
    }
  }

  /**
   * Reset password with token - step 2
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Verify reset token
      const tokenResult = await this.passwordResetService.verifyResetToken(token);

      if (tokenResult.result !== TokenVerificationResult.SUCCESS) {
        throw new BadRequestException(tokenResult.error || 'Invalid or expired reset token');
      }

      const userId = tokenResult.userId;

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password_hash: hashedPassword },
      });

      // Mark token as used
      await this.passwordResetService.markTokenAsUsed(token);

      // Invalidate all active refresh tokens
      await this.prisma.refreshToken.deleteMany({
        where: { user_id: userId, revoked_at: null },
      });

      // Log to audit
      await this.logAudit(userId, 'password_reset_completed', 'user', userId, null, null);

      this.logger.log(`Password reset completed for user: ${userId}`);

      return { message: 'Password has been reset successfully. Please log in.' };
    } catch (error) {
      this.logger.error(`Password reset error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  private async generateTokens(
    userId: string,
    email: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const accessTokenPayload = {
        sub: userId,
        email,
        type: 'access',
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: `${this.configService.get<number>('JWT_EXPIRY_HOURS', 1)}h`,
      });

      const refreshTokenPayload = {
        sub: userId,
        type: 'refresh',
      };

      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        expiresIn: `${this.configService.get<number>('JWT_REFRESH_EXPIRY_DAYS', 7)}d`,
      });

      // Hash and store refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(
        Date.now() +
          this.configService.get<number>('JWT_REFRESH_EXPIRY_DAYS', 7) * 24 * 60 * 60 * 1000
      );

      await this.prisma.refreshToken.create({
        data: {
          user_id: userId,
          token_hash: refreshTokenHash,
          expires_at: expiresAt,
        },
      });

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`Error generating tokens: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mask email for display
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart.charAt(0)}***@${domain}`;
    }
    return `${localPart.charAt(0)}${localPart.slice(1, 3).replace(/./g, '*')}${localPart.slice(3)}@${domain}`;
  }

  /**
   * Log audit event
   */
  private async logAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    beforeJson: any = null,
    afterJson: any = null,
    ipAddress?: string
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actor_id: actorId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          before_json: beforeJson,
          after_json: afterJson,
          ip_address: ipAddress,
        },
      });
    } catch (error) {
      this.logger.error(`Error logging audit: ${error.message}`, error.stack);
      // Don't throw - audit logging shouldn't block main operation
    }
  }
}
