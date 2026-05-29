'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Check } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

interface DashboardHeaderProps {
  user: any;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/profile', label: 'My Profile' },
    { href: '/dashboard/gradebook', label: '📊 Gradebook' },
    { href: '/dashboard/plans', label: 'Plans & Features' },
    { href: '/dashboard/earnings', label: '💰 Earnings & Referrals' },
    { href: '/dashboard/notices', label: '📣 Announcements' },
  ];

  return (
    <>
      <header className="w-full border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard">
              <BrandLogo iconSize={22} textSize="text-xl" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'text-white bg-indigo-600/90 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Profile & Logout */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-white flex items-center justify-end gap-1.5">
                {user?.fullName || user?.email}
                {user?.isVerifiedUser && (
                  <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full" title="Verified Creator">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </span>
                )}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                {user?.role === 'ADMIN' ? '👑 SYSTEM ADMIN' : 'CREATOR'}
              </span>
            </div>

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:text-white transition-all"
              >
                Admin Control
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-3">
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:text-white transition-all"
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Container */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full border-t border-white/5 bg-[#080d1a] px-6 py-4 space-y-4 animate-fade-in">
            {/* User Profile Summary */}
            <div className="pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Logged in as</span>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5 mt-1">
                {user?.fullName || user?.email}
                {user?.isVerifiedUser && (
                  <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </span>
                )}
              </span>
              <span className="text-[10px] text-indigo-400 font-bold block mt-0.5">
                {user?.role === 'ADMIN' ? '👑 SYSTEM ADMIN' : 'CREATOR'}
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-1.5">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all block ${
                      isActive
                        ? 'text-white bg-indigo-600/90 shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all pt-2.5 border-t border-white/5"
            >
              <span>Sign Out Account</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Global Under-Development Callout Banner */}
      <div className="w-full bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-b border-amber-500/10 py-2 px-6 animate-pulse-glow">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-semibold text-amber-300">
          <div className="flex items-center gap-2">
            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] animate-bounce">⚠️</span>
            <span>
              <strong>Portal under development:</strong> If you face any errors, please report it under <strong className="text-white">"Raise Issue"</strong> (red floating button at bottom right).
            </span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold uppercase sm:text-right shrink-0">
            We will solve them ASAP • Thank you for your cooperation!
          </span>
        </div>
      </div>
    </>
  );
}

