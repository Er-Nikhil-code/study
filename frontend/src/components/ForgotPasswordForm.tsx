'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import authService from '@/services/auth.service';
import { useFormState } from '@/hooks/useFormState';

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [apiError, setApiError] = useState('');

  const { formState, errors, updateField, setError, clearErrors } = useFormState();

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    if (!formState.email) {
      setError('email', 'Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      setError('email', 'Invalid email format');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      const response = await authService.forgotPassword({
        email: formState.email,
      });

      setMaskedEmail(response.email_masked);
      setSubmitted(true);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'An error occurred while processing your request';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Check Your Email</h1>
        <p className="text-gray-600 mb-6">
          We've sent a password reset link to {maskedEmail}
        </p>

        <div className="mb-6 p-4 bg-blue-100 border border-blue-400 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700 font-medium">Email sent successfully!</p>
            <p className="text-sm text-blue-600 mt-1">
              Click the link in your email to reset your password. The link expires in 60 minutes.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Didn't receive the email?{' '}
            <button
              onClick={() => {
                setSubmitted(false);
                updateField('email', '');
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Try again
            </button>
          </p>

          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>

        <a
          href="/register"
          className="mt-6 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Create new account
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <a
        href="/"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </a>

      <h1 className="text-3xl font-bold mb-2 text-gray-900">Reset Password</h1>
      <p className="text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {apiError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={formState.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="you@example.com"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              errors.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
