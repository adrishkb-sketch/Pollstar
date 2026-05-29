'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Vote, ArrowLeft, Mail, Lock, AlertTriangle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password Reset states
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // 2-Step Verification states
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      if (data.twoFactorRequired) {
        setTwoFactorRequired(true);
        setError('');
        return;
      }

      router.push(callbackUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: twoFactorOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify secure code');
      }

      router.push(callbackUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch reset code.');
      }

      setResetSuccessMessage(data.message || 'Verification code sent successfully!');
      setResetStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify and update password.');
      }

      setResetSuccessMessage(data.message || 'Password updated successfully!');
      setTimeout(() => {
        setIsResetMode(false);
        setResetStep(1);
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setResetSuccessMessage('');
        setEmail(resetEmail); // autofill their email into the login box!
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl transition-all duration-300">
      {error && (
        <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {resetSuccessMessage && (
        <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm mb-6 animate-pulse-glow">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {twoFactorRequired ? (
        <form onSubmit={handleVerifyTwoFactor} className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-outfit text-base font-bold text-white mb-1">🔒 2-Step Verification Required</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Optional two-step verification is enabled for your account. Please enter the 6-digit secure login code sent to your email.
            </p>
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={twoFactorOtp}
              onChange={(e) => setTwoFactorOtp(e.target.value)}
              placeholder="e.g. 123456"
              className="w-full text-center glass-input placeholder-gray-600 text-sm py-2.5 font-bold tracking-widest font-mono focus:border-indigo-500/50"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setTwoFactorRequired(false);
                setTwoFactorOtp('');
                setError('');
              }}
              className="flex-1 py-3 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all text-center block bg-white/3"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Verify & Login</span>
              )}
            </button>
          </div>
        </form>
      ) : !isResetMode ? (
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.com"
                className="w-full !pl-12 glass-input placeholder-gray-600 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setIsResetMode(true);
                  setResetEmail(email); // copy email to reset form
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wide transition-all"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full !pl-12 glass-input placeholder-gray-600 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-outfit text-lg font-bold text-white mb-1">Reset Account Password</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              {resetStep === 1
                ? 'Enter your registered email address below, and we will send you a 6-digit OTP code to verify your identity.'
                : 'A 6-digit verification code has been dispatched to your email. Enter it below along with your new password.'}
            </p>
          </div>

          {resetStep === 1 ? (
            <form onSubmit={handleRequestResetOtp} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@university.com"
                    className="w-full !pl-12 glass-input placeholder-gray-600 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setIsResetMode(false);
                    setResetStep(1);
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/8 text-xs font-bold text-gray-300 hover:text-white transition-all text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Send Code</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndResetPassword} className="space-y-5">
              <div>
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-center glass-input placeholder-gray-600 text-sm py-2.5 font-bold tracking-widest font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full !pl-12 glass-input placeholder-gray-600 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setResetStep(1);
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/8 text-xs font-bold text-gray-300 hover:text-white transition-all text-center"
                >
                  Request Code Again
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="text-center mt-6 text-sm text-gray-400">
        Don't have an account?{' '}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          Sign Up
        </Link>
      </div>
    </div>
  );
}


export default function Login() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center space-x-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </Link>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-xl shadow-indigo-500/25 mb-4">
            <Vote className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-outfit text-3xl font-bold text-white">Log in to Pollstar</h2>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Welcome back! Let's get started.
          </p>
        </div>

        <Suspense fallback={
          <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-mono">Initializing secure connection...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
