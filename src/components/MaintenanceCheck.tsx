'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Loader2 } from 'lucide-react';

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/maintenance-status');
        if (res.ok) {
          const data = await res.json();
          setMaintenance(data.maintenance);
          setIsAdmin(data.isAdmin);
        }
      } catch (err) {
        console.error('Failed to check maintenance status:', err);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-xs mt-3 font-semibold">Configuring environment...</span>
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-outfit">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="glass-card rounded-3xl border border-white/10 p-8 max-w-md w-full bg-[#080d1a]/85 backdrop-blur-md relative shadow-2xl space-y-6">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 mx-auto w-fit">
            <Settings className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-2xl font-black text-white">Scheduled Maintenance</h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
              Pollstar is currently undergoing database optimizations and structural upgrades to make your interactive sessions even faster and more secure. We will be back online shortly!
            </p>
          </div>
          <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-[10px] text-purple-300 font-mono">
            Status: System Gated Lockdown
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
