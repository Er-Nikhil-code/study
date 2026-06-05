import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as SibApiV3Sdk from "brevo";

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
  private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("BREVO_API_KEY");

    if (!apiKey) {
      this.logger.error("BREVO_API_KEY is not configured");
      throw new Error("BREVO_API_KEY environment variable is required");
    }

    const configuration = new SibApiV3Sdk.Configuration();
    configuration.apiKey = apiKey;
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi(configuration);
  }

  /**
   * Send email using Brevo template
   */
  async sendTemplateEmail(dto: SendEmailDto): Promise<{ messageId: string }> {
    try {
      const senderEmail = this.configService.get<string>("BREVO_SENDER_EMAIL");
      const senderName = this.configService.get<string>("BREVO_SENDER_NAME");

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: dto.to }];
      sendSmtpEmail.sender = {
        name: senderName,
        email: senderEmail,
      };
      sendSmtpEmail.templateId = dto.templateId;

      if (dto.params) {
        sendSmtpEmail.params = dto.params;
      }

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      this.logger.log(
        `Email sent successfully to ${dto.to} with template ID ${dto.templateId}`,
      );

      return {
        messageId: response.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${dto.to}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Email send failed: ${error.message}`);
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
    const templateId = this.configService.get<number>("BREVO_OTP_TEMPLATE_ID");

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
    const templateId = this.configService.get<number>(
      "BREVO_PASSWORD_RESET_TEMPLATE_ID",
    );

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
    try {
      const senderEmail = this.configService.get<string>("BREVO_SENDER_EMAIL");
      const senderName = this.configService.get<string>("BREVO_SENDER_NAME");

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.to = [{ email }];
      sendSmtpEmail.sender = {
        name: senderName,
        email: senderEmail,
      };
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      this.logger.log(
        `Custom email sent to ${email} with subject "${subject}"`,
      );

      return {
        messageId: response.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send custom email to ${email}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}
