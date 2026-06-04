'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, Phone, Send, AlertTriangle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

function SmsTriggerContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const code = searchParams.get('code') || '';

  const [hasRedirected, setHasRedirected] = useState(false);

  const smsUri = `sms:${phone}?body=${encodeURIComponent(code)}`;

  useEffect(() => {
    if (phone && code && !hasRedirected) {
      setHasRedirected(true);
      // Automatically attempt to trigger SMS redirection
      window.location.href = smsUri;
    }
  }, [phone, code, smsUri, hasRedirected]);

  if (!phone || !code) {
    return (
      <div className="text-center space-y-4 max-w-md mx-auto p-6 bg-white/2 border border-white/5 rounded-2xl">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Invalid Verification Link</h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          The verification link does not contain a valid phone number or code. Please scan the QR code again or check your configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 max-w-md mx-auto p-8 bg-white/2 border border-white/5 rounded-3xl shadow-xl backdrop-blur-md">
      <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 w-fit mx-auto animate-pulse">
        <MessageSquare className="w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <h1 className="font-outfit text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Opening SMS Application
        </h1>
        <p className="text-xs text-gray-400 leading-relaxed">
          We are automatically opening your native message client with the pre-filled verification details.
        </p>
      </div>

      <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
        <div className="flex items-center space-x-2 text-xs">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Send To:</span>
          <span className="text-white font-bold">{phone}</span>
        </div>
        <div className="flex items-start space-x-2 text-xs border-t border-white/5 pt-3">
          <Send className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
          <div>
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] block">Message Body (Auto-filled):</span>
            <span className="text-emerald-400 font-mono font-bold select-all bg-emerald-500/10 px-2 py-0.5 rounded text-xs mt-1 inline-block">
              {code}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <a
          href={smsUri}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>📱 Open SMS App manually</span>
        </a>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          If your messaging app did not open automatically, click the button above. Ensure the message is sent exactly as pre-filled.
        </p>
      </div>
    </div>
  );
}

export default function SmsTriggerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-gray-200 justify-center items-center p-6 relative">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="mb-6 z-10">
        <BrandLogo iconSize={20} textSize="text-xl" />
      </div>

      <div className="w-full z-10">
        <Suspense fallback={
          <div className="text-center py-8">
            <span className="text-xs text-gray-500">Loading SMS redirection...</span>
          </div>
        }>
          <SmsTriggerContent />
        </Suspense>
      </div>
    </div>
  );
}
