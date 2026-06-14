"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  User,
  Lock,
  Shield,
} from "lucide-react";
import authService from "@/services/auth.service";
import { useAuthStore, AuthUser } from "@/store/auth.store";
import { useFormState } from "@/hooks/useFormState";
import { useOtpTimer } from "@/hooks/useOtpTimer";
import Link from "next/link";

// Step indicator
function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            s === step
              ? "w-6 h-2 bg-red-500"
              : s < step
              ? "w-2 h-2 bg-red-300"
              : "w-2 h-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// Inline field error
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 animate-in slide-in-from-top-1 duration-200">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

// Inline banner (success / error) — below field, not full-screen
function InlineBanner({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const isError = type === "error";
  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
        isError
          ? "bg-red-50 border border-red-100 text-red-600"
          : "bg-emerald-50 border border-emerald-100 text-emerald-700"
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      )}
      <span>{message}</span>
    </div>
  );
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [apiError, setApiError] = useState("");

  // Step 1 = basic info, Step 2 = OTP, Step 3 = password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { setAuth } = useAuthStore();
  const { formState, errors, updateField, setError, clearErrors } = useFormState();
  const { formattedTime, isExpired } = useOtpTimer(300);

  const validateBasicInfo = (): boolean => {
    clearErrors();
    setApiError("");
    let isValid = true;
    if (!formState.firstName) {
      setError("firstName", "First name is required");
      isValid = false;
    }
    if (!formState.email) {
      setError("email", "Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      setError("email", "Enter a valid email address");
      isValid = false;
    }
    return isValid;
  };

  const validatePassword = (): boolean => {
    clearErrors();
    setApiError("");
    let isValid = true;
    if (!formState.password) {
      setError("password", "Password is required");
      isValid = false;
    } else if (formState.password.length < 8) {
      setError("password", "Must be at least 8 characters");
      isValid = false;
    }
    if (formState.password !== formState.confirmPassword) {
      setError("confirmPassword", "Passwords do not match");
      isValid = false;
    }
    return isValid;
  };

  const handleSendOtp = async () => {
    if (!validateBasicInfo()) return;
    setLoading(true);
    try {
      const response = await authService.register({
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName || undefined,
      });
      setMaskedEmail(response.email_masked);
      setStep(2);
    } catch (error: any) {
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    clearErrors();
    setApiError("");
    if (!formState.otp || !/^\d{6}$/.test(formState.otp)) {
      setError("otp", "Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtpCode(formState.email, formState.otp);
      setStep(3);
    } catch (error: any) {
      setApiError(
        error.response?.data?.message || error.message || "Invalid code. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoading(true);
    try {
      const result = await authService.verifyOtp({
        email: formState.email,
        otp: formState.otp,
        password: formState.password,
        firstName: formState.firstName,
        lastName: formState.lastName || undefined,
        role: formState.role,
      });
      if (result.user && result.accessToken) {
        setAuth(result.user as AuthUser, result.accessToken);
      }
      setSuccessMessage("Account created! Redirecting…");
      setTimeout(() => {
        const role = (formState.role as string) || "STUDENT";
        if (role === "ADMIN") window.location.href = "/admin";
        else if (role === "TEACHER") window.location.href = "/teacher";
        else if (role === "INTERN") window.location.href = "/intern/dashboard";
        else window.location.href = "/student/dashboard";
      }, 1800);
    } catch (error: any) {
      setApiError(
        error.response?.data?.message || error.message || "Failed to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-rose-500" />

        <div className="px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {step === 1 && "Create account"}
              {step === 2 && "Verify your email"}
              {step === 3 && "Set your password"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {step === 1 && "Join CODIFY — it's free"}
              {step === 2 && (
                <>
                  Code sent to{" "}
                  <span className="font-medium text-gray-600">{maskedEmail}</span>
                </>
              )}
              {step === 3 && "Almost done! Choose a strong password."}
            </p>
          </div>

          <StepDots step={step} />

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    value={formState.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Jane"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300 ${
                      errors.firstName
                        ? "border-red-300 focus:ring-red-500/20"
                        : "border-gray-200 focus:ring-red-500/20 focus:border-red-400"
                    }`}
                  />
                </div>
                <FieldError message={errors.firstName} />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Last Name{" "}
                  <span className="text-gray-300 font-normal normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    value={formState.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Doe"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-300" />
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="jane@example.com"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300 ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500/20"
                        : "border-gray-200 focus:ring-red-500/20 focus:border-red-400"
                    }`}
                  />
                </div>
                <FieldError message={errors.email} />
              </div>

              {/* API error banner — inline, below fields */}
              {apiError && <InlineBanner type="error" message={apiError} />}

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                    </svg>
                    Sending code…
                  </span>
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 pt-2">
                Already have an account?{" "}
                <Link href="/login" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Verification Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formState.otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      updateField("otp", val);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    placeholder="123456"
                    disabled={loading || isExpired}
                    autoFocus
                    className={`w-full pl-10 pr-4 py-2.5 text-sm font-mono tracking-[0.3em] border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300 placeholder:tracking-normal ${
                      errors.otp
                        ? "border-red-300 focus:ring-red-500/20"
                        : "border-gray-200 focus:ring-red-500/20 focus:border-red-400"
                    }`}
                  />
                </div>
                <FieldError message={errors.otp} />
              </div>

              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
                  isExpired ? "text-red-500" : "text-gray-400"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {isExpired ? "Code expired" : `Expires in ${formattedTime}`}
              </div>

              {isExpired && (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    handleSendOtp();
                  }}
                  className="text-xs text-red-500 hover:text-red-600 underline underline-offset-2 transition-colors"
                >
                  Resend a new code
                </button>
              )}

              {/* API error banner — inline */}
              {apiError && <InlineBanner type="error" message={apiError} />}

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || isExpired || formState.otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                    </svg>
                    Verifying…
                  </span>
                ) : (
                  <>
                    Verify Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setApiError("");
                }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                ← Change email
              </button>
            </div>
          )}

          {/* ── STEP 3: Password ── */}
          {step === 3 && (
            <form
              onSubmit={handleCreateAccount}
              className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {/* Email verified pill */}
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-medium text-emerald-700 truncate">
                  {formState.email}
                </span>
                <span className="ml-auto text-xs text-emerald-500 font-semibold whitespace-nowrap">
                  Verified ✓
                </span>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formState.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    disabled={loading}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300 ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500/20"
                        : "border-gray-200 focus:ring-red-500/20 focus:border-red-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-300 hover:text-gray-500 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-300" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formState.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="Repeat password"
                    disabled={loading}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300 ${
                      errors.confirmPassword
                        ? "border-red-300 focus:ring-red-500/20"
                        : "border-gray-200 focus:ring-red-500/20 focus:border-red-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-300 hover:text-gray-500 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={errors.confirmPassword} />
              </div>

              {/* Success or error banners — inline */}
              {successMessage && <InlineBanner type="success" message={successMessage} />}
              {apiError && <InlineBanner type="error" message={apiError} />}

              <button
                type="submit"
                disabled={loading || !!successMessage}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                    </svg>
                    Creating account…
                  </span>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      {step === 1 && (
        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{" "}
          <span className="text-gray-500 underline underline-offset-2 cursor-pointer">Terms</span>{" "}
          &amp;{" "}
          <span className="text-gray-500 underline underline-offset-2 cursor-pointer">Privacy Policy</span>
        </p>
      )}
    </div>
  );
}
