'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [checking, setChecking] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkProfileCompleted = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        
        // Check if user is suspended or banned
        if (data.user.isBanned) {
          router.push('/login');
          return;
        }

        if (data.user.isSuspended) {
          const isStillSuspended = !data.user.suspensionUntil || new Date() < new Date(data.user.suspensionUntil);
          if (isStillSuspended) {
            router.push('/login');
            return;
          }
        }

        setProfileCompleted(data.user.profileCompleted);

        if (!data.user.profileCompleted) {
          router.push('/onboarding');
        }
      } catch (err) {
        console.error('Dashboard Layout session check error:', err);
      } finally {
        setChecking(false);
      }
    };
    checkProfileCompleted();
  }, []);


  if (checking) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Verifying credentials...</span>
      </div>
    );
  }

  // Only render children if profile is completed or if they are in onboarding (but onboarding is outside dashboard)
  if (profileCompleted === false) {
    return null; // Prevents flashing dashboard content before redirect
  }

  return <>{children}</>;
}
