'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Sparkles, 
  Loader2, 
  Check, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Printer, 
  X, 
  Coins, 
  ShieldAlert,
  Lock,
  Download
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import { formatBillingCycle } from '@/lib/planExpiry';

const FEATURES_INFO = [
  // 1. Poll Features (19)
  { key: 'openPublicPolls', label: 'Open Public Polls' },
  { key: 'realTimeLiveResults', label: 'Real-Time Live Results' },
  { key: 'liveGeolocationMap', label: 'Live Geolocation Map' },
  { key: 'liveVoteTicker', label: 'Live Vote Ticker' },
  { key: 'viralVoteIndicators', label: 'Viral Vote Indicators' },
  { key: 'rankedChoiceBordaCount', label: 'Ranked Choice / Borda Count' },
  { key: 'quadraticVoting', label: 'Quadratic Voting' },
  { key: 'singleChoiceMultiSelect', label: 'Single Choice / Multi-Select' },
  { key: 'enableDragAndDropPodium', label: 'Drag-and-Drop Ballot Podium' },
  { key: 'opinionChatbox', label: 'Opinion Chatbox' },
  { key: 'sentimentReactions', label: 'Sentiment Reactions' },
  { key: 'voterLeaderboard', label: 'Voter Leaderboard' },
  { key: 'multipleChartTypes', label: 'Multiple Chart Types' },
  { key: 'voteTimelineGraph', label: 'Vote Timeline Graph' },
  { key: 'multiRoundPolls', label: 'Multi-Round Polls' },
  { key: 'revoteChangeVote', label: 'Revote / Change Vote' },
  { key: 'knockoutBracket', label: 'Knockout Tournament Bracket' },
  { key: 'enableScenarioSimulator', label: 'What-If Scenario Simulator' },
  { key: 'enableAiProjection', label: 'AI Vote Projection & Live Predictions' },

  // 2. Survey Features (24)
  { key: 'multipleQuestionTypes', label: 'Multiple Question Types' },
  { key: 'longFormTextResponses', label: 'Long-Form Text Responses' },
  { key: 'starEmojiRatings', label: 'Star & Emoji Ratings' },
  { key: 'matrixGridQuestions', label: 'Matrix / Grid Questions' },
  { key: 'yesnoToggleQuestions', label: 'Yes/No & Toggle Questions' },
  { key: 'fileUploadQuestions', label: 'File Upload Questions' },
  { key: 'conditionalLogicBranching', label: 'Conditional Logic Branching' },
  { key: 'multiPageSurveys', label: 'Multi-Page Surveys' },
  { key: 'questionRandomizationSurvey', label: 'Question Randomization' },
  { key: 'responseTimeLimits', label: 'Response Time Limits' },
  { key: 'requiredVsOptionalQuestions', label: 'Required vs Optional Questions' },
  { key: 'inputValidationRules', label: 'Input Validation Rules' },
  { key: 'realTimeResponseDashboard', label: 'Real-Time Response Dashboard' },
  { key: 'aiSentimentAnalysis', label: 'AI Sentiment Analysis' },
  { key: 'wordCloudGenerator', label: 'Word Cloud Generator' },
  { key: 'aiSummaryReport', label: 'AI Summary Report' },
  { key: 'automatedReminders', label: 'Automated Reminders' },
  { key: 'completionRateTracking', label: 'Completion Rate Tracking' },
  { key: 'anonymousResponses', label: 'Anonymous Responses' },
  { key: 'targetedDistribution', label: 'Targeted Distribution' },
  { key: 'responseFilteringSegmentation', label: 'Response Filtering & Segmentation' },
  { key: 'saveResumeLater', label: 'Save & Resume Later (Survey)' },
  { key: 'enableDropOffTracking', label: 'Abandonment & Drop-off Tracking' },
  { key: 'enableCrossTabulation', label: 'Demographic Cross-Tabulation' },

  // 3. Exam Features (25)
  { key: 'timedExams', label: 'Timed Exams' },
  { key: 'fullScreenLockdown', label: 'Full-Screen Lockdown' },
  { key: 'tabSwitchDetection', label: 'Tab-Switch Detection' },
  { key: 'copyPastePrevention', label: 'Copy-Paste Prevention' },
  { key: 'cheatProbabilityScore', label: 'Cheat Probability Score' },
  { key: 'perQuestionMarks', label: 'Per-Question Marks' },
  { key: 'autoGradingEngine', label: 'Auto-Grading Engine' },
  { key: 'manualGradingInterface', label: 'Manual Grading Interface' },
  { key: 'pageBreaksSections', label: 'Page Breaks / Sections' },
  { key: 'dragAndDropQuestionOrderingExam', label: 'Drag-and-Drop Question Ordering' },
  { key: 'detailedScoreReports', label: 'Detailed Score Reports' },
  { key: 'classPerformanceAnalytics', label: 'Class Performance Analytics' },
  { key: 'weaknessAnalysis', label: 'Weakness Analysis' },
  { key: 'aiConceptExplanations', label: 'AI Concept Explanations' },
  { key: 'printableResultsPdf', label: 'Printable Results PDF' },
  { key: 'bulkResultsExport', label: 'Bulk Results Export' },
  { key: 'emailResultsToStudents', label: 'Email Results to Students' },
  { key: 'teacherGradebook', label: 'Teacher Gradebook' },
  { key: 'scheduledStartEnd', label: 'Scheduled Start & End' },
  { key: 'questionHints', label: 'Question Hints' },
  { key: 'negativeMarking', label: 'Negative Marking' },
  { key: 'studentRosterManagement', label: 'Student Roster Management' },
  { key: 'timePerQuestionAnalytics', label: 'Time-per-Question Analytics' },
  { key: 'inbuiltScientificCalculator', label: 'Inbuilt Scientific Calculator' },
  { key: 'saveResumeLaterExam', label: 'Save & Resume Later (Exam)' },
  { key: 'liveWebcamProctoring', label: 'Live Webcam Proctoring Dashboard' },

  // 4. Exam Question Types (10)
  { key: 'mcqSingleCorrect', label: 'MCQ (Single Correct)' },
  { key: 'mcqMultipleCorrect', label: 'MCQ (Multiple Correct)' },
  { key: 'shortAnswerQuestionsSaq', label: 'Short Answer Questions (SAQ)' },
  { key: 'longAnswerQuestionsLaq', label: 'Long Answer Questions (LAQ)' },
  { key: 'trueOrFalse', label: 'True or False' },
  { key: 'fillInTheBlanks', label: 'Fill in the Blanks' },
  { key: 'matchTheFollowing', label: 'Match the Following' },
  { key: 'numericalInput', label: 'Numerical Input' },
  { key: 'fileUploadAnswers', label: 'File Upload Answers' },
  { key: 'studentWhiteboardQuestion', label: 'Student Drawing Whiteboard' },

  // 5. Platform Features (16)
  { key: 'otpVoterVerification', label: 'OTP Voter Verification' },
  { key: 'closedVoterLists', label: 'Closed Voter Lists' },
  { key: 'customBranding', label: 'Custom Logo Branding' },
  { key: 'customBrandingThemes', label: 'Custom Branding & Premium Themes' },
  { key: 'creatorScribbleCanvas', label: 'Creator Brain Scribble Canvas' },
  { key: 'premiumDarkMode', label: 'Premium Dark Mode' },
  { key: 'organizationAccounts', label: 'Organization Accounts' },
  { key: 'apiWebhooks', label: 'API & Webhooks' },
  { key: 'deviceFingerprinting', label: 'Device Fingerprinting' },
  { key: 'exportResults', label: 'Export Results' },
  { key: 'enableDomainRestriction', label: 'Domain and Email Lock Lists' },
  { key: 'collaborations', label: 'Real-time Creator Collaboration' },
  { key: 'enableDirectInbox', label: 'Voter Inbox Direct Messages' },
  { key: 'removeAdvertisements', label: 'Ad-Free Experience (No Ads)' },
  { key: 'embedCode', label: 'Embed Voting Widget Option' },
  { key: 'linkShortener', label: 'Link Shortener Option' }
];

