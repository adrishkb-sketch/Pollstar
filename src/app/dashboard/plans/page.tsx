'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, LogOut, Loader2, Check, Zap, Sparkles, Shield, BarChart3, HelpCircle 
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';

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
  { key: 'creatorScribbleCanvas', label: 'Creator Brain Scribble Board', desc: 'Floating scribble canvas and markdown flow planner to map page branching rules.' },
  { key: 'studentWhiteboardQuestion', label: 'Student Whiteboard Drawing', desc: 'Let exam-takers sketch answers to questions on an interactive canvas.' },
  { key: 'inbuiltScientificCalculator', label: 'Inbuilt Scientific Calculator', desc: 'Draggable scientific calculator featuring Trig and log functions during exams.' },
  { key: 'saveResumeLater', label: 'Save & Resume Later (Survey/Exam)', desc: 'Allow respondents to pause their session and resume securely on return.' },
  { key: 'customBrandingThemes', label: 'Premium Branding & 5 Rich Themes', desc: 'Replace branding with custom logos and swap between Sunset, Jade, and Ocean glass themes.' }
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
      <DashboardHeader user={user} />

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
