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
          This OTP will expire in <strong>2 minutes</strong>.
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
   * Send Invoice Email after purchase
   */
  async sendInvoiceEmail(data: {
    email: string;
    firstName: string;
    lastName?: string | null;
    userId: string;
    phone?: string | null;
    invoiceNumber: string;
    amount: number;
    date: Date;
    items: Array<{ name: string; price: number }>;
  }): Promise<{ messageId: string }> {
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
    const formattedDate = new Date(data.date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    
    let itemsHtml = '';
    data.items.forEach((item, index) => {
      itemsHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
        </tr>
      `;
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
      <div style="max-width: 650px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #111827; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 0;">
          Purchase Invoice - Codify
        </h2>

        <p style="color: #4b5563; font-size: 16px;">Hello ${fullName},</p>
        <p style="color: #4b5563;">Thank you for your purchase! Here are your invoice details:</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937; margin-bottom: 15px;">Customer Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #6b7280; width: 120px;">Name:</td>
              <td style="padding: 4px 0; color: #111827; font-weight: 500;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">User ID:</td>
              <td style="padding: 4px 0; color: #111827; font-family: monospace;">${data.userId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Email:</td>
              <td style="padding: 4px 0; color: #111827;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Phone:</td>
              <td style="padding: 4px 0; color: #111827;">${data.phone || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="color: #1f2937; margin-bottom: 10px;">Order Details</h3>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
            <strong>Invoice #:</strong> ${data.invoiceNumber} <br/>
            <strong>Date:</strong> ${formattedDate}
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f87171; color: white;">
                <th style="padding: 10px 12px; text-align: left; border-radius: 6px 0 0 0;">#</th>
                <th style="padding: 10px 12px; text-align: left;">Item Description</th>
                <th style="padding: 10px 12px; text-align: right; border-radius: 0 6px 0 0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #111827;">Total Amount:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; color: #ef4444; font-size: 16px;">
                  ₹${data.amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p style="color: #4b5563; font-size: 14px; margin-top: 30px;">
          You can access your purchased courses and tests from your dashboard.
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Codify. All rights reserved.
        </p>
      </div>
    </body>
    </html>
    `;

    return this.sendCustomEmail(
      data.email,
      `Purchase Invoice: ${data.invoiceNumber} - Codify`,
      htmlContent
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
