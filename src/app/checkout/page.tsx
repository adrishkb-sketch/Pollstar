'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Percent, 
  ChevronRight,
  QrCode,
  Globe,
  Building,
  Coins
} from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingCycle: string;
  badgeColor: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('planId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Pricing calculation
  const [plan, setPlan] = useState<Plan | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // Fetch plan details
  useEffect(() => {
    if (!planId) {
      setError('No subscription plan selected for checkout.');
      setLoading(false);
      return;
    }

    async function loadCheckoutData() {
      try {
        // Fetch current user details for form auto-fill
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setEmail(meData.user.email || '');
            setFullName(meData.user.fullName || '');
            setPhone(meData.user.phoneNumber || '');
          }
        }

        // Fetch plan detail
        const planRes = await fetch('/api/plans');
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.success && planData.plans) {
            const matchedPlan = planData.plans.find((p: Plan) => p.id === planId);
            if (matchedPlan) {
              setPlan(matchedPlan);
              setFinalPrice(matchedPlan.price);
            } else {
              setError('Selected plan could not be found.');
            }
          } else {
            setError('Failed to fetch plan metadata.');
          }
        } else {
          setError('Failed to fetch subscription parameters.');
        }
      } catch (err: any) {
        console.error('Checkout initialization error:', err);
        setError('A system error occurred during checkout setup.');
      } finally {
        setLoading(false);
      }
    }

    loadCheckoutData();
  }, [planId]);

  // Apply Promo Discount
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/checkout/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode, planId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCouponApplied(data.coupon);
        setDiscountAmount(data.discountAmount);
        setFinalPrice(data.finalPrice);
        setCouponError(null);
      } else {
        setCouponError(data.error || 'Failed to apply coupon.');
      }
    } catch (err) {
      setCouponError('Network error validating coupon code.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Clear Promo Discount
  const handleClearCoupon = () => {
    setCouponApplied(null);
    setDiscountAmount(0);
    setCouponCode('');
    if (plan) {
      setFinalPrice(plan.price);
    }
  };

  // Submit secure simulated transaction
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setError('Please fill in required billing details.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          couponCode: couponApplied ? couponApplied.code : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        canvasConfetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        // Auto-redirect to dashboard after 4 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 4000);
      } else {
        setError(data.error || 'Simulated transaction declined by gateway.');
      }
    } catch (err) {
      setError('A connection timeout occurred during payment processing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-gray-400 font-medium text-sm animate-pulse">Establishing secure gateway connection...</p>
      </div>
    );
  }

  if (success && plan) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4">
        <div className="glass-card max-w-xl w-full border border-purple-500/30 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-gradient-to-b from-purple-950/20 to-transparent animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/5">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Payment Completed!
            </h1>
            <p className="text-purple-300 font-semibold text-lg">
              Welcome to the {plan.name} Tier
            </p>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Your subscription has been successfully provisioned. Global MLM commission splits have been computed and distributed cleanly.
            </p>
          </div>

          <div className="border border-white/5 rounded-2xl bg-white/[0.02] p-5 max-w-md mx-auto space-y-3 text-left">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Receipt Ref</span>
              <span className="font-mono text-gray-400">PST-{Math.floor(Math.random()*900000+100000)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Amount Paid</span>
              <span className="text-emerald-400 font-bold">${finalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Billing Cycle</span>
              <span className="text-gray-400 font-semibold">{plan.billingCycle}</span>
            </div>
          </div>

          <div className="pt-2 text-xs text-gray-500 flex items-center justify-center gap-1.5 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Redirecting to workspace dashboard shortly...</span>
          </div>

          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full max-w-xs py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/20 transition-all border border-purple-400/20 active:scale-95"
          >
            Launch Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Plan</span>
          </button>
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SSL Secured Checkout (Simulated)</span>
          </div>
        </div>

        {error && (
          <div className="glass-card border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {plan && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: Billing Details & Payments */}
            <form onSubmit={handleSubmitPayment} className="lg:col-span-7 space-y-8">
              {/* Billing Info */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Billing Information</h2>
                    <p className="text-xs text-gray-500">Provide registration details for receipting</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adrish Sen"
                      className="w-full glass-input text-sm px-4 py-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. adrish@school.edu"
                      className="w-full glass-input text-sm px-4 py-3"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Billing Address</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Creative Studio, Tech Park"
                      className="w-full glass-input text-sm px-4 py-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">City</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Kolkata"
                      className="w-full glass-input text-sm px-4 py-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Postal / Zip Code</label>
                    <input 
                      type="text" 
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="700001"
                      className="w-full glass-input text-sm px-4 py-3"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Secure Simulated Payment</h2>
                    <p className="text-xs text-gray-500">Choose one of the simulated gateways below</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                      paymentMethod === 'card' 
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                      paymentMethod === 'upi' 
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI ID / QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                      paymentMethod === 'netbanking' 
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Netbanking</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                      paymentMethod === 'paypal' 
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>PayPal / Pay</span>
                  </button>
                </div>

                {/* Card Fields */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Card Number</label>
                      <input 
                        type="text" 
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                        placeholder="4111 2222 3333 4444"
                        className="w-full glass-input text-sm px-4 py-3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Expiry Date</label>
                        <input 
                          type="text" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                          placeholder="MM/YY"
                          className="w-full glass-input text-sm px-4 py-3 text-center"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Security CVV</label>
                        <input 
                          type="password" 
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                          placeholder="•••"
                          className="w-full glass-input text-sm px-4 py-3 text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Fields */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-5 animate-fade-in text-center">
                    <div className="space-y-2 text-left">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">UPI Address VPA</label>
                      <input 
                        type="text" 
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. user@ybl or user@okhdfc"
                        className="w-full glass-input text-sm px-4 py-3"
                      />
                    </div>
                    <div className="border border-white/5 rounded-2xl bg-white/[0.01] p-6 max-w-sm mx-auto flex flex-col items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-xl shadow-purple-500/5">
                        <QrCode className="w-36 h-36 text-gray-900" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Scan this code using any UPI enabled app (GPay, PhonePe, Paytm, BHIM) to simulate clearance instantly.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Netbanking Fields */}
                {paymentMethod === 'netbanking' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Select Bank</label>
                      <select 
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full glass-input text-sm px-4 py-3 bg-[#030712]"
                      >
                        <option value="">-- Choose Your Institution --</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                        <option value="pnb">Punjab National Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* PayPal Fields */}
                {paymentMethod === 'paypal' && (
                  <div className="animate-fade-in text-center py-6 space-y-4">
                    <Sparkles className="w-12 h-12 text-yellow-400 mx-auto animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold">Simulate One-Tap PayPal / Apple Pay clearance</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">No login required. The gateway will bypass prompt challenges and simulate standard authorization tokens.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/10 hover:shadow-purple-500/20 transition-all border border-purple-500/30 flex items-center justify-center gap-2 text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Secure Gateway Authentication...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Secure simulated checkout (${finalPrice.toFixed(2)})</span>
                  </>
                )}
              </button>
            </form>

            {/* Right side: Order Summary */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 bg-white/[0.01] space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h3 className="text-lg font-bold">Subscription Summary</h3>
                  <p className="text-xs text-gray-500">Confirm purchase plan details</p>
                </div>

                {/* Plan Badge Card */}
                <div className="flex items-center justify-between border border-white/5 rounded-2xl bg-white/[0.02] p-4">
                  <div>
                    <h4 className="font-extrabold text-lg text-purple-300">{plan.name}</h4>
                    <p className="text-xs text-gray-500">{plan.billingCycle} Subscription</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">${plan.price.toFixed(2)}</span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{plan.currency}</p>
                  </div>
                </div>

                {/* Apply Coupon Promo Code */}
                <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2">
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Have a promo code?</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Percent className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="ENTER COUPON CODE"
                        disabled={couponApplied}
                        className="w-full glass-input text-xs font-semibold !pl-10 !pr-4 py-3.5"
                      />
                    </div>
                    {couponApplied ? (
                      <button
                        type="button"
                        onClick={handleClearCoupon}
                        className="py-3 px-4 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all active:scale-95"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all border border-purple-400/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-400 font-semibold">{couponError}</p>
                  )}
                  {couponApplied && (
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                      <span>Coupon applied successfully!</span>
                    </p>
                  )}
                </form>

                {/* Pricing Line ledger */}
                <div className="border-t border-white/5 pt-5 space-y-3.5 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Base Price</span>
                    <span className="font-semibold text-white">${plan.price.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Promo Coupon Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Simulated Platform Fees</span>
                    <span className="font-semibold text-white">$0.00</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Tax Estimate (GST/VAT)</span>
                    <span className="font-semibold text-white">$0.00</span>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-baseline">
                    <span className="text-base font-bold">Total Amount Due</span>
                    <div className="text-right">
                      <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                        ${finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security footer disclaimer */}
                <div className="border-t border-white/5 pt-4">
                  <p className="text-[10px] text-gray-500 leading-relaxed text-center">
                    By confirming this checkout, you agree to our Simulated Terms of Service. Purchases processed here do not capture real financial credentials and are credited as instant sandbox overrides.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-gray-400 font-medium text-sm animate-pulse">Initializing billing transaction sandbox...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
