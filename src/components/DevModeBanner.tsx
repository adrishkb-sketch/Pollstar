'use client';

import React, { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';

export default function DevModeBanner() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    process.env.NODE_ENV === 'development';
    setIsDev(isLocal);
  }, []);

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-auto select-none">
      <div className="glass-card flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[9px] font-black uppercase tracking-widest shadow-lg">
        <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Dev Mode Active</span>
      </div>
    </div>
  );
}