const getCurrencySymbol = (currencyCode?: string) => {
  if (currencyCode === 'INR') return '₹';
  if (currencyCode === 'EUR') return '€';
  if (currencyCode === 'GBP') return '£';
  return '$';
};

const getHasFeature = (features: any, key: string): boolean => {
  if (!features) return false;
  
  // Direct match
  if (features[key] === true) return true;
  
  // Key mappings between admin dashboard keys and plans display keys
  const mappings: Record<string, string[]> = {
    singleChoice: ['singleChoiceMultiSelect', 'singleChoice'],
    bordaCount: ['rankedChoiceBordaCount', 'bordaCount'],
    knockoutBracket: ['knockoutBracket'],
    multipageSurveys: ['multiPageSurveys', 'multipageSurveys'],
    sentimentAnalysis: ['aiSentimentAnalysis', 'sentimentAnalysis'],
    dropOffTracking: ['enableDropOffTracking', 'dropOffTracking'],
    crossTabulation: ['enableCrossTabulation', 'crossTabulation'],
    geolocations: ['liveGeolocationMap', 'geolocations'],
    domainLocking: ['enableDomainRestriction', 'domainLocking'],
    otpVerification: ['otpVoterVerification', 'otpVerification'],
    collaborations: ['collaborations'],
    inboxMessages: ['enableDirectInbox', 'inboxMessages'],
    dataExport: ['exportResults', 'dataExport'],
    creatorScribbleCanvas: ['creatorScribbleCanvas'],
    studentWhiteboardQuestion: ['studentWhiteboardQuestion'],
    inbuiltScientificCalculator: ['inbuiltScientificCalculator'],
    saveResumeLater: ['saveResumeLater', 'saveResumeLaterExam'],
    customBrandingThemes: ['customBrandingThemes', 'customBranding']
  };
  
  const altKeys = mappings[key] || [key];
  return altKeys.some(altKey => features[altKey] === true);
};

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [addonPlans, setAddonPlans] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'SUBSCRIPTION' | 'ADDON'>('SUBSCRIPTION');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'TWO_YEARS' | 'LIFETIME'>('MONTHLY');
  const [selectedDurs, setSelectedDurs] = useState<Record<string, string>>({});

  const getPlanPricing = (p: any, cycle: string) => {
    let price = p.price;
    let originalPrice = p.originalPrice;
    let cycleLabel = p.billingCycle;
    let isOfferActive = p.offerEndDate && new Date(p.offerEndDate) > new Date();

    if (p.durations) {
      const durConfig = p.durations as any;
      if (durConfig[cycle] && durConfig[cycle].enabled) {
        price = parseFloat(durConfig[cycle].price || '0');
        originalPrice = parseFloat(durConfig[cycle].originalPrice || '0');
        cycleLabel = cycle;
      }
    }
    
    return { price, originalPrice, cycleLabel, isOfferActive };
  };

  // Invoice display states
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Mobile Swipe ref
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchSessionAndPlans = async () => {
    try {
      // Fire all independent requests at the same time
      const [meRes, plansRes, invoicesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/plans'),
        fetch('/api/checkout/invoices'),
      ]);

      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const data = await meRes.json();
      setUser(data.user);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        const rawPlans = plansData.plans || [];
        const rawAddons = plansData.addonPlans || [];
        const sortedPlans = [...rawPlans].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
        setPlans(sortedPlans);
        setAddonPlans(rawAddons.sort((a: any, b: any) => (a.addonRank ?? 0) - (b.addonRank ?? 0)));
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (err) {
      setError('Failed to fetch platform pricing data.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchSessionAndPlans();
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
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12 flex-1 relative w-full">
        {/* Glow glow background */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Pricing Subscriptions & Plans
            </h1>
            <p className="text-gray-500 text-xs mt-1">Upgrade your features, examine plan details, and download purchase invoices.</p>
          </div>

          <div className="glass-card rounded-2xl px-4 py-2.5 border border-purple-500/20 bg-purple-500/5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-xs text-gray-300 font-semibold">Active Tier: <strong className="text-purple-300 uppercase">{currentPlan.name} Plan</strong></span>
          </div>
        </div>

        {error && (
          <div className="glass-card border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Category Toggles */}
        <div className="flex justify-center mb-6 pt-2">
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

        {/* Dynamic sliding cards system for subscription options */}
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
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 scroll-smooth scrollbar-none pb-4 md:overflow-x-visible md:snap-none md:flex-row md:grid md:grid-cols-3"
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

                    {/* For SUBSCRIPTION: show clean features summary instead of full checklist */}
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

                  {/* Actions CTA upgraded to Checkout */}
                  <div className="pt-6 mt-6 border-t border-white/5">
                    {(() => {
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
                              href={`/checkout?planId=${p.id}&duration=${user?.planBillingCycle || 'MONTHLY'}`}
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

                      return (
                        <Link
                          href={p.hasFreeTrial 
                            ? `/checkout?planId=${p.id}&trial=true` 
                            : `/checkout?planId=${p.id}&duration=${activeDur}`}
                          className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                        >
                          {p.hasFreeTrial 
                            ? `Start ${p.freeTrialDays || 7}-Day Free Trial` 
                            : (displayPrice > 0 ? `⬆️ Upgrade (${formatBillingCycle(activeDur)})` : 'Activate Free Tier')}
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              );
            })}

            {activeCategory === 'ADDON' && addonPlans.map((p) => {
              const now = new Date();
              // Determine current user add-on rank from active add-on invoices
              // (computed server-side via the /api/auth/me response, falling back to 0)
              const userCurrentAddonRank: number = user?.activeAddonRank ?? 0;
              const isAddonInferior = (p.addonRank ?? 0) <= userCurrentAddonRank && userCurrentAddonRank > 0;
              const hasActiveSub = user?.planId && user?.plan?.name?.toLowerCase() !== 'free' &&
                (user?.isLifetimePlan || (user?.planExpiresAt && new Date(user.planExpiresAt) > now));

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
                    {!hasActiveSub ? (
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
                        href={`/checkout?planId=${p.id}&isAddon=true`}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                      >
                        ⬆️ Upgrade Audience Add-On
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PENDING UPI PAYMENT NOTICE ── */}
        {invoices.filter(inv => inv.paymentStatus === 'PENDING').map(inv => (
          <div key={`pending-${inv.id}`} className="glass-card rounded-2xl p-5 border-2 border-amber-500/40 bg-amber-500/5 flex items-start gap-4 shadow-lg shadow-amber-500/5">
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center shrink-0 text-xl">⏳</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-300 text-sm uppercase tracking-wide">UPI Payment Under Review</span>
                <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">Pending Verification</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Your UPI payment for <strong className="text-white">{inv.plan?.name}</strong> (UTR: <span className="font-mono text-amber-300">{inv.upiUtr}</span>) has been received and is currently being verified against our bank records.
              </p>
              <p className="text-[11px] text-amber-500/70 mt-1.5 font-semibold">
                ⏱ Verification can take up to 24 hours. Your plan will be activated immediately upon approval. Please do not make duplicate payments.
              </p>
            </div>
          </div>
        ))}

        {/* ── REJECTED UPI PAYMENT NOTICE ── */}
        {invoices.filter(inv => inv.paymentStatus === 'REJECTED').map(inv => (
          <div key={`rejected-${inv.id}`} className="glass-card rounded-2xl p-5 border-2 border-red-500/40 bg-red-500/5 flex items-start gap-4 shadow-lg shadow-red-500/5">
            <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center shrink-0 text-xl">❌</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-red-300 text-sm uppercase tracking-wide">Payment Verification Failed</span>
                <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">Rejected</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Your UPI payment for <strong className="text-white">{inv.plan?.name}</strong> (UTR: <span className="font-mono text-red-300">{inv.upiUtr}</span>) could not be verified.
              </p>
              {inv.rejectionReason && (
                <div className="mt-2 p-3 rounded-xl bg-red-950/50 border border-red-500/20">
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Admin Reason:</p>
                  <p className="text-xs text-red-200">{inv.rejectionReason}</p>
                </div>
              )}
              <p className="text-[11px] text-red-500/70 mt-2 font-semibold">
                Please contact support or try purchasing again with the correct payment details.
              </p>
            </div>
          </div>
        ))}

        {/* Responsive Grid for Past Plans History & Invoice History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Past Subscriptions & Plans Timeline */}
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 bg-[#080d1a] space-y-6 flex flex-col">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-white/5">
              <Zap className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-xl font-bold">Past Subscriptions & Plan History</h2>
                <p className="text-gray-500 text-xs mt-0.5">Chronological timeline of active and previously held tiers</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-500/20">
              {invoices.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs py-8">
                  No active or historical plan subscriptions found.
                </div>
              ) : (
                invoices.map((inv, idx) => {
                  const isCompleted = inv.paymentStatus === 'COMPLETED' || !inv.paymentStatus;
                  const isPending = inv.paymentStatus === 'PENDING';
                  const isRejected = inv.paymentStatus === 'REJECTED';

                  const isActivePlan = isCompleted && (
                    inv.isAddon
                      ? (inv.plan?.addonRank === user?.activeAddonRank && (!inv.planExpiresAt || new Date(inv.planExpiresAt) >= new Date()))
                      : (user?.plan?.id === inv.planId && (!inv.planExpiresAt || new Date(inv.planExpiresAt) >= new Date()))
                  );

                  const isExpired = isCompleted && inv.planExpiresAt ? new Date(inv.planExpiresAt) < new Date() : false;

                  return (
                    <div 
                      key={`past-${inv.id}`} 
                      className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                        isActivePlan 
                          ? 'bg-purple-500/5 border-purple-500/20 shadow-md' 
                          : 'bg-white/[0.01] border-white/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{inv.plan.name}</span>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider block shrink-0"
                            style={{ color: inv.plan.badgeColor || '#a855f7', backgroundColor: `${inv.plan.badgeColor || '#a855f7'}15`, border: `1px solid ${inv.plan.badgeColor || '#a855f7'}30` }}
                          >
                            {inv.isAddon ? 'Add-On' : 'Main Plan'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {isPending ? (
                            <span className="text-amber-400/90 font-bold block">⏳ Verification Pending (Submitted: {new Date(inv.createdAt).toLocaleDateString()})</span>
                          ) : isRejected ? (
                            <>
                              <span className="text-red-400 font-bold block">❌ Verification Failed (Submitted: {new Date(inv.createdAt).toLocaleDateString()})</span>
                              {inv.rejectionReason && (
                                <span className="block mt-0.5 text-[9px] text-red-500/70 font-semibold italic">Reason: {inv.rejectionReason}</span>
                              )}
                            </>
                          ) : (
                            <>
                              Activated: <strong className="text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</strong> 
                              {inv.planExpiresAt && (
                                <> • Expires: <strong className="text-gray-400">{new Date(inv.planExpiresAt).toLocaleDateString()}</strong></>
                              )}
                            </>
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          isActivePlan
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                              : isRejected
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : isExpired
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border border-white/5'
                        }`}>
                          {isActivePlan ? 'Active' : isPending ? 'Pending' : isRejected ? 'Rejected' : isExpired ? 'Expired' : 'Previous'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Invoice Purchase Ledger history */}
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-white/5">
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-xl font-bold">Purchase Invoices History</h2>
                <p className="text-gray-500 text-xs mt-0.5">Download receipts or print tax invoices for accounting records</p>
              </div>
            </div>

            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-purple-500/20 max-h-[300px] overflow-y-auto">
              <table className="min-w-[450px] w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest font-bold">
                    <th className="pb-3 pr-2">Date</th>
                    <th className="pb-3 pr-2">Plan</th>
                    <th className="pb-3 pr-2">Paid</th>
                    <th className="pb-3 pr-2 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">No premium plan purchases recorded.</td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="text-gray-300">
                        <td className="py-3 pr-2 font-mono text-[10px] text-gray-500">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-2 font-semibold">
                          {inv.plan.name}
                        </td>
                        <td className="py-3 pr-2 font-bold font-mono text-emerald-400">
                          {getCurrencySymbol(inv.plan.currency)}{inv.amountPaid.toFixed(2)}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          {inv.paymentStatus === 'PENDING' ? (
                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">⏳ Unverified</span>
                          ) : inv.paymentStatus === 'REJECTED' ? (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">❌ Rejected</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice({
                                  ...inv,
                                  receiptRef: `PST-${inv.id.substring(0,8).toUpperCase()}`,
                                  planName: inv.plan.name,
                                  planCurrency: inv.plan.currency,
                                  createdAt: new Date(inv.createdAt).toLocaleDateString()
                                });
                                setShowInvoiceModal(true);
                              }}
                              className="py-1 px-2 rounded border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 text-purple-300 text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>


        {/* DYNAMIC PRINTABLE POPUP MODAL OVERLAY */}
        {showInvoiceModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white text-gray-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-full">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-all p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 print:hidden"
              >
                ✕
              </button>

              {/* Invoice Layout */}
              <div className="space-y-6 text-left">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight text-indigo-600">POLLSTAR</h2>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Simulated Tax Invoice</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 space-y-0.5 font-semibold">
                    <div><strong>Invoice No:</strong> {selectedInvoice.id.toUpperCase()}</div>
                    <div><strong>Date:</strong> {selectedInvoice.createdAt}</div>
                    <div><strong>Receipt Ref:</strong> {selectedInvoice.receiptRef}</div>
                  </div>
                </div>

                {/* Company & Client Addresses */}
                <div className="grid grid-cols-2 gap-6 text-xs leading-relaxed">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Company Detail</span>
                    <div className="font-bold text-gray-800">Pollstar Inc.</div>
                    <div className="text-gray-500">Ramrajatala</div>
                    <div className="text-gray-500">Howrah-711112, West Bengal, India</div>
                    <div className="text-gray-500">pollstaremail@gmail.com</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Bill To</span>
                    <div className="font-bold text-gray-800">{selectedInvoice.billingName}</div>
                    <div className="text-gray-500">{selectedInvoice.billingAddress}</div>
                    <div className="text-gray-500">{selectedInvoice.billingCity}, {selectedInvoice.billingZip}</div>
                    <div className="text-gray-500">Phone: {selectedInvoice.billingPhone || 'N/A'}</div>
                  </div>
                </div>

                {/* Purchase Items Table */}
                <div className="border border-gray-100 rounded-2xl overflow-x-auto w-full scrollbar-thin text-xs">
                  <table className="min-w-[450px] w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Subscription Description</th>
                        <th className="p-3">Billing Cycle</th>
                        <th className="p-3 text-right">Total Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-3 font-semibold text-gray-800">{selectedInvoice.planName} Tier Upgrade</td>
                        <td className="p-3 text-gray-500">MONTHLY</td>
                        <td className="p-3 text-right font-bold text-gray-800">{getCurrencySymbol(selectedInvoice.planCurrency)}{selectedInvoice.amountPaid.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="border-t border-gray-100 pt-4 flex flex-col items-end text-xs space-y-2">
                  <div className="flex w-64 justify-between text-gray-500">
                    <span>Base Amount</span>
                    <span>{getCurrencySymbol(selectedInvoice.planCurrency)}{selectedInvoice.amountPaid.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.couponCode && (
                    <div className="flex w-64 justify-between text-emerald-600 font-semibold">
                      <span>Applied Promo Code</span>
                      <span>{selectedInvoice.couponCode}</span>
                    </div>
                  )}
                  <div className="flex w-64 justify-between text-gray-500">
                    <span>GST/VAT Estimate (0%)</span>
                    <span>{getCurrencySymbol(selectedInvoice.planCurrency)}0.00</span>
                  </div>
                  <div className="flex w-64 justify-between font-black text-gray-900 border-t border-gray-100 pt-2 text-sm">
                    <span>Total Amount Paid</span>
                    <span>{getCurrencySymbol(selectedInvoice.planCurrency)}{selectedInvoice.amountPaid.toFixed(2)}</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-[10px] text-gray-400 leading-relaxed text-center border-t border-gray-100 pt-4">
                  Thank you for your purchase! This is a simulated transaction receipt generated in the Pollstar Sandbox. No physical funds have been processed or moved.
                </div>

                {/* Action Row */}
                <div className="flex gap-3 pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    Print or Save as PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(false)}
                    className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    Close Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
