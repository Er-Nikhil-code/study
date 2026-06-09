import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

export interface SendEmailDto {
  to: string;
  templateId: number;
  params?: Record<string, string>;
  subject?: string;
  htmlContent?: string;
}

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private apiKey: string | null;
  private apiUrl = "https://api.brevo.com/v3/smtp/email";
  private isAvailable: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string | undefined>("BREVO_API_KEY");

    if (!apiKey) {
      this.logger.warn(
        "⚠️  BREVO_API_KEY is not configured - email sending will be disabled",
      );
      this.apiKey = null;
      this.isAvailable = false;
      return;
    }

    this.apiKey = apiKey;
    this.isAvailable = true;
    this.logger.log("✅ Brevo email service initialized");
  }

  /**
   * Send email using Brevo template
   */
  async sendTemplateEmail(dto: SendEmailDto): Promise<{ messageId: string }> {
    if (!this.isAvailable || !this.apiKey) {
      this.logger.warn(
        `📧 [BREVO] Email service not configured - skipping email to ${dto.to}`,
      );
      return { messageId: "skipped-no-service" };
    }

    try {
      this.logger.debug(
        `📤 [BREVO] Preparing to send email to ${dto.to}, template: ${dto.templateId}`,
      );

      const senderEmail = this.configService.get<string>("BREVO_SENDER_EMAIL");
      const senderName = this.configService.get<string>("BREVO_SENDER_NAME");

      const payload: any = {
        to: [{ email: dto.to }],
        sender: {
          name: senderName || "Study Platform",
          email: senderEmail || "noreply@study.app",
        },
        templateId: dto.templateId,
      };

      if (dto.params) {
        payload.params = dto.params;
        this.logger.debug(
          `📋 [BREVO] Email params: ${JSON.stringify(Object.keys(dto.params))}`,
        );
      }

      this.logger.debug(`🔗 [BREVO] Calling Brevo API...`);
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      this.logger.log(
        `✅ [BREVO] Email sent successfully to ${dto.to}, messageId: ${response.data.messageId || response.data.id}`,
      );

      return {
        messageId: response.data.messageId || response.data.id || "sent",
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [BREVO] Failed to send email to ${dto.to}: ${error?.message || "Unknown error"}`,
        error?.response?.status
          ? `Status: ${error.response.status}`
          : undefined,
      );
      this.logger.debug(
        `📊 [BREVO] Error details: ${JSON.stringify(error?.response?.data || error?.message)}`,
      );
      throw new Error(
        `Email send failed: ${
          error?.response?.data?.message || error?.message || "Unknown error"
        }`,
      );
    }
  }

  /**
   * Send OTP email
   */
  /**
   * Send OTP email without using Brevo templates
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    firstName?: string,
  ): Promise<{ messageId: string }> {
    return this.sendCustomEmail(
      email,
      "Verify Your Email - Codify",
      `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px;">
        
        <h2 style="color: #2563eb;">
          Welcome to Codify!
        </h2>

        <p>Hello ${firstName || "User"},</p>

        <p>Thank you for registering. Please use the verification code below:</p>

        <div style="
          background: #f3f4f6;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 20px 0;
        ">
          <h1 style="
            letter-spacing: 8px;
            margin: 0;
            color: #111827;
          ">
            ${otp}
          </h1>
        </div>

        <p>
          This OTP will expire in <strong>5 minutes</strong>.
        </p>

        <p>
          If you did not request this verification, please ignore this email.
        </p>

        <hr style="margin: 30px 0;">

        <p style="font-size: 12px; color: #6b7280;">
          © ${new Date().getFullYear()} Codify. All rights reserved.
        </p>

      </div>
    </body>
    </html>
    `,
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  firstName?: string,
): Promise<{ messageId: string }> {
  return this.sendCustomEmail(
    email,
    "Reset Your Password - Codify",
    `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <h2>Password Reset Request</h2>

      <p>Hello ${firstName || "User"},</p>

      <p>Click the button below to reset your password:</p>

      <p>
        <a href="${resetUrl}"
           style="
             background:#2563eb;
             color:white;
             padding:12px 20px;
             text-decoration:none;
             border-radius:6px;
             display:inline-block;
           ">
           Reset Password
        </a>
      </p>

      <p>
        If you didn't request this, you can safely ignore this email.
      </p>
    </body>
    </html>
    `,
  );
}

  /**
   * Send custom email (raw HTML content)
   */
  async sendCustomEmail(
    email: string,
    subject: string,
    htmlContent: string,
  ): Promise<{ messageId: string }> {
    if (!this.isAvailable || !this.apiKey) {
      this.logger.warn(
        `📧 Email service not configured - skipping email to ${email}`,
      );
      return { messageId: "skipped-no-service" };
    }

    try {
      const senderEmail = this.configService.get<string>("BREVO_SENDER_EMAIL");
      const senderName = this.configService.get<string>("BREVO_SENDER_NAME");

      const payload = {
        to: [{ email }],
        sender: {
          name: senderName || "Study Platform",
          email: senderEmail || "noreply@study.app",
        },
        subject,
        htmlContent,
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      this.logger.log(
        `Custom email sent to ${email} with subject "${subject}"`,
      );

      return {
        messageId: response.data.messageId || response.data.id || "sent",
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send custom email to ${email}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw new Error(
        `Email send failed: ${
          error?.response?.data?.message || error?.message || "Unknown error"
        }`,
      );
    }
  }
}
