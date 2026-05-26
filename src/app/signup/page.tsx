'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Vote, ArrowLeft, Mail, Lock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Signup() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP flow states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Resend Timer states
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP timer countdown
  useEffect(() => {
    let interval: any;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  // Format timer into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Step 1: Submit email + password to trigger OTP email
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate signup');
      }

      setShowOtpModal(true);
      setTimer(300);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP code submission
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    const otpCode = otpValues.join('');
    if (otpCode.length < 6) {
      setOtpError('Please enter the complete 6-digit code');
      setOtpLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Fire beautiful canvas confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Brief delay to let them enjoy the animation before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setOtpError('');
    setTimer(300);
    setCanResend(false);
    setOtpValues(['', '', '', '', '', '']);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error('Resend failed');
      }
    } catch (err: any) {
      setOtpError('Failed to resend code. Please try again.');
    }
  };

  // OTP box input navigation
  const handleOtpChange = (value: string, index: number) => {
    // Only accept numbers
    if (value && !/^\d+$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value.substring(value.length - 1); // Keep last char
    setOtpValues(newValues);

    // Auto-focus next box
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Auto-focus previous box on Backspace
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Auto submit when all 6 digits are typed
  useEffect(() => {
    if (otpValues.join('').length === 6) {
      handleVerifyOtp();
    }
  }, [otpValues]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
      {/* Background circles */}
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
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-xl shadow-indigo-500/25 mb-4">
            <Vote className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-outfit text-3xl font-bold text-white">Create your account</h2>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Sign up to build, launch, and analyze secure polls.
          </p>
        </div>

        {/* Signup form card */}
        {!showOtpModal ? (
          <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl">
            {error && (
              <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
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
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  Password
                </label>
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
                <span className="text-[10px] text-gray-500 mt-2 block">
                  Must be at least 6 characters.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Log In
              </Link>
            </div>
          </div>
        ) : (
          /* OTP verification code verification */
          <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl animate-fade-in-up">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-outfit text-xl font-bold text-white">Enter Security Code</h3>
              <p className="text-gray-400 text-sm mt-1.5 px-4 leading-relaxed">
                We sent a 6-digit verification code to <br />
                <span className="text-indigo-300 font-semibold">{email}</span>.
              </p>
            </div>

            {otpError && (
              <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Professional horizontal 6-PIN grid */}
              <div className="grid grid-cols-6 gap-2 mb-4 w-full">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    pattern="\d*"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-full aspect-square max-w-[3rem] mx-auto text-center text-lg sm:text-xl font-bold bg-white/5 border border-white/15 focus:border-indigo-500/60 focus:bg-white/10 rounded-xl focus:shadow-[0_0_12px_rgba(99,102,241,0.2)] outline-none text-white transition-all"
                  />
                ))}
              </div>

              <div className="text-center text-sm">
                {timer > 0 ? (
                  <span className="text-gray-500">
                    Code expires in: <span className="text-indigo-300 font-semibold font-mono">{formatTime(timer)}</span>
                  </span>
                ) : (
                  <span className="text-red-400 font-medium">Code expired. Please request a new one.</span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={otpLoading || otpValues.join('').length < 6}
                  className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2"
                >
                  {otpLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Verify & Sign Up</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || otpLoading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    canResend
                      ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-white'
                      : 'border-white/5 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Resend Code {!canResend && `(${formatTime(timer)})`}
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowOtpModal(false)}
              className="w-full text-center mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Change email address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
