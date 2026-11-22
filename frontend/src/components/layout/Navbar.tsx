'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { t } from '@/lib/translations';
import { Sun, Moon, Settings, Sparkles } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const {
    isSudoMode,
    toggleSudoMode,
    activeLocale,
    setActiveLocale,
    isDarkMode,
    toggleDarkMode,
    setSettingsModalOpen,
    viewMode,
    setViewMode,
    isCareAIOpen,
    toggleCareAIOpen
  } = useUIStore();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const realName = user?.fullName || user?.username || 'Patient';
  const aliasName = user?.aliasName || 'Anonymous-Patient';
  const displayName = isSudoMode ? aliasName : realName;
  const initialChar = (displayName || user?.username || 'P').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#16181b]/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(12,50,44,0.03)] flex items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
      {/* Mobile Brand Icon (when Sidebar is collapsed) */}
      <Link href="/dashboard" className="md:hidden flex items-center gap-2 group shrink-0" title="GuardianAngel">
        <div className="w-8 h-8 rounded-xl bg-pine flex items-center justify-center text-white shadow-xs group-hover:bg-pine-light transition-colors">
          <span className="material-symbols-outlined text-[20px] text-jungle">biotech</span>
        </div>
      </Link>

      {/* Left-side Controls: Language Selector & Theme Toggle (Moved from right side, replacing search) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 rtl:left-auto rtl:right-3 rtl:pl-4 rtl:pr-9">
        {/* Language Selector: USA English & UAE Arabic (Shown on desktop, available in dropdown on mobile) */}
        <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 bg-surface-container-low px-1.5 sm:px-2 py-1 rounded-full border border-outline-variant/30 text-[11px] font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveLocale('en')}
            className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${
              activeLocale === 'en'
                ? 'bg-pine text-white shadow-xs'
                : 'text-on-surface-variant hover:text-pine'
            }`}
            title="USA English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setActiveLocale('ar')}
            className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${
              activeLocale === 'ar'
                ? 'bg-pine text-white shadow-xs'
                : 'text-on-surface-variant hover:text-pine'
            }`}
            title="UAE Arabic (العربية)"
          >
            العربية
          </button>
        </div>

        {/* Dark / Light Mode Sun & Moon Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-pine transition-all cursor-pointer border border-outline-variant/20 shrink-0"
          title={isDarkMode ? t('switch_light', activeLocale) : t('switch_dark', activeLocale)}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
          )}
        </button>
      </div>

      {/* DUAL-LENS PERSONA TOGGLE (Patient vs Provider View) - Shown on both Mobile & Desktop */}
      <div className="flex items-center gap-0.5 bg-surface-container-low p-0.5 sm:p-1 rounded-full border border-outline-variant/40 shadow-2xs text-[10px] sm:text-[11px] font-bold shrink-0">
        <button
          type="button"
          onClick={() => setViewMode('patient')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full cursor-pointer transition-all ${
            viewMode === 'patient'
              ? 'bg-teal-700 text-white shadow-xs font-extrabold'
              : 'text-on-surface-variant hover:text-teal-800'
          }`}
          title="Switch to Patient / Plain-English View"
        >
          <span className="text-xs">👤</span>
          <span className="text-[10px] sm:text-xs">Patient</span>
          <span className="hidden sm:inline">View</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('provider')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full cursor-pointer transition-all ${
            viewMode === 'provider'
              ? 'bg-slate-900 text-white shadow-xs font-extrabold'
              : 'text-on-surface-variant hover:text-slate-900'
          }`}
          title="Switch to Clinical Provider / Genetics Specialist View"
        >
          <span className="text-xs">🩺</span>
          <span className="text-[10px] sm:text-xs">Provider</span>
          <span className="hidden sm:inline">View</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* AI Star Icon Button (Launches Ask Care AI Chatbot Popup) */}
        <button
          type="button"
          onClick={toggleCareAIOpen}
          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border shrink-0 shadow-xs group ${
            isCareAIOpen
              ? 'bg-mint text-pine border-jungle ring-2 ring-jungle/40 scale-105'
              : 'bg-pine hover:bg-pine-light text-white border-pine-light/40 hover:scale-105'
          }`}
          title="Ask Care AI — Clinical Genetics & Screening Assistant"
          aria-label="Ask Care AI"
        >
          <Sparkles className={`w-4 h-4 transition-transform group-hover:rotate-12 ${isCareAIOpen ? 'text-pine' : 'text-jungle'}`} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-jungle rounded-full border-2 border-white animate-pulse" />
        </button>

        {/* PRIVACY TOGGLE BUTTON */}
        <button
          type="button"
          onClick={toggleSudoMode}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer border shrink-0 ${
            isSudoMode
              ? 'bg-midnight text-white border-midnight-light'
              : 'bg-surface-container text-pine hover:bg-surface-container-high border-outline-variant/40'
          }`}
          title="Toggle HIPAA Zero-Knowledge Privacy Sudo Mode"
        >
          <span className={`material-symbols-outlined text-[16px] ${isSudoMode ? 'text-jungle' : 'text-on-surface-variant'}`}>
            {isSudoMode ? 'visibility_off' : 'visibility'}
          </span>
          <span className="hidden lg:inline">
            {isSudoMode ? (
              <>
                {t('privacy_label', activeLocale)}{' '}
                <span className="text-jungle font-mono font-bold">ON</span>
              </>
            ) : (
              <>
                {t('privacy_label', activeLocale)}{' '}
                <span className="text-on-surface-variant font-medium">OFF</span>
              </>
            )}
          </span>
        </button>

        {/* User Identity Chip */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-1 sm:pl-2 py-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <div className="flex flex-col text-end hidden sm:flex">
              <span className="text-xs font-bold text-pine leading-tight">{displayName}</span>
              <span className="text-[11px] text-jungle font-semibold leading-tight">
                {isSudoMode ? t('sudo_pseudonym', activeLocale) : `@${user?.username || 'user'} • Online`}
              </span>
            </div>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-pine flex items-center justify-center text-white shadow-sm font-semibold text-xs">
                {initialChar}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 rtl:-right-auto rtl:-left-0.5 w-2.5 h-2.5 rounded-full bg-jungle ring-2 ring-white"></span>
            </div>
          </button>

          {/* User Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white dark:bg-[#1c1f24] rounded-xl shadow-xl border border-outline-variant/40 py-2 z-50 text-start">
              <div className="px-4 py-2 border-b border-outline-variant/20">
                <p className="text-xs font-bold text-pine">{realName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-on-surface-variant font-medium">@{user?.username || 'user'}</span>
                  <span className="text-[10px] font-mono font-bold text-waterhole bg-waterhole-light px-1.5 py-0.5 rounded">
                    {aliasName}
                  </span>
                </div>
                {user?.email && (
                  <p className="text-[10px] text-on-surface-variant mt-1 truncate">{user.email}</p>
                )}
              </div>

              {/* Mobile View Mode Switcher (Patient vs Provider View) */}
              <div className="sm:hidden px-4 py-2 border-b border-outline-variant/20">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  View Mode
                </span>
                <div className="grid grid-cols-2 gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('patient');
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                      viewMode === 'patient'
                        ? 'bg-teal-700 text-white shadow-xs font-bold'
                        : 'text-on-surface-variant hover:text-teal-800'
                    }`}
                  >
                    <span>👤</span>
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('provider');
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                      viewMode === 'provider'
                        ? 'bg-slate-900 text-white shadow-xs font-bold'
                        : 'text-on-surface-variant hover:text-slate-900'
                    }`}
                  >
                    <span>🩺</span>
                    <span>Provider</span>
                  </button>
                </div>
              </div>

              {/* Mobile Language Switcher (Visible in dropdown on small screens) */}
              <div className="sm:hidden px-4 py-2 border-b border-outline-variant/20 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Language</span>
                <div className="flex items-center gap-1 bg-surface-container-low px-1.5 py-0.5 rounded-lg border border-outline-variant/30 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveLocale('en')}
                    className={`px-2 py-0.5 rounded ${activeLocale === 'en' ? 'bg-pine text-white' : 'text-on-surface-variant'}`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLocale('ar')}
                    className={`px-2 py-0.5 rounded ${activeLocale === 'ar' ? 'bg-pine text-white' : 'text-on-surface-variant'}`}
                  >
                    العربية
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { toggleSudoMode(); setIsDropdownOpen(false); }}
                className="w-full text-start flex items-center gap-2.5 px-4 py-2 text-xs text-pine hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-waterhole">
                  {isSudoMode ? 'visibility' : 'visibility_off'}
                </span>
                <span>{isSudoMode ? t('disable_privacy', activeLocale) : t('enable_privacy', activeLocale)}</span>
              </button>

              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-waterhole">person</span>
                <span>{t('clinical_profile', activeLocale)}</span>
              </Link>

              <div className="border-t border-outline-variant/20 mt-1 pt-1">
                {/* Settings Option with Gear Logo (above signout) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setSettingsModalOpen(true);
                  }}
                  className="w-full text-start flex items-center gap-2.5 px-4 py-2 text-xs text-pine hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-pine" />
                  <span>{t('settings_btn', activeLocale)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full text-start flex items-center gap-2.5 px-4 py-2 text-xs text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>{t('sign_out', activeLocale)}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
