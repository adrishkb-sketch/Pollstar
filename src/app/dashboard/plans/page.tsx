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
  { key: 'customBrandingThemes', label: 'Premium Branding & 5 Rich Themes', desc: 'Replace branding with custom logos and swap between Sunset, Jade, and Ocean glass themes.' },
  { key: 'embedCode', label: 'Embed Voting Widget', desc: 'Generate copy-paste iframe HTML snippets to embed active polls directly into external CMS or webpages.' },
  { key: 'linkShortener', label: 'Link Shortener Option', desc: 'Generate customized short links (e.g. /s/abcde) for simplified voter sharing.' }
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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invoice display states
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Mobile Swipe ref
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchSessionAndPlans = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);

      // Fetch plans list
      const plansRes = await fetch('/api/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      // Fetch user invoices
      const invoicesRes = await fetch('/api/checkout/invoices');
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
            {plans.map((p) => {
              const isActivePlan = user?.planId === p.id || (p.name === 'Free' && !user?.planId);
              
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
                      <div className="flex justify-between items-start">
                        <span 
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: p.badgeColor, backgroundColor: `${p.badgeColor}15`, border: `1px solid ${p.badgeColor}30` }}
                        >
                          {p.badgeLabel || p.name}
                        </span>
                        {isActivePlan && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-extrabold text-white font-outfit">{p.name}</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed min-h-[48px]">{p.description}</p>
                    </div>

                    {/* Price Tag */}
                    <div className="border-t border-b border-white/5 py-4 space-y-1">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Subscription Price</span>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-white font-outfit">{getCurrencySymbol(p.currency)}{p.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-500 font-semibold ml-1">/{p.billingCycle.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Checklists features details */}
                    <div className="space-y-3">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Features & Gating</span>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
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

                  {/* Actions CTA upgraded to Checkout */}
                  <div className="pt-6 mt-6 border-t border-white/5">
                    {isActivePlan ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 rounded-xl font-bold bg-white/5 text-gray-400 text-xs border border-white/5 cursor-not-allowed text-center"
                      >
                        Currently Subscribed
                      </button>
                    ) : (
                      <Link
                        href={`/checkout?planId=${p.id}`}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs border border-purple-500/20 shadow-lg active:scale-95 transition-all text-center block"
                      >
                        {p.price > 0 ? `Get Upgrade (${p.billingCycle})` : 'Activate Free Tier'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest font-bold">
                  <th className="pb-3 pr-2">Billing Date</th>
                  <th className="pb-3 pr-2">Reference ID</th>
                  <th className="pb-3 pr-2">Plan Details</th>
                  <th className="pb-3 pr-2">Amount Paid</th>
                  <th className="pb-3 pr-2 text-right">Receipt Sheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No active premium plan purchases recorded on this account yet.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="text-gray-300">
                      <td className="py-3.5 pr-2 font-mono text-[10px] text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 pr-2 font-mono text-indigo-300">
                        {inv.id.toUpperCase()}
                      </td>
                      <td className="py-3.5 pr-2 font-semibold">
                        {inv.plan.name} Tier Upgrade
                      </td>
                      <td className="py-3.5 pr-2 font-bold font-mono text-emerald-400">
                        {getCurrencySymbol(inv.plan.currency)}{inv.amountPaid.toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice({
                              ...inv,
                              receiptRef: `PST-${Math.floor(Math.random()*900000+100000)}`,
                              planName: inv.plan.name,
                              planCurrency: inv.plan.currency,
                              createdAt: new Date(inv.createdAt).toLocaleDateString()
                            });
                            setShowInvoiceModal(true);
                          }}
                          className="py-1.5 px-3 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 text-purple-300 text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Get Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                    <div className="text-gray-500">100 Tech Venture Way</div>
                    <div className="text-gray-500">Silicon Valley, CA 94025</div>
                    <div className="text-gray-500">billing@pollstar.com</div>
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
                <div className="border border-gray-100 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
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
