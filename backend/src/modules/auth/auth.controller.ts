import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import {
  RegisterRequest,
  RegisterRequestSchema,
  RegisterResponse,
  VerifyOtpRequest,
  VerifyOtpRequestSchema,
  VerifyOtpResponse,
  LoginRequest,
  LoginRequestSchema,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordRequestSchema,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordRequestSchema,
  ResetPasswordResponse,
} from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   * Step 1: Register user and send OTP
   * Rate limited: 5 requests per 15 minutes
   */
  @Throttle({ default: { limit: 5, ttl: 900 } })
  @Post("register")
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: RegisterRequest): Promise<RegisterResponse> {
    try {
      this.logger.debug(
        `📝 [REGISTER] Received request for email: ${body.email}`,
      );

      // Validate request
      const parsed = RegisterRequestSchema.safeParse(body);
      if (!parsed.success) {
        const error = parsed.error as any;
        this.logger.warn(
          `⚠️  [REGISTER] Validation failed: ${error.errors?.[0]?.message}`,
        );
        throw new BadRequestException(
          error.errors?.[0]?.message || "Invalid request",
        );
      }

      this.logger.log(
        `🚀 [REGISTER] Starting registration for ${parsed.data.email}`,
      );
      const result = await this.authService.register(
        parsed.data.email.toLowerCase(),
        parsed.data.firstName,
      );

      this.logger.log(
        `✅ [REGISTER] OTP sent successfully to ${parsed.data.email}`,
      );
      return {
        message:
          "OTP has been sent to your email. Please verify to complete registration.",
        email_masked: result.email_masked,
        otp_expiry_minutes: result.otp_expiry_minutes,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [REGISTER] Error: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * POST /auth/register/verify-otp
   * Step 2: Verify OTP and create user account
   * Rate limited: 10 requests per 15 minutes
   */
  @Throttle({ default: { limit: 10, ttl: 900 } })
  @Post("register/verify-otp")
  @HttpCode(HttpStatus.CREATED)
  async verifyOtp(@Body() body: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      this.logger.debug(
        `🔐 [VERIFY-OTP] Received OTP verification for ${body.email}`,
      );

      // Validate request
      const parsed = VerifyOtpRequestSchema.safeParse(body);
      if (!parsed.success) {
        const error = parsed.error as any;
        this.logger.warn(
          `⚠️  [VERIFY-OTP] Validation failed: ${error.errors?.[0]?.message}`,
        );
        throw new BadRequestException(
          error.errors?.[0]?.message || "Invalid request",
        );
      }

      this.logger.log(`🚀 [VERIFY-OTP] Verifying OTP for ${parsed.data.email}`);
      const result = await this.authService.verifyOtpAndCreateUser(
        parsed.data.email.toLowerCase(),
        parsed.data.otp,
        parsed.data.password,
        parsed.data.firstName,
        parsed.data.lastName,
        parsed.data.role as "STUDENT" | "PENDING_TEACHER",
      );

      this.logger.log(
        `✅ [VERIFY-OTP] User created successfully: ${result.user.id}`,
      );
      return {
        message: "Account created successfully!",
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [VERIFY-OTP] Error: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * POST /auth/login
   * Login with email and password
   * Rate limited: 10 requests per 15 minutes
   */
  @Throttle({ default: { limit: 10, ttl: 900 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    try {
      // Validate request
      const parsed = LoginRequestSchema.safeParse(body);
      if (!parsed.success) {
        const error = parsed.error as any;
        throw new BadRequestException(
          error.errors?.[0]?.message || "Invalid request",
        );
      }

      const result = await this.authService.login(
        parsed.data.email.toLowerCase(),
        parsed.data.password,
      );

      return {
        message: "Login successful!",
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error: any) {
      this.logger.error(
        `Login endpoint error: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * POST /auth/forgot-password
   * Step 1: Initiate password reset and send reset link
   * Rate limited: 5 requests per 30 minutes
   */
  @Throttle({ default: { limit: 5, ttl: 1800 } })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() body: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    try {
      // Validate request
      const parsed = ForgotPasswordRequestSchema.safeParse(body);
      if (!parsed.success) {
        const error = parsed.error as any;
        throw new BadRequestException(
          error.errors?.[0]?.message || "Invalid request",
        );
      }

      const result = await this.authService.forgotPassword(
        parsed.data.email.toLowerCase(),
      );

      return {
        message:
          "If an account exists with this email, a password reset link has been sent. Please check your email.",
        email_masked: result.email_masked,
      };
    } catch (error: any) {
      this.logger.error(
        `Forgot password endpoint error: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * POST /auth/reset-password
   * Step 2: Verify reset token and update password
   * Rate limited: 5 requests per 30 minutes
   */
  @Throttle({ default: { limit: 5, ttl: 1800 } })
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    try {
      // Validate request
      const parsed = ResetPasswordRequestSchema.safeParse(body);
      if (!parsed.success) {
        const error = parsed.error as any;
        throw new BadRequestException(
          error.errors?.[0]?.message || "Invalid request",
        );
      }

      const result = await this.authService.resetPassword(
        parsed.data.token,
        parsed.data.newPassword,
      );

      return { message: result.message };
    } catch (error: any) {
      this.logger.error(
        `Reset password endpoint error: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw error;
    }
  }
}
