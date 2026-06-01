'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Sparkles, 
  Loader2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Lock,
  AlertCircle
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { formatBillingCycle } from '@/lib/planExpiry';

const getCurrencySymbol = (currencyCode?: string) => {
  if (currencyCode === 'EUR') return '€';
  if (currencyCode === 'GBP') return '£';
  return '₹'; // Default to INR
};

export default function PublicPlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [addonPlans, setAddonPlans] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'SUBSCRIPTION' | 'ADDON'>('SUBSCRIPTION');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDurs, setSelectedDurs] = useState<Record<string, string>>({});

  // Mobile Swipe ref
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success) {
            setUser(meData.user);
          }
        }

        const plansRes = await fetch('/api/plans');
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const rawPlans = plansData.plans || [];
          const rawAddons = plansData.addonPlans || [];
          
          // Sort plans by rank
          const sortedPlans = [...rawPlans].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
          setPlans(sortedPlans);
          setAddonPlans(rawAddons.sort((a: any, b: any) => (a.addonRank ?? 0) - (b.addonRank ?? 0)));
        }
      } catch (err) {
        setError('Failed to fetch platform pricing data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Syncing active plan quotas...</span>
      </div>
    );
  }

  const currentPlan = user?.plan || { id: '', name: 'Free', price: 0.0, billingCycle: 'MONTHLY' };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col font-outfit">
      {/* Header */}
      <header className="border-b border-white/5 py-5 px-6 bg-[#030712]/50 backdrop-blur z-20 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <BrandLogo iconSize={20} textSize="text-xl" />
          </Link>
          <div className="flex gap-4">
            {user ? (
              <Link 
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all border border-purple-400/20 active:scale-95"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-all">Sign In</Link>
                <Link href="/signup" className="gradient-btn px-4 py-2 rounded-xl text-xs font-bold text-white transition-all">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-16 flex-1 relative w-full">
        {/* Glow glow background */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-extrabold uppercase tracking-widest">
            Simple Pricing, Infinite Features
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Plans Engineered For <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Every Scale</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            From classroom quizzes to nationwide polling and multi-page surveys. Explore all features engineered to maximize response fidelity.
          </p>
          
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-300 max-w-xl mx-auto leading-relaxed shadow-lg shadow-indigo-500/5 animate-fade-in-up">
            💡 <strong>Paid Plan Guarantee:</strong> Subscribing to <strong>any</strong> paid subscription plan instantly unlocks <strong>100% of all premium features</strong> (including live webcam proctoring, conditional branching logic, custom branding, and scientific calculator). The free plan has some feature restrictions, but any plan upgrade removes them entirely!
          </div>
        </div>

        {/* Category Toggles */}
        <div className="flex justify-center pt-2">
          <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex items-center space-x-1 shrink-0 overflow-x-auto">
            {[
              { key: 'SUBSCRIPTION', label: '⚡ Electoral Subscriptions' },
              { key: 'ADDON', label: '🚀 Audience Add-Ons' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="glass-card border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Dynamic sliding cards system */}
        <div className="relative space-y-4">
          <div className="flex justify-between items-center md:hidden">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold">Slide to view Plans</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleScrollLeft}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-gray-400 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-gray-400 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards container: horizontal scroll snap on mobile, grids on desktop */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 scroll-smooth scrollbar-none pb-4 md:overflow-x-visible md:snap-none md:flex-row md:grid md:grid-cols-3 justify-center"
          >
            {activeCategory === 'SUBSCRIPTION' && plans.map((p) => {
              const isActivePlan = user?.plan?.id === p.id || (p.name === 'Free' && !user?.plan?.id);
              
              return (
                <div 
                  key={p.id}
                  className={`snap-center shrink-0 w-[300px] md:w-auto glass-card rounded-3xl p-6 border flex flex-col justify-between relative overflow-hidden transition-all duration-300 bg-white/[0.01] ${
                    isActivePlan 
                      ? 'border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)] bg-gradient-to-b from-purple-950/10 to-transparent' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Decorative glowing gradient blur */}
                  {isActivePlan && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                  )}

                  <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 justify-between items-center mb-1 w-full">
                        <span 
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider block shrink-0"
                          style={{ color: p.badgeColor, backgroundColor: `${p.badgeColor}15`, border: `1px solid ${p.badgeColor}30` }}
                        >
                          {p.badgeLabel || p.name}
                        </span>
                        {isActivePlan && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider block shrink-0 animate-pulse">
                            Current Plan ({formatBillingCycle(user?.planBillingCycle || 'LIFETIME')})
                          </span>
                        )}
                        {p.hasFreeTrial && !isActivePlan && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider block shrink-0 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                            {p.freeTrialDays || 7} Days Trial
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-extrabold text-white font-outfit">{p.name}</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed min-h-[48px]">{p.description}</p>
                    </div>

                    {/* Durations Segment Toggles if configured */}
                    {(() => {
                      const dursConfig = p.durations ? (p.durations as any) : null;
                      const enabledDurs = dursConfig 
                        ? Object.keys(dursConfig).filter((k: string) => dursConfig[k]?.enabled)
                        : [];
                      
                      if (enabledDurs.length <= 1) return null;

                      const activeDur = selectedDurs[p.id] || enabledDurs[0] || 'MONTHLY';

                      return (
                        <div className="p-1 bg-white/2 border border-white/5 rounded-xl flex flex-wrap gap-1">
                          {enabledDurs.map((dur) => {
                            const cfg = dursConfig[dur];
                            const isSelected = activeDur === dur;
                            let discountText = '';
                            if (dur !== 'MONTHLY' && dursConfig['MONTHLY']?.enabled) {
                              const mPrice = parseFloat(dursConfig['MONTHLY'].price || '0');
                              const dPrice = parseFloat(cfg.price || '0');
                              let factor = 1;
                              if (dur === 'QUARTERLY') factor = 3;
                              else if (dur === 'YEARLY') factor = 12;
                              else if (dur === 'TWO_YEARS') factor = 24;
                              if (mPrice > 0) {
                                const fullCost = mPrice * factor;
                                const savings = ((fullCost - dPrice) / fullCost) * 100;
                                if (savings > 0) discountText = `Save ${Math.round(savings)}%`;
                              }
                            }
                            return (
                              <button
                                type="button"
                                key={dur}
                                onClick={() => setSelectedDurs(prev => ({ ...prev, [p.id]: dur }))}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[8px] font-bold uppercase transition-all flex flex-col items-center justify-center ${
                                  isSelected 
                                    ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' 
                                    : 'bg-transparent border border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                              >
                                <span>{dur.replace('_', ' ')}</span>
                                {discountText && <span className="text-[7px] text-emerald-400 font-extrabold">{discountText}</span>}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {(() => {
                      const dursConfig = p.durations ? (p.durations as any) : null;
                      const enabledDurs = dursConfig 
                        ? Object.keys(dursConfig).filter((k: string) => dursConfig[k]?.enabled)
                        : [];
                      
                      const activeDur = selectedDurs[p.id] || enabledDurs[0] || 'MONTHLY';
                      const durConfig = dursConfig?.[activeDur] || null;
                      
                      let displayPrice = p.price;
                      let displayOriginalPrice = p.originalPrice;
                      let cycleName = p.billingCycle.toLowerCase();
                      let offerEndDate = p.offerEndDate;

                      if (enabledDurs.length > 0 && durConfig) {
                        displayPrice = parseFloat(durConfig.price || '0');
                        displayOriginalPrice = parseFloat(durConfig.originalPrice || '0');
                        cycleName = activeDur.toLowerCase();
                        offerEndDate = durConfig.offerEndDate || null;
                      }

                      const hasSlashPrice = displayOriginalPrice && displayOriginalPrice > displayPrice;
                      
                      // Classification
                      let offerType = 'NORMAL';
                      let offerLabel = '';
                      if (displayPrice === 0 && displayOriginalPrice === 0) {
                        offerType = 'FREE_PLAN';
                        offerLabel = 'General Free Plan';
                      } else if (displayPrice === 0 && displayOriginalPrice > 0) {
                        offerType = 'FREE_OFFER';
                        offerLabel = 'FREE Offer!';
                      } else if (displayOriginalPrice > displayPrice && displayPrice > 0 && displayOriginalPrice > 0) {
                        offerType = 'OFFER';
                        offerLabel = 'Offer';
                      }

                      return (
                        <div className="space-y-4">
                          {/* Active Offer Banner */}
                          {offerLabel && (
                            <div className={`p-2.5 rounded-xl text-[10px] font-bold flex items-center justify-between gap-2 border ${
                              offerType === 'FREE_PLAN' 
                                ? 'bg-white/2 border-white/5 text-gray-400' 
                                : offerType === 'FREE_OFFER'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse-glow'
                                  : 'bg-purple-500/10 border-purple-500/20 text-purple-300 animate-pulse-glow'
                            }`}>
                              <span className="flex items-center gap-1">⚡ {offerLabel}</span>
                              {offerEndDate && (
                                <span className="font-mono text-[9px]">Ends: {new Date(offerEndDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}

                          {/* Price Tag */}
                          <div className="border-t border-b border-white/5 py-4 space-y-1">
                            <span className="text-[9px] text-gray-500 font-bold uppercase block">Subscription Price</span>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-3xl font-black text-white font-outfit">
                                {offerType === 'FREE_PLAN' ? (
                                  <span className="text-gray-400">General Free Plan</span>
                                ) : offerType === 'FREE_OFFER' ? (
                                  <span className="text-emerald-400">FREE Offer!</span>
                                ) : (
                                  `${getCurrencySymbol(p.currency)}${displayPrice.toFixed(2)}`
                                )}
                              </span>
                              {hasSlashPrice && (
                                <span className="text-sm text-red-400/70 font-semibold line-through">
                                  {getCurrencySymbol(p.currency)}{displayOriginalPrice.toFixed(2)}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 font-semibold">/{cycleName.replace('_', ' ')}</span>
                            </div>
                            
                            {/* Validity date below the price - beautiful premium glow layout */}
                            {offerEndDate && (
                              <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-red-500/10 via-amber-500/5 to-purple-500/10 border border-red-500/20 text-[10px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-300 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.05)] animate-pulse shrink-0">
                                <span>⏳</span>
                                <span className="text-gray-300 font-bold">Redeem Offer before:</span>
                                <span className="text-amber-400 font-mono tracking-wider font-extrabold">{new Date(offerEndDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quota Details */}
                    {(() => {
                      const dursConfig = p.durations ? (p.durations as any) : null;
                      const enabledDurs = dursConfig 
                        ? Object.keys(dursConfig).filter((k: string) => dursConfig[k]?.enabled)
                        : [];
                      
                      const activeDur = selectedDurs[p.id] || enabledDurs[0] || 'MONTHLY';
                      const durConfig = dursConfig?.[activeDur] || null;

                      let maxPollsVal = durConfig?.maxPolls !== undefined && durConfig.maxPolls !== '' ? parseInt(durConfig.maxPolls) : (p.maxPolls !== null && p.maxPolls !== undefined ? p.maxPolls : -1);
                      let maxSurveysVal = durConfig?.maxSurveys !== undefined && durConfig.maxSurveys !== '' ? parseInt(durConfig.maxSurveys) : (p.maxSurveys !== null && p.maxSurveys !== undefined ? p.maxSurveys : -1);
                      let maxExamsVal = durConfig?.maxExams !== undefined && durConfig.maxExams !== '' ? parseInt(durConfig.maxExams) : (p.maxExams !== null && p.maxExams !== undefined ? p.maxExams : -1);
                      let maxPartPoll = durConfig?.maxParticipantsPoll !== undefined && durConfig.maxParticipantsPoll !== '' ? parseInt(durConfig.maxParticipantsPoll) : (p.maxParticipantsPoll ?? null);
                      let maxPartSurvey = durConfig?.maxParticipantsSurvey !== undefined && durConfig.maxParticipantsSurvey !== '' ? parseInt(durConfig.maxParticipantsSurvey) : (p.maxParticipantsSurvey ?? null);
                      let maxPartExam = durConfig?.maxParticipantsExam !== undefined && durConfig.maxParticipantsExam !== '' ? parseInt(durConfig.maxParticipantsExam) : (p.maxParticipantsExam ?? null);

                      const fmt = (v: number | null) => v === null || v === -1 ? 'Unlimited' : v.toLocaleString();

                      return (
                        <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] text-gray-400 space-y-1.5 font-outfit">
                          <div className="text-[8px] font-extrabold uppercase tracking-widest text-gray-600 mb-2">Per-Cycle Creation Limits</div>
                          <div className="flex items-center justify-between">
                            <span>🗳 Polls per cycle:</span>
                            <strong className="text-white font-bold">{fmt(maxPollsVal)}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>📋 Surveys per cycle:</span>
                            <strong className="text-white font-bold">{fmt(maxSurveysVal)}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>📝 Exams per cycle:</span>
                            <strong className="text-white font-bold">{fmt(maxExamsVal)}</strong>
                          </div>
                          {(maxPartPoll || maxPartSurvey || maxPartExam) && (
                            <>
                              <div className="border-t border-white/5 pt-1.5 mt-1">
                                <div className="text-[8px] font-extrabold uppercase tracking-widest text-gray-600 mb-2">Max Participants per Session</div>
                                {maxPartPoll && <div className="flex items-center justify-between"><span>🗳 Per Poll:</span><strong className="text-indigo-300 font-bold">{fmt(maxPartPoll)}</strong></div>}
                                {maxPartSurvey && <div className="flex items-center justify-between"><span>📋 Per Survey:</span><strong className="text-violet-300 font-bold">{fmt(maxPartSurvey)}</strong></div>}
                                {maxPartExam && <div className="flex items-center justify-between"><span>📝 Per Exam:</span><strong className="text-cyan-300 font-bold">{fmt(maxPartExam)}</strong></div>}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {/* Features checklist summary */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">What's Included</span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          '✅ All Poll features & analytics',
                          '✅ All Survey features & analytics',
                          '✅ All Exam & Gradebook features',
                          '✅ All Platform & anti-fraud features',
                          '✅ OTP verification & closed voter lists',
                          '✅ Custom branding & premium themes',
                          '✅ Real-time collaboration',
                          '✅ API & Webhooks access',
                          '✅ AI projections, sentiment & proctoring',
                          '✅ Export & embed widget options',
                        ].map((item, i) => (
                          <div key={i} className="text-[10px] text-gray-300 font-semibold flex items-center gap-1.5 py-0.5">
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions CTA upgraded to Checkout / Login redirect */}
                  <div className="pt-6 mt-6 border-t border-white/5">
                    {(() => {
                      const dursConfig = p.durations ? (p.durations as any) : null;
                      const enabledDurs = dursConfig 
                        ? Object.keys(dursConfig).filter((k: string) => dursConfig[k]?.enabled)
                        : [];
                      const activeDur = selectedDurs[p.id] || enabledDurs[0] || 'MONTHLY';
                      const durConfig = dursConfig?.[activeDur] || null;
                      
                      let displayPrice = p.price;
                      if (enabledDurs.length > 0 && durConfig) {
                        displayPrice = parseFloat(durConfig.price || '0');
                      }

                      const checkoutUrl = p.hasFreeTrial 
                        ? `/checkout?planId=${p.id}&trial=true` 
                        : `/checkout?planId=${p.id}&duration=${activeDur}`;
                      
                      const loginUrl = `/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`;

                      if (!user) {
                        return (
                          <Link
                            href={loginUrl}
                            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                          >
                            {p.hasFreeTrial 
                              ? `Start ${p.freeTrialDays || 7}-Day Free Trial` 
                              : (displayPrice > 0 ? 'Get Started Now' : 'Activate Free Tier')}
                          </Link>
                        );
                      }

                      const userPlanIsFree = !user?.plan || user.plan.name.toLowerCase() === 'free';
                      const now = new Date();
                      const planExpired = user?.planExpiresAt && new Date(user.planExpiresAt) < now && !user?.isLifetimePlan;
                      const planActive = isActivePlan && !planExpired;

                      const isInferior = user?.plan && !userPlanIsFree && (
                        p.name.toLowerCase() === 'free' ||
                        (p.rank ?? 0) <= (user.plan.rank ?? 0)
                      ) && p.id !== user.plan.id;

                      // Active non-expired plan: just show status
                      if (planActive) {
                        if (p.isFree || p.name === 'Free') {
                          return (
                            <button
                              type="button"
                              disabled
                              className="w-full py-3 rounded-xl font-bold bg-white/5 text-gray-400 text-xs border border-white/5 cursor-not-allowed text-center"
                            >
                              ✅ Current Free Plan
                            </button>
                          );
                        } else {
                          return (
                            <div className="space-y-2">
                              <button
                                type="button"
                                disabled
                                className="w-full py-3 rounded-xl font-bold bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20 cursor-default text-center"
                              >
                                ✅ Active {formatBillingCycle(user?.planBillingCycle || 'MONTHLY')} Subscription
                              </button>
                              {user?.planExpiresAt && !user?.isLifetimePlan && (
                                <p className="text-[9px] text-gray-600 text-center">
                                  Renews: <strong className="text-gray-400">{new Date(user.planExpiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                </p>
                              )}
                            </div>
                          );
                        }
                      }

                      // Expired plan: show renew button
                      if (planExpired && isActivePlan) {
                        return (
                          <div className="space-y-2">
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-bold text-center">
                              ⚠️ Plan expired — you&apos;re on the Free tier until renewed
                            </div>
                            <Link
                              href={checkoutUrl}
                              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs border border-amber-500/20 shadow-lg active:scale-95 transition-all text-center block"
                            >
                              🔄 Renew {formatBillingCycle(user?.planBillingCycle || 'MONTHLY')} Subscription
                            </Link>
                          </div>
                        );
                      }

                      if (isInferior) {
                        return (
                          <button
                            type="button"
                            disabled
                            className="w-full py-3 rounded-xl font-bold bg-white/5 text-gray-500 text-xs border border-white/5 cursor-not-allowed text-center"
                          >
                            Downgrade Unavailable
                          </button>
                        );
                      }

                      return (
                        <Link
                          href={checkoutUrl}
                          className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                        >
                          {p.hasFreeTrial 
                            ? `Start ${p.freeTrialDays || 7}-Day Free Trial` 
                            : (displayPrice > 0 ? `Upgrade (${formatBillingCycle(activeDur)})` : 'Activate Free Tier')}
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              );
            })}

            {activeCategory === 'ADDON' && addonPlans.map((p) => {
              const now = new Date();
              const userCurrentAddonRank: number = user?.activeAddonRank ?? 0;
              const isAddonInferior = (p.addonRank ?? 0) <= userCurrentAddonRank && userCurrentAddonRank > 0;
              const hasActiveSub = user?.planId && user?.plan?.name?.toLowerCase() !== 'free' &&
                (user?.isLifetimePlan || (user?.planExpiresAt && new Date(user.planExpiresAt) > now));

              const checkoutUrl = `/checkout?planId=${p.id}&isAddon=true`;
              const loginUrl = `/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`;

              return (
                <div 
                  key={p.id}
                  className="snap-center shrink-0 w-[300px] md:w-auto glass-card rounded-3xl p-6 border border-white/5 hover:border-white/10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 bg-white/[0.01]"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 justify-between items-center mb-1 w-full">
                        <span 
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider block shrink-0"
                          style={{ color: p.badgeColor, backgroundColor: `${p.badgeColor}15`, border: `1px solid ${p.badgeColor}30` }}
                        >
                          Advanced Add-On
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-white font-outfit">{p.name}</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed min-h-[48px]">{p.description}</p>
                    </div>

                    <div className="border-t border-b border-white/5 py-4 space-y-1">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Add-On Base Price</span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {p.price === 0 && p.originalPrice && p.originalPrice > 0 ? (
                          <span className="text-2xl font-black text-emerald-400 font-outfit">FREE Offer!</span>
                        ) : (
                          <span className="text-3xl font-black text-white font-outfit">
                            {getCurrencySymbol(p.currency)}{p.price.toFixed(2)}
                          </span>
                        )}
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-sm text-red-400/70 font-semibold line-through">
                            {getCurrencySymbol(p.currency)}{p.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {p.offerEndDate && new Date(p.offerEndDate) > new Date() && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 flex items-center gap-1">
                          <span>⏳</span>
                          <span>Offer ends: {new Date(p.offerEndDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[8px] text-gray-500 font-bold uppercase block">Pre-Requisite</span>
                      <div className="text-[10px] text-purple-300 font-semibold bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl leading-relaxed">
                        ⚠️ **Requires active subscription**: This package functions as an overlay and can only be active alongside a running paid subscription.
                      </div>
                    </div>

                    {/* Participant Boost Display for Add-Ons */}
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] text-gray-400 space-y-1.5 font-outfit">
                      <div className="text-[8px] font-extrabold uppercase tracking-widest text-gray-600 mb-2">Audience Boost (Additive)</div>
                      <div className="flex items-center justify-between">
                        <span>🗳 Voters per Poll:</span>
                        <strong className="text-indigo-300 font-bold">+{p.maxParticipantsPoll === null || p.maxParticipantsPoll === -1 ? 'Unlimited' : p.maxParticipantsPoll?.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>📋 Respondents per Survey:</span>
                        <strong className="text-violet-300 font-bold">+{p.maxParticipantsSurvey === null || p.maxParticipantsSurvey === -1 ? 'Unlimited' : p.maxParticipantsSurvey?.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>📝 Examinees per Exam:</span>
                        <strong className="text-cyan-300 font-bold">+{p.maxParticipantsExam === null || p.maxParticipantsExam === -1 ? 'Unlimited' : p.maxParticipantsExam?.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5">
                    {!user ? (
                      <Link
                        href={loginUrl}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                      >
                        Get Started Now
                      </Link>
                    ) : !hasActiveSub ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled
                          className="w-full py-3 rounded-xl font-bold bg-white/5 text-amber-500/60 text-xs border border-amber-500/20 cursor-not-allowed text-center"
                        >
                          🔒 Requires Active Subscription First
                        </button>
                        <p className="text-[9px] text-gray-600 text-center">
                          Subscribe to a paid tier to unlock audience add-ons.
                        </p>
                      </div>
                    ) : isAddonInferior ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 rounded-xl font-bold bg-white/5 text-gray-500 text-xs border border-white/5 cursor-not-allowed text-center"
                      >
                        Downgrade Unavailable
                      </button>
                    ) : (
                      <Link
                        href={checkoutUrl}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                      >
                        Upgrade Audience Add-On
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
