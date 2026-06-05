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
        `📧 Email service not configured - skipping email to ${dto.to}`,
      );
      return { messageId: "skipped-no-service" };
    }

    try {
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
      }

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      this.logger.log(
        `Email sent successfully to ${dto.to} with template ID ${dto.templateId}`,
      );

      return {
        messageId: response.data.messageId || response.data.id || "sent",
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${dto.to}: ${error?.message || "Unknown error"}`,
        error?.stack,
      );
      throw new Error(
        `Email send failed: ${error?.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    firstName?: string,
  ): Promise<{ messageId: string }> {
    const templateId =
      this.configService.get<number>("BREVO_OTP_TEMPLATE_ID") || 1;

    return this.sendTemplateEmail({
      to: email,
      templateId,
      params: {
        firstName: firstName || "User",
        otp,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    firstName?: string,
  ): Promise<{ messageId: string }> {
    const templateId =
      this.configService.get<number>("BREVO_PASSWORD_RESET_TEMPLATE_ID") || 2;

    return this.sendTemplateEmail({
      to: email,
      templateId,
      params: {
        firstName: firstName || "User",
        resetUrl,
      },
    });
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
        `Email send failed: ${error?.message || "Unknown error"}`,
      );
    }
  }
}
