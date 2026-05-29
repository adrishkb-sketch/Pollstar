'use client';

import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Share2, 
  Copy, 
  Check, 
  ArrowUpRight, 
  History, 
  HelpCircle, 
  Sparkles, 
  Loader2, 
  Smartphone, 
  Building, 
  CreditCard,
  AlertCircle,
  FileText
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  method: string;
  details: string;
  createdAt: string;
}

interface Wallet {
  id: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  transactions: Transaction[];
}

const getCurrencySymbol = (code: string) => {
  if (code === 'INR') return '₹';
  if (code === 'EUR') return '€';
  if (code === 'GBP') return '£';
  return '$';
};

export default function EarningsPage() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState('USD');

  // Copy states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Request withdrawal form state
  const [showWithdrawDrawer, setShowWithdrawDrawer] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'BANK' | 'PAYPAL'>('UPI');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string | null>(null);

  const fetchEarningsData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setUser(meData.user);
          if (meData.globalDisplayCurrency) {
            setDisplayCurrency(meData.globalDisplayCurrency);
          }
        }
      }

      const earningsRes = await fetch('/api/dashboard/earnings');
      if (earningsRes.ok) {
        const data = await earningsRes.json();
        if (data.success) {
          setWallet(data.wallet);
          setPayouts(data.payoutRequests || []);
        }
      }
    } catch (err) {
      console.error('Error fetching earnings dashboard data:', err);
      setError('Could not retrieve wallet ledger details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const handleCopyLink = () => {
    if (!user?.referralCode) return;
    const shareUrl = `${window.location.origin}/signup?ref=${user.referralCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg(null);
    setWithdrawSuccessMsg(null);

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawErrorMsg('Please input a valid positive amount.');
      return;
    }

    if (wallet && amt > wallet.balance) {
      setWithdrawErrorMsg('Withdrawable amount exceeds available balance.');
      return;
    }

    if (!withdrawDetails.trim()) {
      setWithdrawErrorMsg('Please provide payment destination details.');
      return;
    }

    setSubmittingWithdrawal(true);

    try {
      const res = await fetch('/api/dashboard/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          method: withdrawMethod,
          details: withdrawDetails
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWithdrawSuccessMsg('Withdrawal request logged successfully! Awaiting administrator clear.');
        setWithdrawAmount('');
        setWithdrawDetails('');
        // Re-load stats instantly
        await fetchEarningsData();
        setTimeout(() => {
          setShowWithdrawDrawer(false);
          setWithdrawSuccessMsg(null);
        }, 3000);
      } else {
        setWithdrawErrorMsg(data.error || 'Failed to submit withdrawal request.');
      }
    } catch (err) {
      setWithdrawErrorMsg('Connection timeout submitting request.');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <DashboardHeader user={user} />
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-gray-400 font-semibold text-sm animate-pulse">Loading wallet balance ledger...</p>
        </div>
      </div>
    );
  }

  const referralUrl = user?.referralCode 
    ? `${window.location.origin}/signup?ref=${user.referralCode}` 
    : '';

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Earnings & Referral Portal
            </h1>
            <p className="text-gray-500 text-xs mt-1">Monitor commissions, copy affiliate codes, and request clearances.</p>
          </div>

          <button
            onClick={() => setShowWithdrawDrawer(true)}
            disabled={!wallet || wallet.balance <= 0}
            className="py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm shadow-xl shadow-purple-600/10 hover:shadow-purple-500/20 transition-all border border-purple-400/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw Funds</span>
          </button>
        </div>

        {error && (
          <div className="glass-card border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {wallet && (
          <>
            {/* Wallet Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Available Balance */}
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-purple-950/15 via-transparent to-transparent flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider block">Withdrawable Balance</span>
                  <span className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {getCurrencySymbol(displayCurrency)}{wallet.balance.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-500 block uppercase tracking-widest font-bold">{displayCurrency} Balance</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/5">
                  <Coins className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              {/* Card 2: Total Earned */}
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">Life-Time Commissions</span>
                  <span className="text-4xl font-black text-emerald-400">
                    {getCurrencySymbol(displayCurrency)}{wallet.totalEarned.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-500 block uppercase tracking-widest font-bold">Earned to Date</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl">
                  <Sparkles className="w-7 h-7" />
                </div>
              </div>

              {/* Card 3: Total Withdrawn */}
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider block">Cleared Payouts</span>
                  <span className="text-4xl font-black text-indigo-300">
                    {getCurrencySymbol(displayCurrency)}{wallet.totalWithdrawn.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-500 block uppercase tracking-widest font-bold">Settled to bank</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl">
                  <History className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* Middle row: Copy links & Education */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Copy Links Grid (7 columns) */}
              <div className="lg:col-span-7 glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-indigo-400" />
                    <span>Referral Links & Code</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Invite new creators to Pollstar and earn commissions on plan signups.</p>
                </div>

                <div className="space-y-4">
                  {/* Shareable Link Input Group */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Shareable Signup URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={referralUrl}
                        className="flex-1 glass-input text-xs font-semibold px-4 py-3 bg-[#030712] border-white/5 focus:border-white/5 select-all"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 rounded-xl border border-white/15 bg-white/[0.02] hover:bg-white/[0.06] text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Shareable Code Input Group */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Unique Referral Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={user?.referralCode || ''}
                        className="flex-1 glass-input text-xs font-semibold px-4 py-3 bg-[#030712] border-white/5 focus:border-white/5 select-all text-purple-300 font-mono tracking-widest text-center"
                      />
                      <button
                        onClick={handleCopyCode}
                        className="px-4 rounded-xl border border-white/15 bg-white/[0.02] hover:bg-white/[0.06] text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Structure Info (5 columns) */}
              <div className="lg:col-span-5 glass-card rounded-3xl p-6 md:p-8 border border-white/5 bg-gradient-to-br from-indigo-950/15 via-transparent to-transparent flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-400 animate-bounce" />
                    <span>Multi-Level MLM Compliance</span>
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Under Indian Direct Selling Rules (2021), recruitment payments are strictly prohibited. The Pollstar commission engine distributes commissions *strictly* from subscription and combo package sales up to 3 levels:
                  </p>
                </div>

                {/* Level metrics lists */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold font-mono">1</span>
                      <span className="text-white font-semibold">Level 1 (Direct Referred)</span>
                    </div>
                    <span className="text-emerald-400 font-bold">10% Commission</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold font-mono">2</span>
                      <span className="text-white font-semibold">Level 2 (Secondary Sub-tier)</span>
                    </div>
                    <span className="text-indigo-300 font-bold">5% Commission</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono">3</span>
                      <span className="text-white font-semibold">Level 3 (Tertiary Sub-tier)</span>
                    </div>
                    <span className="text-blue-300 font-bold">2.5% Commission</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 flex items-start gap-1.5 bg-white/[0.01] p-3 border border-white/5 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Commissions are credited instantly to wallets immediately upon simulated package upgrades.</span>
                </div>
              </div>
            </div>

            {/* Payout Requests Drawer Modal */}
            {showWithdrawDrawer && (
              <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="glass-card max-w-md w-full border border-purple-500/20 bg-[#080d1a] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
                  <div>
                    <h3 className="text-xl font-bold">Withdraw Balance Funds</h3>
                    <p className="text-xs text-gray-500">Request payout clearing from system administrators</p>
                  </div>

                  {withdrawErrorMsg && (
                    <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-3 text-xs text-red-400">
                      {withdrawErrorMsg}
                    </div>
                  )}

                  {withdrawSuccessMsg && (
                    <div className="border border-emerald-500/25 bg-emerald-500/5 rounded-xl p-3 text-xs text-emerald-400">
                      {withdrawSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmitWithdrawal} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Withdraw Amount ({getCurrencySymbol(displayCurrency)})</label>
                      <input
                        type="number"
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full glass-input text-sm px-4 py-3"
                      />
                      <span className="text-[10px] text-gray-500">Available: {getCurrencySymbol(displayCurrency)}{wallet.balance.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Payout Method</label>
                      <div className="grid grid-cols-3 gap-2 bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => setWithdrawMethod('UPI')}
                          className={`flex flex-col items-center py-2 rounded-lg text-xs font-semibold gap-1 transition-all ${
                            withdrawMethod === 'UPI' 
                              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' 
                              : 'bg-transparent border border-transparent text-gray-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>UPI VPA</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithdrawMethod('BANK')}
                          className={`flex flex-col items-center py-2 rounded-lg text-xs font-semibold gap-1 transition-all ${
                            withdrawMethod === 'BANK' 
                              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' 
                              : 'bg-transparent border border-transparent text-gray-400 hover:text-white'
                          }`}
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span>Bank A/c</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithdrawMethod('PAYPAL')}
                          className={`flex flex-col items-center py-2 rounded-lg text-xs font-semibold gap-1 transition-all ${
                            withdrawMethod === 'PAYPAL' 
                              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' 
                              : 'bg-transparent border border-transparent text-gray-400 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>PayPal</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Destination Parameters</label>
                      <textarea
                        required
                        value={withdrawDetails}
                        onChange={(e) => setWithdrawDetails(e.target.value)}
                        placeholder={
                          withdrawMethod === 'UPI' 
                            ? 'Enter UPI ID (e.g. adrish@ybl)' 
                            : withdrawMethod === 'BANK' 
                              ? 'Bank Name: Axis Bank\nAccount Number: 92301004...\nIFSC Code: UTIB0000005'
                              : 'Enter PayPal Email Address'
                        }
                        rows={3}
                        className="w-full glass-input text-xs px-4 py-3 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowWithdrawDrawer(false)}
                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/[0.03] text-gray-400 font-bold text-xs transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingWithdrawal}
                        className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all border border-purple-400/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {submittingWithdrawal ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Request Payout'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Historical Ledgers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Transactions list */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>Wallet Transaction Ledger</span>
                </h3>

                <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-purple-500/20">
                  <table className="min-w-[500px] w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest font-bold">
                        <th className="pb-3 pr-2">Date</th>
                        <th className="pb-3 pr-2">Details</th>
                        <th className="pb-3 pr-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {wallet.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-500">No transaction logs logged on this wallet yet.</td>
                        </tr>
                      ) : (
                        wallet.transactions.map((tx) => (
                          <tr key={tx.id} className="text-gray-300">
                            <td className="py-3.5 pr-2 font-mono text-[10px] text-gray-500">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 pr-2 font-semibold">
                              {tx.description}
                            </td>
                            <td className={`py-3.5 pr-2 text-right font-bold font-mono ${
                              tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {tx.amount >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{tx.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historical Clearances Payouts */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <span>Withdrawal Requests History</span>
                </h3>

                <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-purple-500/20">
                  <table className="min-w-[550px] w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest font-bold">
                        <th className="pb-3 pr-2">Requested</th>
                        <th className="pb-3 pr-2">Gateway</th>
                        <th className="pb-3 pr-2">Amount</th>
                        <th className="pb-3 pr-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-500">No withdrawal records submitted yet.</td>
                        </tr>
                      ) : (
                        payouts.map((po) => (
                          <tr key={po.id} className="text-gray-300">
                            <td className="py-3.5 pr-2 font-mono text-[10px] text-gray-500">
                              {new Date(po.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 pr-2 font-semibold">
                              <span className="uppercase tracking-wider">{po.method}</span>
                              <span className="text-[10px] text-gray-500 block truncate max-w-[120px]">{po.details}</span>
                            </td>
                            <td className="py-3.5 pr-2 font-bold font-mono text-white">
                              {getCurrencySymbol(displayCurrency)}{po.amount.toFixed(2)}
                            </td>
                            <td className="py-3.5 pr-2 text-right font-bold">
                              {po.status === 'PENDING' && (
                                <span className="inline-block px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                                  Pending Review
                                </span>
                              )}
                              {po.status === 'CLEARED' && (
                                <span className="inline-block px-2.5 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                                  Cleared Bank
                                </span>
                              )}
                              {po.status === 'REJECTED' && (
                                <span className="inline-block px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] uppercase font-bold tracking-wider">
                                  Declined
                                </span>
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
          </>
        )}
      </main>
    </div>
  );
}
