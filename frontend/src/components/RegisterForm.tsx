"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";
import authService from "@/services/auth.service";
import { useAuthStore, AuthUser } from "@/store/auth.store";
import { useFormState } from "@/hooks/useFormState";
import { useOtpTimer } from "@/hooks/useOtpTimer";
import Link from "next/link";

export function RegisterForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [apiError, setApiError] = useState("");
  const { setAuth } = useAuthStore();

  const { formState, errors, updateField, setError, clearErrors } =
    useFormState();
  const { formattedTime, isExpired } = useOtpTimer(300); // 5 minutes

  const validateStep1 = (): boolean => {
    clearErrors();
    let isValid = true;

    // Email validation
    if (!formState.email) {
      setError("email", "Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      setError("email", "Invalid email format");
      isValid = false;
    }

    // First name validation
    if (!formState.firstName) {
      setError("firstName", "First name is required");
      isValid = false;
    }

    return isValid;
  };

  const validateStep2 = (): boolean => {
    clearErrors();
    let isValid = true;

    // OTP validation
    if (!formState.otp) {
      setError("otp", "OTP is required");
      isValid = false;
    } else if (!/^\d{6}$/.test(formState.otp)) {
      setError("otp", "OTP must be 6 digits");
      isValid = false;
    }

    // Password validation
    if (!formState.password) {
      setError("password", "Password is required");
      isValid = false;
    } else if (formState.password.length < 8) {
      setError("password", "Password must be at least 8 characters");
      isValid = false;
    }

    // Confirm password validation
    if (formState.password !== formState.confirmPassword) {
      setError("confirmPassword", "Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleRegisterStep1 = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    setApiError("");

    try {
      // Step 1: Send only email + firstName
      const response = await authService.register({
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName || undefined,
      });

      setMaskedEmail(response.email_masked);
      setSuccessMessage("OTP sent to your email! Expires in 5 minutes.");
      setStep(2);
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
    if (!validateStep2()) return;

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

      // Update Zustand store so the session is established
      if (result.user && result.accessToken) {
        setAuth(result.user as AuthUser, result.accessToken);
      }

      setSuccessMessage("✅ Account created successfully! Redirecting...");
      // Redirect to dashboard or home
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
        "Invalid OTP or verification failed";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSuccessMessage("");
  };

  // Step 1: Email, Password, and Basic Info
  if (step === 1) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Create Account
        </h1>
        <p className="text-gray-600 mb-6">Join the CODIFY</p>

        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegisterStep1();
          }}
          className="space-y-4"
        >
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formState.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Email address"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-red-500"
                }`}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* First Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formState.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="First name"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.firstName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-red-500"
                }`}
              disabled={loading}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formState.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Last name (Optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={loading}
            />
          </div>



          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          >
            {loading ? "Sending OTP..." : "Continue"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-red-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    );
  }

  // Step 2: OTP Verification
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Verify Email</h1>
      <p className="text-gray-600 mb-6">
        Enter the 6-digit code sent to {maskedEmail}
      </p>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {apiError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {isExpired && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-700">OTP has expired</p>
            <button
              onClick={handleBackToStep1}
              className="text-sm text-yellow-600 hover:underline mt-1"
            >
              Request a new OTP
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerifyOtp();
        }}
        className="space-y-4"
      >
        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            6-Digit Code
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={formState.otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                updateField("otp", value);
              }}
              placeholder="6-digit code"
              className={`w-full px-4 py-3 text-center text-2xl border-2 rounded-lg font-mono tracking-widest focus:outline-none transition ${errors.otp
                  ? "border-red-500 focus:ring-2 focus:ring-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-red-500"
                }`}
              disabled={loading || isExpired}
            />
          </div>
          {errors.otp && (
            <p className="text-sm text-red-600 mt-1">{errors.otp}</p>
          )}
        </div>

        {/* Timer Display */}
        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
          <span className="text-sm text-gray-700">Code expires in:</span>
          <div className="flex items-center gap-2">
            <Clock
              className={`w-4 h-4 ${isExpired ? "text-red-600" : "text-red-600"}`}
            />
            <span
              className={`text-sm font-mono font-bold ${isExpired ? "text-red-600" : "text-gray-900"
                }`}
            >
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formState.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Minimum 8 characters"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-red-500"
                }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formState.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Confirm password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-red-500"
                }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || isExpired}
          className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
        >
          {loading ? "Verifying..." : "Verify & Create Account"}
        </button>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBackToStep1}
          className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          Back
        </button>
      </form>
    </div>
  );
}
