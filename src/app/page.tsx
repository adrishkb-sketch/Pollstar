'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Vote, Shield, BarChart3, Globe, Award, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setUser(data.user);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between relative">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Vote className="w-6 h-6 text-white" />
          </div>
          <span className="font-outfit text-2xl font-bold tracking-tight text-white">
            Poll<span className="text-indigo-400">star</span>
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-xl text-sm font-semibold glass-element text-indigo-300 hover:text-white border border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-all"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold gradient-btn text-white"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto py-12 md:py-20 z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Decisive Polls</span>
        </div>

        <h1 className="font-outfit text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-8">
          The Ultimate Platform for <br className="hidden sm:inline" />
          <span className="gradient-text">Interactive Elections & Polls</span>
        </h1>

        <p className="text-gray-400 text-base sm:text-xl max-w-3xl mb-12 leading-relaxed">
          Create highly secure, real-time, and mobile-friendly polls. Experience premium 
          glassmorphic analytical dashboards, Borda-count ranked choices, closed-voter SMTP verifications, 
          and dynamic map geolocation logs.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 w-full sm:w-auto">
          {loading ? (
            <div className="w-48 h-12 rounded-xl bg-white/5 animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard/create"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold gradient-btn text-white text-base shadow-xl flex items-center justify-center space-x-2"
            >
              <span>Create a Poll</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold gradient-btn text-white text-base shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold glass-card hover:bg-white/5 text-gray-300 hover:text-white text-base border border-white/10 flex items-center justify-center"
              >
                Create a Poll
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-fade-in-up">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-3">Military-Grade Fraud Shield</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Verify closed voters using one-time verification passwords (SMTP OTPs), block device duplicates (IPs), and prevent regional network manipulation (ISPs).
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-fade-in-up delay-100">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 mb-6">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-3">Live Socket.io Charts</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Watch votes flow instantly. Renders beautiful responsive Recharts pie charts, trend graphs, and Borda point distribution stats.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-fade-in-up delay-200">
            <div className="p-4 bg-pink-500/10 rounded-2xl border border-pink-500/20 text-pink-400 mb-6">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-3">Dynamic Geolocation Map</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Geo-plot voter coordinates onto an interactive Leaflet map. Flag suspicious devices and ISP distributions visually in real-time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-gray-500 text-sm z-10">
        <span>© 2026 Pollstar. Built with Advanced Agentic Coding tools.</span>
        <div className="flex space-x-6 mt-4 sm:mt-0">
          <Link href="/admin" className="hover:text-indigo-400 transition-colors">
            Portal Control (/admin)
          </Link>
          <span className="hover:text-gray-300 transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-gray-300 transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
