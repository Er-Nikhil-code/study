import axios, { AxiosInstance } from "axios";
import type {
  RegisterRequest,
  RegisterResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@/types/auth";

class AuthService {
  private api: AxiosInstance;

  constructor() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    this.api = axios.create({
      baseURL: apiUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Add response interceptor for 401 Unauthorized
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
            // Check if we are already on a public page to prevent redirect loops
            const publicPages = ["/", "/register", "/forgot-password", "/reset-password"];
            if (!publicPages.includes(window.location.pathname)) {
              localStorage.removeItem("codify-auth");
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
              window.location.href = "/";
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.api.post<RegisterResponse>(
      "/auth/register",
      data,
    );
    return response.data;
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await this.api.post<VerifyOtpResponse>(
      "/auth/register/verify-otp",
      data,
    );

    // Store tokens
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  }

  async login(data: LoginRequest): Promise<LoginResponse>;
  async login(email: string, password: string): Promise<LoginResponse>;
  async login(
    emailOrData: string | LoginRequest,
    password?: string,
  ): Promise<LoginResponse> {
    const loginData: LoginRequest =
      typeof emailOrData === "string"
        ? { email: emailOrData, password: password! }
        : emailOrData;

    const response = await this.api.post<LoginResponse>(
      "/auth/login",
      loginData,
    );

    // Store tokens
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  }

  async forgotPassword(
    data: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    const response = await this.api.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      data,
    );
    return response.data;
  }

  async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    const response = await this.api.post<ResetPasswordResponse>(
      "/auth/reset-password",
      data,
    );
    return response.data;
  }

  async me(): Promise<any> {
    const response = await this.api.get("/auth/me");
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  getUser(): any {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}

export const authService = new AuthService();
export default authService;
