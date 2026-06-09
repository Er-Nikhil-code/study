// Auth Types

// Step 1: Register (Email + Name only)
export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName?: string;
}

export interface RegisterResponse {
  message: string;
  email_masked: string;
  otp_expiry_minutes: number;
}

// Step 2: Verify OTP (Email + OTP + Password)
export interface VerifyOtpRequest {
  email: string;
  otp: string;
  password: string;
  firstName: string;
  lastName?: string;
  role?: "STUDENT";
}

export interface VerifyOtpResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    role: string;
    profile_picture?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    role: string;
    profile_picture?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  email_masked: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  role: string;
  profile_picture?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}
