'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Double check cookie
    const hasCookie = document.cookie.includes('ga_auth_session=1');
    if (!isAuthenticated && !hasCookie) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Before mounting or if unauthenticated, show clinical redirect indicator
  if (!mounted || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3 font-sans">
        <div className="w-9 h-9 border-3 border-teal-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          Verifying Clinical Authentication...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

