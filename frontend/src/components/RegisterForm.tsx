"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Clock, Eye, EyeOff, X } from "lucide-react";
import authService from "@/services/auth.service";
import { useAuthStore, AuthUser } from "@/store/auth.store";
import { useFormState } from "@/hooks/useFormState";
import { useOtpTimer } from "@/hooks/useOtpTimer";
import Link from "next/link";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [apiError, setApiError] = useState("");
  
  // New States for Flow
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const { setAuth } = useAuthStore();
  const { formState, errors, updateField, setError, clearErrors } = useFormState();
  const { formattedTime, isExpired } = useOtpTimer(300); // 5 minutes

  const validateBasicInfo = (): boolean => {
    clearErrors();
    let isValid = true;

    // First name validation
    if (!formState.firstName) {
      setError("firstName", "First name is required");
      isValid = false;
    }

    // Email validation
    if (!formState.email) {
      setError("email", "Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      setError("email", "Invalid email format");
      isValid = false;
    }

    return isValid;
  };

  const validatePassword = (): boolean => {
    clearErrors();
    let isValid = true;

    if (!formState.password) {
      setError("password", "Password is required");
      isValid = false;
    } else if (formState.password.length < 8) {
      setError("password", "Password must be at least 8 characters");
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
    setApiError("");
    setSuccessMessage("");

    try {
      const response = await authService.register({
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName || undefined,
      });

      setMaskedEmail(response.email_masked);
      setShowOtpModal(true);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "An error occurred during registration";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formState.otp || !/^\d{6}$/.test(formState.otp)) {
      setError("otp", "OTP must be 6 digits");
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await authService.verifyOtpCode(formState.email, formState.otp);
      setIsOtpVerified(true);
      setShowOtpModal(false);
      setSuccessMessage("Email verified successfully! Please create your password.");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Invalid OTP";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    setApiError("");

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

      setSuccessMessage("✅ Account created successfully! Redirecting...");
      setTimeout(() => {
        const role = (formState.role as string) || "STUDENT";
        if (role === "ADMIN") window.location.href = "/admin";
        else if (role === "TEACHER") window.location.href = "/teacher";
        else if (role === "INTERN") window.location.href = "/intern/dashboard";
        else window.location.href = "/student/dashboard";
      }, 2000);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create account";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-xl">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Create Account</h1>
      <p className="text-gray-600 mb-6">Join the CODIFY</p>

      {apiError && !showOtpModal && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {successMessage && !showOtpModal && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleCreateAccount} className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            value={formState.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="First name"
            disabled={isOtpVerified || loading}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-red-500"
            } disabled:bg-gray-50 disabled:text-gray-500`}
          />
          {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (Optional)</label>
          <input
            type="text"
            value={formState.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Last name"
            disabled={isOtpVerified || loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Email with Send OTP Button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={formState.email}
              onChange={(e) => {
                updateField("email", e.target.value);
                setIsOtpVerified(false); // Reset verification if email changes
              }}
              placeholder="Email address"
              disabled={isOtpVerified || loading}
              className={`flex-1 min-w-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-red-500"
              } disabled:bg-gray-50 disabled:text-gray-500`}
            />
            
            {isOtpVerified ? (
              <div className="flex items-center justify-center px-4 bg-green-50 border border-green-200 rounded-lg text-green-600" title="Email verified">
                <CheckCircle className="w-5 h-5" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !formState.email}
                className="whitespace-nowrap py-2 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading && !showOtpModal ? "Sending..." : "Send OTP"}
              </button>
            )}
          </div>
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        {/* Password Fields - Only visible after OTP verification */}
        {isOtpVerified && (
          <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formState.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${
                    errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-red-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formState.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Confirm password"
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${
                    errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-red-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed mt-4 shadow-md shadow-red-600/20"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        )}

        {!isOtpVerified && (
          <p className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
            Already have an account?{" "}
            <Link href="/login" className="text-red-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        )}
      </form>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Email</h2>
            <p className="text-sm text-gray-600 mb-6">
              We've sent a 6-digit code to <span className="font-medium text-gray-900">{maskedEmail}</span>
            </p>

            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            {isExpired && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex flex-col items-start gap-1">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-700 font-medium">OTP has expired</p>
                </div>
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    handleSendOtp();
                  }}
                  className="text-sm text-yellow-700 hover:text-yellow-800 underline ml-7"
                >
                  Send a new code
                </button>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={formState.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    updateField("otp", value);
                  }}
                  placeholder="••••••"
                  className={`w-full px-4 py-3 text-center text-3xl tracking-[0.5em] font-mono border-2 rounded-xl focus:outline-none transition ${
                    errors.otp ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  }`}
                  disabled={loading || isExpired}
                  autoFocus
                />
                {errors.otp && <p className="text-sm text-center text-red-600 mt-2">{errors.otp}</p>}
              </div>

              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                <Clock className={`w-4 h-4 mr-2 ${isExpired ? "text-red-500" : "text-gray-500"}`} />
                <span className={`text-sm font-mono font-medium ${isExpired ? "text-red-500" : "text-gray-700"}`}>
                  {formattedTime}
                </span>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || isExpired || formState.otp.length !== 6}
                className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
