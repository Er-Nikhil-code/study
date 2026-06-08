"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import authService from "@/services/auth.service";
import { useFormState } from "@/hooks/useFormState";

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({
  token: initialToken,
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(initialToken || "");
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const { formState, errors, updateField, setError, clearErrors } =
    useFormState();

  // Get token from URL query params if not provided as prop
  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        setToken(urlToken);
      }
    }
  }, [token]);

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    if (!token) {
      setApiError("Invalid or missing reset token. Please request a new one.");
      isValid = false;
    }

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError("");

    try {
      await authService.resetPassword({
        token,
        newPassword: formState.password,
        confirmPassword: formState.confirmPassword,
      });

      setSuccess(true);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while resetting your password";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  /* ──────── No token state ──────── */
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-3xl border border-red-900/25 bg-white/[0.03] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Reset Password
          </h1>
          <p className="text-gray-400 mb-6">Invalid reset link</p>

          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <p className="text-sm text-amber-200 font-medium">
                Invalid or expired token
              </p>
              <p className="text-sm text-amber-300/70 mt-1">
                The password reset link is invalid or has expired. Please request
                a new one.
              </p>
            </div>
          </div>

          <a
            href="/forgot-password"
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 text-sm text-center block"
          >
            Request New Reset Link
          </a>

          <a
            href="/"
            className="mt-4 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition text-sm"
          >
            ← Back to login
          </a>
        </div>
      </div>
    );
  }

  /* ──────── Success state ──────── */
  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-3xl border border-red-900/25 bg-white/[0.03] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Password Reset
          </h1>
          <p className="text-gray-400 mb-6">
            Your password has been successfully reset
          </p>

          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-start gap-3">
            <svg
              className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div>
              <p className="text-sm text-emerald-200 font-medium">
                Password updated!
              </p>
              <p className="text-sm text-emerald-300/70 mt-1">
                You can now log in with your new password.
              </p>
            </div>
          </div>

          <a
            href="/"
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 text-sm text-center block"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  /* ──────── Form state ──────── */
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-3xl border border-red-900/25 bg-white/[0.03] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <a
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition text-sm"
        >
          ← Back
        </a>

        <h1 className="text-3xl font-bold mb-2 text-white">
          Create New Password
        </h1>
        <p className="text-gray-400 mb-6 text-sm">
          Enter your new password below
        </p>

        {apiError && (
          <div className="mb-4 rounded-2xl border border-red-600/30 bg-red-600/10 p-3 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-400">{apiError}</p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-5"
        >
          {/* Password Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formState.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Min 8 characters"
                className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border ${
                  errors.password
                    ? "border-red-500/50"
                    : "border-slate-600/30"
                } text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all pr-16`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300 transition"
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
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formState.confirmPassword}
                onChange={(e) =>
                  updateField("confirmPassword", e.target.value)
                }
                placeholder="Re-enter your password"
                className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border ${
                  errors.confirmPassword
                    ? "border-red-500/50"
                    : "border-slate-600/30"
                } text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all pr-16`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300 transition"
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
              <p className="text-red-400 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-6"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
