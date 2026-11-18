'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { t } from '@/lib/translations';
import { Sun, Moon, Settings, LogOut, Heart, Stethoscope, ShieldCheck, Home } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isSudoMode,
    toggleSudoMode,
    activeLocale,
    setActiveLocale,
    isDarkMode,
    toggleDarkMode,
    setSettingsModalOpen,
    viewMode,
    setViewMode
  } = useUIStore();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const isProvider = user?.role === 'provider' || user?.isAdmin;

  React.useEffect(() => {
    if (user && user.role !== 'provider' && !user.isAdmin && viewMode !== 'patient') {
      setViewMode('patient');
    }
  }, [user, viewMode, setViewMode]);

  const realName = user?.fullName || user?.username || 'Patient';
  const aliasName = user?.aliasName || 'Anonymous-Patient';
  const displayName = isSudoMode ? aliasName : realName;
  const initialChar = (displayName || user?.username || 'P').charAt(0).toUpperCase();

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  // 4 Top Navigation Tabs for Patients
  const patientTabs = [
    { href: '/dashboard', label: activeLocale === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
    { href: '/couple-assessment', label: activeLocale === 'ar' ? 'فحص الزوجين' : 'Couple Check', icon: Heart },
    { href: '/counselors', label: activeLocale === 'ar' ? 'المستشارون' : 'Counselors', icon: Stethoscope },
    { href: '/privacy-profile', label: activeLocale === 'ar' ? 'الخصوصية والملف' : 'Privacy & Profile', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#16181b]/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(12,50,44,0.03)] flex items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
      {/* Brand Icon & Title */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0" title="Guardian Angel">
        <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-mint group-hover:scale-105 transition-transform">
          <img
            src="/static/screen/logo.png"
            alt="Guardian Angel Logo"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold text-pine tracking-tight leading-none">
            {t('brand_title', activeLocale)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
            {isProvider ? 'Clinical Console' : 'Family Health'}
          </span>
        </div>
      </Link>

      {/* Patient View: Desktop Top 4-Tab Navigation */}
      {!isProvider ? (
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 text-xs font-bold">
          {patientTabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'bg-pine text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-pine hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-mint' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : (
        /* Provider View: Clinical Search Bar */
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs lg:max-w-md ml-4">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={t('search_placeholder', activeLocale)}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 text-start py-1.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-waterhole transition-all border border-outline-variant/30"
            />
          </div>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Provider Switcher Toggle (strictly hidden from patients) */}
        {isProvider && (
          <div className="flex items-center gap-0.5 bg-surface-container-low p-1 rounded-full border border-outline-variant/40 shadow-2xs text-[11px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('patient')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full cursor-pointer transition-all ${
                viewMode === 'patient'
                  ? 'bg-teal-700 text-white shadow-xs font-extrabold'
                  : 'text-on-surface-variant hover:text-teal-800'
              }`}
              title="Switch to Patient / Plain-English View"
            >
              <span className="text-xs">👤</span>
              <span className="text-xs">Patient</span>
              <span className="hidden sm:inline">View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('provider')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full cursor-pointer transition-all ${
                viewMode === 'provider'
                  ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                  : 'text-on-surface-variant hover:text-slate-900'
              }`}
              title="Switch to Clinical Provider / Genetics Specialist View"
            >
              <span className="text-xs">🩺</span>
              <span className="text-xs">Provider</span>
              <span className="hidden sm:inline">View</span>
            </button>
          </div>
        )}

        {/* Language Switcher: EN / العربية */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/80 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveLocale('en')}
            className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
              activeLocale === 'en'
                ? 'bg-pine text-white shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-pine'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setActiveLocale('ar')}
            className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
              activeLocale === 'ar'
                ? 'bg-pine text-white shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-pine'
            }`}
            title="العربية"
          >
            العربية
          </button>
        </div>

        {/* Provider-only Privacy Sudo Mode button */}
        {isProvider && (
          <button
            type="button"
            onClick={toggleSudoMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer border shrink-0 ${
              isSudoMode
                ? 'bg-midnight text-white border-midnight-light'
                : 'bg-surface-container text-pine hover:bg-surface-container-high border-outline-variant/40'
            }`}
            title="Toggle HIPAA Zero-Knowledge Privacy Sudo Mode"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSudoMode ? 'text-jungle' : 'text-on-surface-variant'}`}>
              {isSudoMode ? 'visibility_off' : 'visibility'}
            </span>
            <span className="hidden lg:inline text-[11px]">Sudo</span>
          </button>
        )}

        {/* User Identity Chip & Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-1 sm:pl-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex flex-col text-end hidden sm:flex">
              <span className="text-xs font-bold text-pine leading-tight">{realName}</span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight">
                {isProvider ? 'Clinical Provider' : 'Patient Vault'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-pine flex items-center justify-center text-white shadow-xs font-bold text-xs">
              {initialChar}
            </div>
          </button>

          {/* User Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-[#1c1f24] rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-start">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-pine">{realName}</p>
                {user?.email && (
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                )}
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-mint/30 text-pine text-[10px] font-bold">
                  {isProvider ? 'Provider Account' : 'Patient Account'}
                </span>
              </div>

              {!isProvider ? (
                <Link
                  href="/privacy-profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-pine" />
                  <span>Privacy &amp; Profile</span>
                </Link>
              ) : (
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-pine" />
                  <span>Provider Settings</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
