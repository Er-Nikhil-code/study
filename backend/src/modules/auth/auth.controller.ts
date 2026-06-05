import { Controller, Post, Body, BadRequestException, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterRequest,
  RegisterRequestSchema,
  RegisterResponse,
  VerifyOtpRequest,
  VerifyOtpRequestSchema,
  VerifyOtpResponse,
  ForgotPasswordRequest,
  ForgotPasswordRequestSchema,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordRequestSchema,
  ResetPasswordResponse,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   * Step 1: Register user and send OTP
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Validate request
      const parsed = RegisterRequestSchema.safeParse(body);
      if (!parsed.success) {
        throw new BadRequestException(parsed.error.errors[0].message);
      }

      const result = await this.authService.register(
        parsed.data.email.toLowerCase(),
        parsed.data.firstName
      );

      return {
        message: 'OTP has been sent to your email. Please verify to complete registration.',
        email_masked: result.email_masked,
        otp_expiry_minutes: result.otp_expiry_minutes,
      };
    } catch (error) {
      this.logger.error(`Register endpoint error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /auth/register/verify-otp
   * Step 2: Verify OTP and create user account
   */
  @Post('register/verify-otp')
  @HttpCode(HttpStatus.CREATED)
  async verifyOtp(@Body() body: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      // Validate request
      const parsed = VerifyOtpRequestSchema.safeParse(body);
      if (!parsed.success) {
        throw new BadRequestException(parsed.error.errors[0].message);
      }

      const result = await this.authService.verifyOtpAndCreateUser(
        parsed.data.email.toLowerCase(),
        parsed.data.otp,
        parsed.data.password,
        parsed.data.firstName,
        parsed.data.lastName,
        parsed.data.role as 'STUDENT' | 'PENDING_TEACHER'
      );

      return {
        message: 'Account created successfully!',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      this.logger.error(`Verify OTP endpoint error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /auth/forgot-password
   * Step 1: Initiate password reset and send reset link
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() body: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    try {
      // Validate request
      const parsed = ForgotPasswordRequestSchema.safeParse(body);
      if (!parsed.success) {
        throw new BadRequestException(parsed.error.errors[0].message);
      }

      const result = await this.authService.forgotPassword(
        parsed.data.email.toLowerCase()
      );

      return {
        message: 'If an account exists with this email, a password reset link has been sent. Please check your email.',
        email_masked: result.email_masked,
      };
    } catch (error) {
      this.logger.error(`Forgot password endpoint error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /auth/reset-password
   * Step 2: Verify reset token and update password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    try {
      // Validate request
      const parsed = ResetPasswordRequestSchema.safeParse(body);
      if (!parsed.success) {
        throw new BadRequestException(parsed.error.errors[0].message);
      }

      const result = await this.authService.resetPassword(
        parsed.data.token,
        parsed.data.newPassword
      );

      return { message: result.message };
    } catch (error) {
      this.logger.error(`Reset password endpoint error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
