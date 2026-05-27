import Link from 'next/link';
import { Shield, BarChart3, Globe, Sparkles, ArrowRight, Zap, Gift, TrendingUp, Trophy, ArrowRightCircle } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-emerald-400" />, // military grade shield
      title: 'Military‑Grade Fraud Shield',
      description: 'One‑time SMTP OTP verification, device fingerprinting, IP blocking and ISP detection ensure closed‑voter integrity.',
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />, // live charts
      title: 'Live Socket.io Charts',
      description: 'Instant real‑time vote flow visualised with Recharts – pie charts, trend lines and Borda‑point distributions.',
    },
    {
      icon: <Globe className="w-8 h-8 text-cyan-400" />, // dynamic map
      title: 'Dynamic Geolocation Map',
      description: 'Leaflet map plots voter coordinates live, highlighting suspicious devices and ISP clusters.',
    },
    {
      icon: <Zap className="w-8 h-8 text-amber-400" />, // live ticker
      title: 'Live Ticker (Dashboard)',
      description: 'Wall‑Street style ticker flashes green/red percentage gains as votes surge, visible when enabled.',
    },
    {
      icon: <Gift className="w-8 h-8 text-pink-400" />, // fomo popups
      title: 'FOMO & Social Proof Popups',
      description: 'Non‑intrusive toasts (e.g., "5 people are voting now!") create urgency and engagement.',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-orange-400" />, // hot streaks
      title: 'Hot‑Streak Momentum Indicators',
      description: 'Options that receive a rapid vote surge glow with a flame icon and neon orange pulse.',
    },
    {
      icon: <Trophy className="w-8 h-8 text-amber-400" />, // drag‑and‑drop podium
      title: 'Interactive Drag‑and‑Drop Podium (Ranked)',
      description: 'Beautiful spring‑animated 1st‑2nd‑3rd podium for ranked‑choice polls when enabled.',
    },
    {
      icon: <ArrowRightCircle className="w-8 h-8 text-emerald-400" />, // smart debrief
      title: 'Smart Debrief (Post‑Poll)',
      description: 'Analytical commentary displayed on the completion screen – no mention of AI.',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-emerald-300" />, // leaderboard visibility
      title: 'Leaderboard Visibility',
      description: 'Creator can choose Hidden, Shown After Vote, or Live (always visible) – kept separate from reports.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-4 min-h-screen">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 gradient-text">Pollstar – Feature Showcase</h1>
        <p className="text-center text-gray-300 mb-12 max-w-3xl mx-auto">
          Explore every premium capability we ship out‑of‑the‑box. All features are toggle‑able from the Creator Dashboard under “Beast Mode Configurations”.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
              <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
                {f.icon}
              </div>
              <h3 className="font-outfit text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/" className="inline-block px-6 py-3 rounded-xl font-semibold gradient-btn text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
