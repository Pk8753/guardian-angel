'use client';

import * as React from 'react';

interface AuthErrorBannerProps {
  authError: string | null;
  authSuccess: string | null;
}

export function AuthErrorBanner({ authError, authSuccess }: AuthErrorBannerProps) {
  if (!authError && !authSuccess) return null;

  return (
    <>
      {authError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{authError}</span>
        </div>
      )}

      {authSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-[#30ba78]/30">
          <span className="material-symbols-outlined text-base text-[#30ba78]">check_circle</span>
          <span>{authSuccess}</span>
        </div>
      )}
    </>
  );
}

