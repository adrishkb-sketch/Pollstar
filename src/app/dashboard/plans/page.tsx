'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, LogOut, Loader2, Check, Zap, Sparkles, Shield, BarChart3, HelpCircle 
} from 'lucide-react';

const FEATURES_INFO = [
  { key: 'singleChoice', label: 'Single Choice Voting', desc: 'Allow voters to pick one answer option.' },
  { key: 'bordaCount', label: 'Borda Count Ranked Choice', desc: 'Voters rank preferences; weight scores using Borda counts.' },
  { key: 'knockoutBracket', label: 'Knockout Tournament Bracket', desc: 'Run bracket tournament-style single/double elimination voting.' },
  { key: 'multipageSurveys', label: 'Multi-page Surveys', desc: 'Organize surveys across multiple pages with step progression.' },
  { key: 'sentimentAnalysis', label: 'Sentiment & Semantic Text Grouping', desc: 'Classify text responses into positive, neutral, and negative sentiment.' },
  { key: 'dropOffTracking', label: 'Abandonment & Drop-off Tracking', desc: 'Visualize where respondents stop filling out your survey sessions.' },
  { key: 'crossTabulation', label: 'Demographic Cross-Tabulation', desc: 'Filter response metrics against virtual demographic cohorts.' },
  { key: 'geolocations', label: 'Geolocation & Map Analytics', desc: 'Track geographic and ISP distribution heatmaps of cast ballots.' },
  { key: 'domainLocking', label: 'Domain and Email Lock Lists', desc: 'Limit ballot submissions to verified email domain matching lists.' },
  { key: 'otpVerification', label: 'Voter OTP Verification', desc: 'Enforce security verification using standard email OTP flow.' },
  { key: 'collaborations', label: 'Real-time Creator Collaboration', desc: 'Invite external co-creators to edit and monitor sessions.' },
  { key: 'inboxMessages', label: 'Voter Inbox Direct Messages', desc: 'Receive and reply to direct messages sent by session respondents.' },
  { key: 'dataExport', label: 'Data Export (CSV/JSON)', desc: 'Export full response registries and analytical breakdowns.' },
];

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setError('Failed to fetch plan metadata.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Syncing Plans & Billing...</span>
      </div>
    );
  }

  const currentPlan = user?.plan || { name: 'Free', price: 0.0, billingCycle: 'MONTHLY' };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#030712]">
      {/* Header */}
      <header className="w-full border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Vote className="w-6 h-6" />
              </div>
              <span className="font-outfit text-xl font-bold tracking-tight text-white">
                Poll<span className="text-indigo-400">star</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-400 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-400 hover:text-white"
              >
                My Profile
              </Link>
              <Link
                href="/dashboard/plans"
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-white bg-indigo-600/90 shadow"
              >
                Plans & Features
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white flex items-center justify-end gap-1.5">
                {user?.fullName || user?.email}
                {user?.isVerifiedUser && (
                  <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full" title="Verified Creator">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </span>
                )}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                {user?.role === 'ADMIN' ? '👑 SYSTEM ADMIN' : 'CREATOR'}
              </span>
            </div>
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:text-white transition-all"
              >
                Admin Control
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8 relative">
        <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <h2 className="font-outfit text-2xl font-bold text-white">Subscription & Plan Features</h2>
          <p className="text-gray-400 text-sm mt-0.5">Understand your feature levels and browse active service quotas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Active Plan Detail Box */}
          <div className="glass-card rounded-3xl p-6 border border-indigo-500/20 bg-indigo-500/5 flex flex-col justify-between relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                  Active Subscription
                </span>
              </div>
              <div>
                <h3 className="font-outfit text-2xl font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>{currentPlan.name} Plan</span>
                </h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {currentPlan.description || 'Our default subscription plan offering comprehensive dashboard features.'}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
              <div>
                <span className="text-[10px] text-gray-500 font-bold block uppercase">Subscription Price</span>
                <span className="font-outfit text-3xl font-black text-white">
                  ${currentPlan.price.toFixed(2)}
                  <span className="text-gray-500 text-xs font-semibold"> / {currentPlan.billingCycle.toLowerCase()}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/2 border border-white/5">
                <span className="text-gray-400">All features enabled</span>
                <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded uppercase">
                  UNLIMITED
                </span>
              </div>
            </div>
          </div>

          {/* Features Checklist Panel */}
          <div className="md:col-span-2 glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-outfit text-lg font-bold text-white">Feature Toggles Breakdown</h3>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {FEATURES_INFO.map((feat) => {
                // Determine whether user has this feature active
                const hasFeature = currentPlan.features ? !!(currentPlan.features as any)[feat.key] : true;

                return (
                  <div 
                    key={feat.key} 
                    className={`p-4 rounded-2xl border transition-all flex items-start space-x-4 ${
                      hasFeature 
                        ? 'bg-white/2 border-white/5 hover:border-white/10' 
                        : 'bg-white/1 border-dashed border-white/5 opacity-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      hasFeature 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                        : 'bg-gray-500/10 border border-gray-500/20 text-gray-500'
                    }`}>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{feat.label}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
