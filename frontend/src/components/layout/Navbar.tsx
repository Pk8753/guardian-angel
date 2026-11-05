'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';

export function Navbar() {
  const router = useRouter();
  const { isSudoMode, toggleSudoMode, activeLocale, setActiveLocale } = useUIStore();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const displayName = isSudoMode
    ? user?.aliasName || 'Silent-Falcon-9214'
    : user?.fullName || 'Dr. Tariq Al-Mansoor';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(12,50,44,0.03)] flex items-center justify-between px-4 sm:px-8">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search bio-markers, pedigree IDs, family members..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-waterhole transition-all border border-outline-variant/30"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/30 text-[11px] font-bold">
          <button
            onClick={() => setActiveLocale('en')}
            className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${activeLocale === 'en' ? 'bg-pine text-white' : 'text-on-surface-variant'}`}
          >
            EN
          </button>
          <button
            onClick={() => setActiveLocale('ar')}
            className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${activeLocale === 'ar' ? 'bg-pine text-white' : 'text-on-surface-variant'}`}
          >
            العربية
          </button>
          <button
            onClick={() => setActiveLocale('hi')}
            className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${activeLocale === 'hi' ? 'bg-pine text-white' : 'text-on-surface-variant'}`}
          >
            हिन्दी
          </button>
        </div>

        {/* DATA HIDING / SUDO MODE TOGGLE */}
        <button
          type="button"
          onClick={toggleSudoMode}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer border ${
            isSudoMode
              ? 'bg-midnight text-white border-midnight-light'
              : 'bg-surface-container text-pine hover:bg-surface-container-high border-outline-variant/40'
          }`}
          title="Toggle Reddit-style pseudonym data hiding (HIPAA Zero-Knowledge)"
        >
          <span className={`material-symbols-outlined text-[16px] ${isSudoMode ? 'text-jungle' : 'text-on-surface-variant'}`}>
            {isSudoMode ? 'visibility_off' : 'visibility'}
          </span>
          <span className="hidden sm:inline">
            {isSudoMode ? (
              <>
                <span className="text-jungle font-mono font-bold">{user?.aliasName || 'Silent-Falcon-9214'}</span> (Masked)
              </>
            ) : (
              <>
                Data Hiding: <span className="text-on-surface-variant font-medium">OFF</span>
              </>
            )}
          </span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-pine transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-jungle"></span>
        </button>

        {/* User Identity Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 pl-2 py-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-bold text-pine leading-tight">{displayName}</span>
              <span className="text-[11px] text-jungle font-semibold leading-tight">
                {isSudoMode ? '🎭 Sudo Pseudonym' : 'Pro Member • Online'}
              </span>
            </div>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-pine flex items-center justify-center text-white shadow-sm font-semibold text-xs">
                {displayName.charAt(0)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-jungle ring-2 ring-white"></span>
            </div>
          </button>

          {/* User Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-outline-variant/40 py-2 z-50">
              <div className="px-4 py-2 border-b border-outline-variant/20">
                <p className="text-xs font-bold text-pine">{user?.fullName || 'Dr. Tariq Al-Mansoor'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-on-surface-variant">Sudo Alias:</span>
                  <span className="text-[10px] font-mono font-bold text-waterhole bg-waterhole-light px-1.5 py-0.5 rounded">
                    {user?.aliasName || 'Silent-Falcon-9214'}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">{user?.email || 'admin@guardianangel.bio'}</p>
              </div>

              <button
                type="button"
                onClick={() => { toggleSudoMode(); setIsDropdownOpen(false); }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-pine hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-waterhole">
                  {isSudoMode ? 'visibility' : 'visibility_off'}
                </span>
                <span>{isSudoMode ? 'Disable Data Hiding' : 'Enable Data Hiding (Sudo)'}</span>
              </button>

              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-waterhole">person</span>
                <span>Clinical Profile & Keys</span>
              </Link>

              <div className="border-t border-outline-variant/20 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

