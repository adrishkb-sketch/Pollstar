'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Mail, Lock, AlertTriangle } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      if (data.user.role !== 'ADMIN') {
        throw new Error('Access denied. This portal is only accessible by System Administrators.');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 min-h-screen relative bg-[#030712]">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center space-x-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </Link>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl shadow-xl shadow-purple-500/25 mb-4 border border-purple-500/30">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-outfit text-3xl font-bold text-white tracking-tight">System Admin</h2>
          <p className="text-gray-400 text-sm mt-2 text-center max-w-xs leading-relaxed">
            Enter administrative credentials to unlock the console gateway.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl">
          {error && (
            <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                Admin Username / Login ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <Mail className="w-5 h-5 text-purple-400" />
                </span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin Login ID"
                  className="w-full !pl-12 glass-input placeholder-gray-600 text-sm focus:border-purple-500/50 focus:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <Lock className="w-5 h-5 text-purple-400" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full !pl-12 glass-input placeholder-gray-600 text-sm focus:border-purple-500/50 focus:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white transition-all text-sm flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:opacity-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Decrypt Control Console</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
