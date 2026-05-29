'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DevelopmentSandboxAlert() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the alert
    const dismissed = localStorage.getItem('development_sandbox_alert_dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('development_sandbox_alert_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 border-b border-amber-500/20 text-amber-200 relative overflow-hidden py-3 px-6 z-40 transition-all font-sans text-xs">
      <div className="absolute inset-0 bg-amber-500/[0.02] animate-pulse pointer-events-none" />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 bg-amber-500/20 rounded-md text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <span className="font-semibold text-[11px] sm:text-xs leading-relaxed">
            🚧 Development Mode: Pollstar is actively in development. If you encounter any bugs, please report them to support so we can get them resolved instantly!
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-amber-400/60 hover:text-amber-200 hover:bg-white/5 transition-all focus:outline-none shrink-0"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
