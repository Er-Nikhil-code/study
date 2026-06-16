import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { BrevoService } from "../email/brevo.service";
import { OtpService, OtpVerificationResult } from "./otp.service";
import {
  PasswordResetService,
  TokenVerificationResult,
} from "./password-reset.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private brevoService: BrevoService,
    private otpService: OtpService,
    private passwordResetService: PasswordResetService,
  ) { }

  /**
   * Fetch current user and generate fresh tokens
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        custom_role: true,
        assigned_teacher: { select: { id: true, first_name: true, last_name: true } },
        course_enrollments: {
          include: { course: true }
        },
        test_series_enrollments: {
          include: { test_series: true }
        },
        interns: {
          select: { id: true, first_name: true, last_name: true, email: true, profile_picture: true }
        }
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: "1h",
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      }),
    ]);

    // Update last_login_at since they are resuming their session
    await this.prisma.user.update({
      where: { id: userId },
      data: { last_login_at: new Date() }
    });

    const { password_hash, course_enrollments, ...userWithoutPassword } = user;

    // Map the actual enrolled course name to the legacy string field for frontend compatibility
    let courseEnrolledStr = userWithoutPassword.course_enrolled;
    if (course_enrollments && course_enrollments.length > 0) {
      // If enrolled in multiple, just show the first one or join them. We'll show the first one.
      courseEnrolledStr = course_enrollments.map(e => e.course.name).join(", ");
    }

    return {
      user: {
        ...userWithoutPassword,
        assigned_teacher_id: user.assigned_teacher_id || null,
        course_enrolled: courseEnrolledStr,
        enrolled_test_series: user.test_series_enrollments?.map((e: any) => e.test_series) || [],
        assigned_interns: user.interns || [],
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Fetch public info for hover cards
   */
  async getUserHoverInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true,
        profile_picture: true,
        created_at: true,
        custom_role: { select: { name: true } },
        assigned_teacher: { select: { first_name: true, last_name: true } }
      }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  /**
   * Update current user profile
   */
  async updateProfile(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");

    const updateData: any = {};
    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;
    if (data.profile_picture !== undefined) updateData.profile_picture = data.profile_picture;
    if (data.course_enrolled !== undefined) updateData.course_enrolled = data.course_enrolled;

    // Handle password change
    if (data.old_password && data.new_password) {
      const isMatch = await bcrypt.compare(data.old_password, user.password_hash);
      if (!isMatch) {
        throw new BadRequestException("Invalid old password");
      }
      updateData.password_hash = await bcrypt.hash(data.new_password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password_hash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  /**
   * Register user - step 1: create OTP and send email
   */
  async register(
    email: string,
    firstName: string,
  ): Promise<{ email_masked: string; otp_expiry_minutes: number }> {
    try {
      this.logger.debug(
        `📝 [AUTH-REGISTER] Starting registration for ${email}`,
      );

      // Check if user already exists
      this.logger.debug(`🔍 [AUTH-REGISTER] Checking if user exists: ${email}`);
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`⚠️  [AUTH-REGISTER] User already exists: ${email}`);
        throw new BadRequestException("Email already registered");
      }
      this.logger.debug(`✓ [AUTH-REGISTER] User doesn't exist, proceeding`);

      // Create OTP record
      this.logger.debug(`🔐 [AUTH-REGISTER] Creating OTP record for ${email}`);
      const otpRecord = await this.otpService.createOtpRecord(email);
      this.logger.log(`✅ [AUTH-REGISTER] OTP created: ${otpRecord.otp_code}`);

      // Send OTP via Brevo (fire-and-forget, don't block response)
      this.logger.debug(`📧 [AUTH-REGISTER] Sending OTP email to ${email}`);

      await this.brevoService.sendOtpEmail(
        email,
        otpRecord.otp_code,
        firstName,
      );

      this.logger.log(
        `📨 [AUTH-REGISTER] OTP email sent successfully to ${email}`,
      );

      // Mask email for response
      const emailMasked = this.maskEmail(email);
      const otpValidityMinutes = this.configService.get<number>(
        "OTP_VALIDITY_MINUTES",
        5,
      );

      this.logger.log(
        `✨ [AUTH-REGISTER] Registration initiated for email: ${email}, expires in ${otpValidityMinutes} minutes`,
      );

      return {
        email_masked: emailMasked,
        otp_expiry_minutes: otpValidityMinutes,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [AUTH-REGISTER] Error for ${email}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
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
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      this.logger.debug(
        `🔐 [VERIFY-OTP] Starting OTP verification for ${email}`,
      );

      // Verify OTP
      this.logger.debug(`🔍 [VERIFY-OTP] Verifying OTP code for ${email}`);
      const otpResult = await this.otpService.verifyOtp(email, otp);
      this.logger.debug(`📝 [VERIFY-OTP] OTP result: ${otpResult.result}`);

      if (otpResult.result !== OtpVerificationResult.SUCCESS) {
        this.logger.warn(
          `⚠️  [VERIFY-OTP] OTP verification failed: ${otpResult.error}`,
        );
        throw new BadRequestException(
          otpResult.error || "OTP verification failed",
        );
      }
      this.logger.log(`✅ [VERIFY-OTP] OTP verified successfully for ${email}`);

      // Check if user already exists (double-check)
      this.logger.debug(
        `🔍 [VERIFY-OTP] Double-checking if user exists: ${email}`,
      );
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`⚠️  [VERIFY-OTP] User already exists: ${email}`);
        throw new BadRequestException("Email already registered");
      }

      const assignedRole = "STUDENT";

      this.logger.debug(
        `🔐 [VERIFY-OTP] Role validation: forced assigned=${assignedRole}`,
      );

      // Hash password
      this.logger.debug(`🔐 [VERIFY-OTP] Hashing password for ${email}`);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      this.logger.log(
        `👤 [VERIFY-OTP] Creating user account for ${email}, role: ${assignedRole}`,
      );
      const user = await this.prisma.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: assignedRole as
            | "STUDENT"
            | "TEACHER"
            | "ADMIN",
          email_verified_at: new Date(),
          last_login_at: new Date(),
        },
      });
      this.logger.log(`✨ [VERIFY-OTP] User created: ${user.id}`);

      // Create user stats
      this.logger.debug(`📊 [VERIFY-OTP] Creating user stats for ${user.id}`);
      await this.prisma.userStats.create({
        data: {
          user_id: user.id,
        },
      });
      this.logger.debug(`✓ [VERIFY-OTP] User stats created`);

      // Teacher applications are now handled strictly by Admin manual assignment.

      // Delete OTP record
      this.logger.debug(`🗑️  [VERIFY-OTP] Deleting OTP record for ${email}`);
      await this.otpService.deleteOtpRecord(email);

      // Generate tokens
      this.logger.debug(`🔑 [VERIFY-OTP] Generating JWT tokens for ${user.id}`);
      const { accessToken, refreshToken } = await this.generateTokens(
        user.id,
        user.email,
        assignedRole,
      );

      // Log to audit
      this.logger.debug(`📋 [VERIFY-OTP] Logging to audit for ${user.id}`);
      await this.logAudit(user.id, "user_registered", "user", user.id, null, {
        role: assignedRole,
      });

      this.logger.log(`✨ [VERIFY-OTP] User registered successfully: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [VERIFY-OTP] Error for ${email}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      this.logger.debug(
        `📊 [VERIFY-OTP] Error details: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  async login(
    email: string,
    password: string,
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          custom_role: true,
          course_enrollments: {
            include: { course: true }
          }
        },
      });

      if (!user) {
        throw new UnauthorizedException("Invalid email or password");
      }

      // Check if email is verified
      if (!user.email_verified_at) {
        throw new UnauthorizedException(
          "Please verify your email first. Use OTP registration to complete verification.",
        );
      }

      // Check if user is active
      if (!user.is_active) {
        throw new UnauthorizedException(
          "Your account has been deactivated. Please contact an administrator.",
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException("Invalid email or password");
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(
        user.id,
        user.email,
        user.role,
      );

      // Update last_login_at
      await this.prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
      });

      // Log to audit
      await this.logAudit(user.id, "user_login", "user", user.id, null, null);

      this.logger.log(`User logged in successfully: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          profile_picture: user.profile_picture,
          custom_role: user.custom_role,
          enrolled_courses: user.course_enrollments.map(e => e.course)
        },
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      this.logger.error(
        `Login error for email ${email}: ${error?.message || "Unknown error"}`,
        error?.stack,
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
      const user = await (this.prisma as any).user.findUnique({
        where: { email },
      });

      if (!user || !user.email_verified_at) {
        // Don't reveal if email exists (security)
        this.logger.log(
          `Password reset requested for non-existent or unverified email: ${email}`,
        );
        return { email_masked: this.maskEmail(email) };
      }

      // Generate reset token
      const { token, expiresAt } =
        await this.passwordResetService.createResetToken(user.id);

      // Build reset URL
      const appUrl = this.configService.get<string>("APP_URL", "http://localhost:3000");

      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      this.logger.debug(`📧 [FORGOT-PASSWORD] Reset URL generated for ${email}`);
      // Send email via Brevo (fire-and-forget, don't block response)
      this.logger.debug(`📧 [FORGOT-PASSWORD] Sending reset email to ${email}`);

      await this.brevoService.sendPasswordResetEmail(
        email,
        resetUrl,
        user.first_name,
      );

      this.logger.log(
        `📨 [FORGOT-PASSWORD] Reset email sent successfully to ${email}`,
      );

      // Log to audit
      await this.logAudit(
        user.id,
        "password_reset_requested",
        "user",
        user.id,
        null,
        null,
      );

      this.logger.log(`Password reset link sent to email: ${email}`);
      this.logger.log(`User found: ${user.email}`);
      this.logger.log(`Email verified: ${!!user.email_verified_at}`);
      return { email_masked: this.maskEmail(email) };
    } catch (error: any) {
      this.logger.error(
        `Forgot password error for email ${email}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      // Don't throw error to not reveal if email exists
      return { email_masked: this.maskEmail(email) };
    }
  }

  /**
   * Reset password with token - step 2
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Verify reset token
      const tokenResult =
        await this.passwordResetService.verifyResetToken(token);

      if (tokenResult.result !== TokenVerificationResult.SUCCESS) {
        throw new BadRequestException(
          tokenResult.error || "Invalid or expired reset token",
        );
      }

      const userId = tokenResult.userId!;

      // Find user
      const user = await (this.prisma as any).user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException("User not found");
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
      await this.logAudit(
        userId,
        "password_reset_completed",
        "user",
        userId,
        null,
        null,
      );

      this.logger.log(`Password reset completed for user: ${userId}`);

      return {
        message: "Password has been reset successfully. Please log in.",
      };
    } catch (error: any) {
      this.logger.error(
        `Password reset error: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const accessTokenPayload = {
        sub: userId,
        email,
        role,
        type: "access",
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: `${this.configService.get<number>("JWT_EXPIRY_HOURS", 1)}h`,
      });

      const refreshTokenPayload = {
        sub: userId,
        type: "refresh",
      };

      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        expiresIn: `${this.configService.get<number>("JWT_REFRESH_EXPIRY_DAYS", 7)}d`,
      });

      // Hash and store refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(
        Date.now() +
        this.configService.get<number>("JWT_REFRESH_EXPIRY_DAYS", 7) *
        24 *
        60 *
        60 *
        1000,
      );

      await this.prisma.refreshToken.create({
        data: {
          user_id: userId,
          token_hash: refreshTokenHash,
          expires_at: expiresAt,
        },
      });

      return { accessToken, refreshToken };
    } catch (error: any) {
      this.logger.error(
        `Error generating tokens: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Mask email for display
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) {
      return `${localPart.charAt(0)}***@${domain}`;
    }
    return `${localPart.charAt(0)}${localPart.slice(1, 3).replace(/./g, "*")}${localPart.slice(3)}@${domain}`;
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
    ipAddress?: string,
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
    } catch (error: any) {
      this.logger.error(
        `Error logging audit: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      // Don't throw - audit logging shouldn't block main operation
    }
  }
}
