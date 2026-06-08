import { z } from "zod";

// Registration Request DTO (Step 1: Email + Name only)
export const RegisterRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// Registration Response DTO
export interface RegisterResponse {
  message: string;
  email_masked: string;
  otp_expiry_minutes: number;
}

// Verify OTP Request DTO
export const VerifyOtpRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;

// Verify OTP Response DTO
export interface VerifyOtpResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Forgot Password Request DTO
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

// Forgot Password Response DTO
export interface ForgotPasswordResponse {
  message: string;
  email_masked: string;
}

// Reset Password Request DTO
export const ResetPasswordRequestSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// Reset Password Response DTO
export interface ResetPasswordResponse {
  message: string;
}

// Login Request DTO
export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Login Response DTO
export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Error Response DTO
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
}
