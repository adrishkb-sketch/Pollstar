'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Sparkles, 
  Loader2, 
  Check, 
  ArrowRight, 
  ShieldCheck,
  Lock,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import Footer from '@/components/Footer';

const FEATURES_INFO = [
  { key: 'openPublicPolls', label: 'Open Public Polls' },
  { key: 'realTimeLiveResults', label: 'Real-Time Live Results' },
  { key: 'liveGeolocationMap', label: 'Live Geolocation Map' },
  { key: 'rankedChoiceBordaCount', label: 'Ranked Choice / Borda Count' },
  { key: 'quadraticVoting', label: 'Quadratic Voting' },
  { key: 'singleChoiceMultiSelect', label: 'Single Choice / Multi-Select' },
  { key: 'sentimentReactions', label: 'Sentiment Reactions' },
  { key: 'timedExams', label: 'Timed Exams' },
  { key: 'fullScreenLockdown', label: 'Full-Screen Lockdown' },
  { key: 'tabSwitchDetection', label: 'Tab-Switch Detection' },
  { key: 'copyPastePrevention', label: 'Copy-Paste Prevention' },
  { key: 'autoGradingEngine', label: 'Auto-Grading Engine' },
  { key: 'conditionalLogicBranching', label: 'Conditional Logic Branching' },
  { key: 'collaborations', label: 'Real-time Creator Collaboration' },
  { key: 'customBranding', label: 'Custom Logo Branding' }
];

const getCurrencySymbol = (currencyCode?: string) => {
  if (currencyCode === 'EUR') return '€';
  if (currencyCode === 'GBP') return '£';
  return '₹'; // Default to INR
};

const getHasFeature = (features: any, key: string): boolean => {
  if (!features) return false;
  if (features[key] === true) return true;
  return false;
};

