'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import authService from '@/services/auth.service';
import { useFormState } from '@/hooks/useFormState';

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token: initialToken }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(initialToken || '');
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const { formState, errors, updateField, setError, clearErrors } = useFormState();

  // Get token from URL query params if not provided as prop
  useEffect(() => {
    if (!token && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
      }
    }
  }, [token]);

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    if (!token) {
      setApiError('Invalid or missing reset token. Please request a new one.');
      isValid = false;
    }

    if (!formState.password) {
      setError('password', 'Password is required');
      isValid = false;
    } else if (formState.password.length < 8) {
      setError('password', 'Password must be at least 8 characters');
      isValid = false;
    }

    if (formState.password !== formState.confirmPassword) {
      setError('confirmPassword', 'Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

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
        'An error occurred while resetting your password';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Reset Password</h1>
        <p className="text-gray-600 mb-6">Invalid reset link</p>

        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-700 font-medium">Invalid or expired token</p>
            <p className="text-sm text-yellow-600 mt-1">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
        </div>

        <a
          href="/forgot-password"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-center block"
        >
          Request New Reset Link
        </a>

        <a
          href="/login"
          className="mt-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Password Reset</h1>
        <p className="text-gray-600 mb-6">Your password has been successfully reset</p>

        <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-700 font-medium">Password updated!</p>
            <p className="text-sm text-green-600 mt-1">
              You can now log in with your new password.
            </p>
          </div>
        </div>

        <a
          href="/login"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-center block"
        >
          Back to Login
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <a
        href="/login"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </a>

      <h1 className="text-3xl font-bold mb-2 text-gray-900">Create New Password</h1>
      <p className="text-gray-600 mb-6">Enter your new password below</p>

      {apiError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formState.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Min 8 characters"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
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
              type={showConfirmPassword ? 'text' : 'password'}
              value={formState.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="Re-enter your password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${
                errors.confirmPassword
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
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
            <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
