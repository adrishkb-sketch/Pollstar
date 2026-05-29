'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert, RefreshCw, Lock } from 'lucide-react';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    // 1. Bypass check for admin pages entirely
    const bypassPaths = ['/admin', '/admin-login', '/api/admin'];
    const isBypassed = bypassPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );

    if (isBypassed) {
      setIsLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        // Fetch current user details to check if they are ADMIN
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && userData.user?.role === 'ADMIN') {
            setIsAdminUser(true);
            setIsMaintenance(false);
            setIsLoading(false);
            return;
          }
        }

        // Fetch general maintenance status
        const res = await fetch('/api/maintenance-status');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.maintenance_mode) {
            setIsMaintenance(true);
          }
        }
      } catch (err) {
        console.error('Failed to check maintenance status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [pathname]);

  // If loading the initial maintenance mode check, show a subtle loading spinner/backdrop
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] text-white">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-purple-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Verifying Connection...</span>
        </div>
      </div>
    );
  }

  // If maintenance mode is active (and not bypassed), render the premium upgrades screen
  if (isMaintenance && !isAdminUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] px-6 text-gray-100 overflow-y-auto min-h-screen py-10 font-sans">
        {/* Dynamic Abstract Dark Backgrounds */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="glass-card max-w-xl w-full border border-white/5 rounded-3xl p-8 bg-[#080d1a]/85 backdrop-blur-xl relative overflow-hidden shadow-2xl text-center space-y-8 flex flex-col items-center">
          {/* Header Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

          {/* Premium Glowing Icon Container */}
          <div className="p-5 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl text-purple-400 shadow-inner relative group mt-4">
            <ShieldAlert className="w-12 h-12" />
            <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all pointer-events-none" />
          </div>

          <div className="space-y-3">
            <h1 className="font-outfit text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2.5">
              <span>🔧 Scheduled Platform Maintenance</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
              We are currently conducting scheduled upgrades to optimize voting speed, bolster encryption keys, and refresh server packages. Standard operations will resume shortly. We appreciate your patience!
            </p>
          </div>

          {/* Micro-interactive upgrades checklist cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-2xl border border-white/5 bg-[#030712]/50 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">📊 Performance Metrics</span>
              <span className="text-xs text-gray-400">Deploying real-time WebSocket connection pools for ballot tickers.</span>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 bg-[#030712]/50 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">🔒 Security Fortifications</span>
              <span className="text-xs text-gray-400">Migrating active cryptography to secure hardware security modules.</span>
            </div>
          </div>

          {/* Footer Action to Admin portal with micro-animation */}
          <div className="pt-4 border-t border-white/5 w-full flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              <span>Restricted System Mode</span>
            </div>
            <a
              href="/admin-login"
              className="px-4 py-2 border border-purple-500/20 text-purple-400 bg-purple-500/5 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <span>Administrator Portal</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