export default function PublicPricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [entityPlans, setEntityPlans] = useState<any[]>([]);
  const [addonPlans, setAddonPlans] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'SUBSCRIPTION' | 'ENTITY' | 'ADDON'>('SUBSCRIPTION');
  const [loading, setLoading] = useState(true);

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
          const rawEntity = plansData.entityPlans || [];

          // Sort so Free is leftmost, then price ascending
          const sortedPlans = [...rawPlans].sort((a, b) => {
            const aFree = a.isFree || a.name === 'Free';
            const bFree = b.isFree || b.name === 'Free';
            if (aFree && !bFree) return -1;
            if (!aFree && bFree) return 1;
            return a.price - b.price;
          });

          setPlans(sortedPlans);
          setAddonPlans(rawAddons);
          setEntityPlans(rawEntity);
        }
      } catch (err) {
        console.error('Failed to load pricing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Loading pricing details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col relative overflow-hidden font-outfit">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Nav */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20 relative">
        <Link href="/">
          <BrandLogo iconSize={24} textSize="text-2xl" />
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all border border-purple-400/20 active:scale-95"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link 
                href="/register"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 active:scale-95"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Pricing Intro */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16 flex-1 z-10 relative w-full">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-bold text-purple-300 tracking-wider uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Capabilities</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Flexible Plans for <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Every Audience Scale</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Choose standard Electoral Subscriptions, pay-as-you-go Entity Packs, or powerful Add-On upgrades. Clean transparent pricing with robust audit logging.
          </p>
        </div>

        {/* Categories Selector */}
        <div className="flex justify-center">
          <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex items-center space-x-1 shrink-0">
            {[
              { key: 'SUBSCRIPTION', label: 'Electoral Subscriptions' },
              { key: 'ENTITY', label: 'Individual Entity Packs' },
              { key: 'ADDON', label: 'Premium Add-Ons' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeCategory === 'SUBSCRIPTION' && plans.map((p) => {
            return (
              <div 
                key={p.id}
                className="glass-card rounded-3xl p-6 border border-white/5 hover:border-white/10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 bg-white/[0.01]"
              >
                <div className="space-y-6">
                  {/* Badge */}
                  <div>
                    <span 
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider block w-fit"
                      style={{ color: p.badgeColor, backgroundColor: `${p.badgeColor}15`, border: `1px solid ${p.badgeColor}30` }}
                    >
                      {p.badgeLabel || p.name}
                    </span>
                    <h3 className="text-xl font-extrabold text-white font-outfit mt-3">{p.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed min-h-[48px] mt-1.5">{p.description}</p>
                  </div>

                  {/* Price */}
                  <div className="border-t border-b border-white/5 py-4">
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Price starting at</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white">
                        {p.isFree || p.price === 0 ? 'FREE' : `${getCurrencySymbol(p.currency)}${p.price.toFixed(2)}`}
                      </span>
                      {!(p.isFree || p.price === 0) && (
                        <span className="text-xs text-gray-500 font-semibold">/ {p.billingCycle.toLowerCase()}</span>
                      )}
                    </div>
                  </div>

                  {/* Quotas Box */}
                  <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] text-gray-400 space-y-1.5 font-outfit">
                    <div className="flex items-center justify-between">
                      <span>Max Polls Allowed:</span>
                      <strong className="text-white font-bold">{p.maxPolls === null || p.maxPolls === -1 ? 'Unlimited' : p.maxPolls}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Surveys Allowed:</span>
                      <strong className="text-white font-bold">{p.maxSurveys === null || p.maxSurveys === -1 ? 'Unlimited' : p.maxSurveys}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Exams Allowed:</span>
                      <strong className="text-white font-bold">{p.maxExams === null || p.maxExams === -1 ? 'Unlimited' : p.maxExams}</strong>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Features Checklist</span>
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {FEATURES_INFO.map((feat) => {
                        const hasFeature = getHasFeature(p.features, feat.key);
                        return (
                          <div key={feat.key} className="flex items-start gap-2 text-[10px] leading-relaxed">
                            {hasFeature ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                            )}
                            <span className={hasFeature ? 'text-gray-300 font-semibold' : 'text-gray-600 line-through'}>
                              {feat.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <Link
                    href={user ? '/dashboard/plans' : '/login'}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                  >
                    {user ? 'View Active Purchase options' : 'Get Started Now'}
                  </Link>
                </div>
              </div>
            );
          })}

          {activeCategory === 'ENTITY' && entityPlans.map((p) => {
            return (
              <div 
                key={p.id}
                className="glass-card rounded-3xl p-6 border border-white/5 hover:border-white/10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 bg-white/[0.01]"
              >
                <div className="space-y-6">
                  <div>
                    <span 
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider block w-fit"
                      style={{ color: p.badgeColor, backgroundColor: `${p.badgeColor}15`, border: `1px solid ${p.badgeColor}30` }}
                    >
                      {p.badgeLabel || p.planType.replace('_', ' ')}
                    </span>
                    <h3 className="text-xl font-extrabold text-white font-outfit mt-3">{p.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed min-h-[48px] mt-1.5">{p.description}</p>
                  </div>

                  <div className="border-t border-b border-white/5 py-4">
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">One-Off Price</span>
                    <span className="text-3xl font-black text-white">
                      {getCurrencySymbol(p.currency)}{p.price.toFixed(2)}
                    </span>
                  </div>

                  {p.validityValue && p.validityUnit && (
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold text-indigo-300 flex items-center gap-1.5 shrink-0 font-outfit">
                      <span>⏳</span>
                      <span>Validity: {p.validityValue} {p.validityUnit.toLowerCase()}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[8px] text-gray-500 font-bold uppercase block">Inclusions</span>
                    <div className="text-[10px] text-gray-300 font-semibold flex items-center gap-1.5 bg-white/2 border border-white/5 p-3 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {p.planType === 'POLL_PACK' && `Adds ${p.packQuantity} Premium Poll creation credits`}
                        {p.planType === 'SURVEY_PACK' && `Adds ${p.packQuantity} Premium Survey creation credits`}
                        {p.planType === 'EXAM_PACK' && `Adds ${p.packQuantity} Premium Exam creation credits`}
                        {p.planType === 'COMBO_PACK' && `Adds ${p.packQuantity} Combo entity creation credits`}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] text-gray-400 space-y-1.5 font-outfit">
                    <div className="flex items-center justify-between">
                      <span>Max Polls Allowed:</span>
                      <strong className="text-white font-bold">{p.maxPolls === null || p.maxPolls === -1 ? 'Unlimited' : p.maxPolls}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Surveys Allowed:</span>
                      <strong className="text-white font-bold">{p.maxSurveys === null || p.maxSurveys === -1 ? 'Unlimited' : p.maxSurveys}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Exams Allowed:</span>
                      <strong className="text-white font-bold">{p.maxExams === null || p.maxExams === -1 ? 'Unlimited' : p.maxExams}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <Link
                    href={user ? '/dashboard/plans' : '/login'}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                  >
                    {user ? 'Purchase Credits Pack' : 'Login to Purchase'}
                  </Link>
                </div>
              </div>
            );
          })}

          {activeCategory === 'ADDON' && addonPlans.map((p) => {
            return (
              <div 
                key={p.id}
                className="glass-card rounded-3xl p-6 border border-white/5 hover:border-white/10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 bg-white/[0.01]"
              >
                <div className="space-y-6">
                  <div>
                    <span 
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider block w-fit"
                      style={{ color: p.badgeColor, backgroundColor: `${p.badgeColor}15`, border: `1px solid ${p.badgeColor}30` }}
                    >
                      Advanced Add-On
                    </span>
                    <h3 className="text-xl font-extrabold text-white font-outfit mt-3">{p.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed min-h-[48px] mt-1.5">{p.description}</p>
                  </div>

                  <div className="border-t border-b border-white/5 py-4">
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Add-On Base Price</span>
                    <span className="text-3xl font-black text-white">
                      {getCurrencySymbol(p.currency)}{p.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] text-gray-500 font-bold uppercase block">Pre-Requisite</span>
                    <div className="text-[10px] text-purple-300 font-semibold bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl leading-relaxed">
                      ⚠️ **Requires active subscription**: This package functions as an overlay and can only be active alongside a running paid subscription.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] text-gray-400 space-y-1.5 font-outfit">
                    <div className="flex items-center justify-between">
                      <span>Max Polls Allowed:</span>
                      <strong className="text-white font-bold">{p.maxPolls === null || p.maxPolls === -1 ? 'Unlimited' : p.maxPolls}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Surveys Allowed:</span>
                      <strong className="text-white font-bold">{p.maxSurveys === null || p.maxSurveys === -1 ? 'Unlimited' : p.maxSurveys}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Exams Allowed:</span>
                      <strong className="text-white font-bold">{p.maxExams === null || p.maxExams === -1 ? 'Unlimited' : p.maxExams}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <Link
                    href={user ? '/dashboard/plans' : '/login'}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                  >
                    {user ? 'Unlock Feature Add-On' : 'Login to Unlock'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* STRICT NO-REFUNDS POLICY SECTION */}
        <section id="refund-policy" className="border border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent rounded-3xl p-6 md:p-8 space-y-4 max-w-4xl mx-auto shadow-[0_0_30px_rgba(239,68,68,0.05)]">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-6 h-6 stroke-[2]" />
            <h2 className="text-lg md:text-xl font-black uppercase tracking-wider font-outfit">
              Strict Payment Rules and Refund Policy & Agreement
            </h2>
          </div>
          <div className="text-xs md:text-sm text-gray-400 leading-relaxed space-y-3 font-semibold">
            <p>
              Please read carefully before finalizing any purchase or transaction on the Pollstar platform.
            </p>
            <p className="border-l-2 border-red-500/40 pl-3 text-red-200">
              <strong>Only UPI Payments:</strong> All payments to be made by UPI and upto 24 hours taken for verification and plan activation<strong>Verification within 24 hours of payment.</strong>.
            </p>
            <p className="border-l-2 border-red-500/40 pl-3 text-red-200">
              <strong>100% NON-REFUNDABLE AND FINAL SALES:</strong> All payments made to Pollstar—including but not limited to Electoral Subscriptions (monthly, quarterly, yearly, or multi-year tiers), Pay-As-You-Go credit packs (Polls, Surveys, Exams, or Combos), and Premium Add-On expansions—are completely <strong>non-refundable</strong>.
            </p>
            <p>
              Under no circumstances will refunds, partial adjustments, pro-rated balances, or exchange credits be issued, including for unused subscription periods, credit packs that have expired or remained unused, or for accounts terminated, suspended, or restricted due to acceptable use policy violations.
            </p>
            <p>
              By proceeding with any billing transaction or linking a payment method, you explicitly acknowledge, agree to, and accept this strict no-refunds policy.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
