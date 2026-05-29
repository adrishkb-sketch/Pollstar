'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Sparkles, 
  Loader2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Lock,
  Vote
} from 'lucide-react';

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
  if (features[key] === true) return true;
  
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

export default function PublicPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDurs, setSelectedDurs] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      setError('Failed to fetch pricing configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
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

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col font-outfit">
      {/* Header */}
      <header className="border-b border-white/5 py-5 px-6 bg-[#030712]/50 backdrop-blur z-20 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight text-white">
              Poll<span className="text-emerald-400">star</span>
            </span>
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-all">Sign In</Link>
            <Link href="/signup" className="gradient-btn px-4 py-2 rounded-xl text-xs font-bold text-white transition-all">Get Started</Link>
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
            From classroom quizzes to nationwide polling and multi-page surveys. Explore all 94 features engineered to maximize response fidelity.
          </p>
        </div>

        {error && (
          <div className="glass-card border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

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

          {/* Cards container */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 scroll-smooth scrollbar-none pb-4 md:overflow-x-visible md:snap-none md:flex-row md:grid md:grid-cols-3"
          >
            {plans.map((p) => {
              return (
                <div 
                  key={p.id}
                  className="snap-center shrink-0 w-[300px] md:w-auto glass-card rounded-3xl p-6 border border-white/5 hover:border-white/10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 bg-white/[0.01]"
                >
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

                    {/* Active Offer Countdown notification ticker */}
                    {p.offerEndDate && new Date(p.offerEndDate) > new Date() && (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center justify-between gap-2 animate-pulse-glow">
                        <span className="flex items-center gap-1">⚡ Limited Time Offer active!</span>
                        <span className="font-mono text-[9px]">Ends: {new Date(p.offerEndDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="border-t border-b border-white/5 py-4 space-y-1">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Subscription Price</span>
                      {(() => {
                        const dursConfig = p.durations ? (p.durations as any) : null;
                        const enabledDurs = dursConfig 
                          ? Object.keys(dursConfig).filter((k: string) => dursConfig[k]?.enabled)
                          : [];
                        
                        const activeDur = selectedDurs[p.id] || enabledDurs[0] || 'MONTHLY';
                        
                        let displayPrice = p.price;
                        let displayOriginalPrice = p.originalPrice;
                        let cycleName = p.billingCycle.toLowerCase();

                        if (enabledDurs.length > 0 && dursConfig[activeDur]) {
                          displayPrice = parseFloat(dursConfig[activeDur].price || '0');
                          displayOriginalPrice = parseFloat(dursConfig[activeDur].originalPrice || '0');
                          cycleName = activeDur.toLowerCase();
                        }

                        const hasSlashPrice = displayOriginalPrice && displayOriginalPrice > displayPrice;

                        return (
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-3xl font-black text-white font-outfit">
                              {getCurrencySymbol(p.currency)}{displayPrice.toFixed(2)}
                            </span>
                            {hasSlashPrice && (
                              <span className="text-sm text-red-400/70 font-semibold line-through">
                                {getCurrencySymbol(p.currency)}{displayOriginalPrice!.toFixed(2)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 font-semibold">/{cycleName.replace('_', ' ')}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Limits Display */}
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] text-gray-400 space-y-1 font-outfit">
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

                    {/* Checklists features details */}
                    <div className="space-y-3">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Features & Gating</span>
                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-500/20">
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
                    {(() => {
                      const dursConfig = p.durations ? (p.durations as any) : null;
                      const enabledDurs = dursConfig 
                        ? Object.keys(dursConfig).filter((k: string) => dursConfig[k]?.enabled)
                        : [];
                      const activeDur = selectedDurs[p.id] || enabledDurs[0] || 'MONTHLY';
                      
                      let displayPrice = p.price;
                      if (enabledDurs.length > 0 && dursConfig[activeDur]) {
                        displayPrice = parseFloat(dursConfig[activeDur].price || '0');
                      }

                      return (
                        <Link
                          href={`/signup?planId=${p.id}&duration=${activeDur}`}
                          className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                        >
                          {displayPrice > 0 ? 'Sign Up & Subscribe' : 'Register Free'}
                        </Link>
                      );
                    })()}
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
