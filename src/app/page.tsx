'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Vote, Shield, BarChart3, Globe, Award, Sparkles, ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import Footer from '@/components/Footer';
import AdvertisementZone from '@/components/AdvertisementZone';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heroTitle, setHeroTitle] = useState('The Ultimate Platform for Interactive Elections & Polls');
  const [heroSubtitle, setHeroSubtitle] = useState('Create highly secure, real-time, and mobile-friendly polls. See live result charts, track voter groups, count ranked choices, and view voter maps instantly.');

  useEffect(() => {
    // Fetch user info
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setUser(data.user);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));

    // Fetch site configs
    fetch('/api/admin/site-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.configs) {
          const title = data.configs.find((c: any) => c.key === 'landing_hero_title')?.value;
          const subtitle = data.configs.find((c: any) => c.key === 'landing_hero_subtitle')?.value;
          if (title) setHeroTitle(title);
          if (subtitle) setHeroSubtitle(subtitle);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between relative">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link href="/">
          <BrandLogo iconSize={22} textSize="text-2xl" />
        </Link>
        <div id="auth-buttons" className="flex items-center space-x-4">
          {loading ? (
            <div className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-xl text-sm font-semibold glass-element text-emerald-300 hover:text-white border border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center flex-nowrap space-x-1.5 sm:space-x-4 shrink-0">
              <Link
                href="/login"
                style={{ whiteSpace: 'nowrap' }}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all whitespace-nowrap shrink-0"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                style={{ whiteSpace: 'nowrap' }}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold gradient-btn text-white whitespace-nowrap shrink-0"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main id="hero-section" className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto py-12 md:py-20 z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Decisive Polls</span>
        </div>

        <h1 id="hero-title" className="font-outfit text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-8">
          {heroTitle}
        </h1>

        <p className="text-gray-400 text-base sm:text-xl max-w-3xl mb-12 leading-relaxed">
          {heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 w-full sm:w-auto">
          {loading ? (
            <div className="w-48 h-12 rounded-xl bg-white/5 animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard/create"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold gradient-btn text-white text-base shadow-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span>Create a Poll</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold gradient-btn text-white text-base shadow-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold glass-card hover:bg-white/5 text-gray-300 hover:text-white text-base border border-white/10 flex items-center justify-center transition-all transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Create a Poll
              </Link>
            </>
          )}
        </div>
        <Link href="/features" className="mt-6 inline-block px-6 py-3 rounded-xl font-semibold gradient-btn text-white text-sm">Explore All Features</Link>

        {/* Feature Grid */}
        <div id="features-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-fade-in-up">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-3">Secure Voter Protection</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Verify voters with secure one-time codes, block duplicate votes from the same device, and prevent location spoofing.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-fade-in-up delay-100">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 mb-6">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-3">Live Results Feed</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Watch votes roll in live. See results update instantly in clean, easy-to-read charts and tables.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-fade-in-up delay-200">
            <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400 mb-6">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-3">Live Geolocation Map</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              See where votes are coming from on a live map, and instantly flag suspicious double-voting patterns.
            </p>
          </div>
        </div>
      </main>

      <AdvertisementZone />
      <Footer />

    </div>
  );
}
