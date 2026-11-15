'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { t } from '@/lib/translations';
import { LogOut, Settings } from 'lucide-react';
import { SettingsModal } from '@/components/settings/SettingsModal';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const { activeLocale, setSettingsModalOpen } = useUIStore();

  const navItems = [
    {
      label: t('nav_dashboard', activeLocale),
      mobileLabel: activeLocale === 'ar' ? 'الرئيسية' : 'Home',
      href: '/dashboard',
      icon: 'dashboard'
    },
    {
      label: t('nav_pedigree', activeLocale),
      mobileLabel: activeLocale === 'ar' ? 'الشجرة' : 'Tree',
      href: '/pedigree',
      icon: 'account_tree'
    },
    {
      label: t('nav_risk', activeLocale),
      mobileLabel: activeLocale === 'ar' ? 'المخاطر' : 'Risk',
      href: '/risk-analysis',
      icon: 'genetics'
    },
    {
      label: t('nav_couple', activeLocale),
      mobileLabel: activeLocale === 'ar' ? 'التوافق' : 'Couple',
      href: '/couple-assessment',
      icon: 'diversity_1'
    },
    {
      label: t('nav_privacy', activeLocale),
      mobileLabel: activeLocale === 'ar' ? 'الخزينة' : 'Vault',
      href: '/privacy-security',
      icon: 'shield_lock'
    },
    {
      label: t('nav_profile', activeLocale),
      mobileLabel: activeLocale === 'ar' ? 'الملف' : 'Profile',
      href: '/profile',
      icon: 'person_pin'
    },
  ];

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* ==================== DESKTOP SIDEBAR (Hidden on Mobile) ==================== */}
      <aside className="hidden md:flex shrink-0 w-64 lg:w-72 h-screen bg-surface-container-lowest z-40 flex-col justify-between py-6 px-4 border-r border-outline-variant/40 shadow-[0_1px_8px_rgba(12,50,44,0.04)] overflow-y-auto select-none">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <Link href="/dashboard" className="flex items-center gap-3 px-3 group">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-[#30ba78]/40 group-hover:scale-105 transition-transform">
              <img
                src="/static/screen/logo.png"
                alt="Guardian Angel Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-pine tracking-tight leading-none">
                  {t('brand_title', activeLocale)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">
                {t('brand_subtitle', activeLocale)}
              </span>
            </div>
          </Link>

          {/* Certified Node Badge */}
          <div className="px-3">
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center gap-3">
              <span className="material-symbols-outlined text-jungle text-[20px]">verified_user</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-pine">{t('engine_title', activeLocale)}</span>
                <span className="text-[11px] text-on-surface-variant">{t('engine_sub', activeLocale)}</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5 px-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-pine text-white font-bold shadow-[0_2px_8px_rgba(12,50,44,0.25)]'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-pine font-medium'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-jungle' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Trust Block & Controls */}
        <div className="flex flex-col gap-3 px-2 pt-4">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                {t('genomic_privacy', activeLocale)}
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jungle opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-jungle"></span>
              </span>
            </div>
            <p className="text-xs font-bold text-pine">{t('vault_title', activeLocale)}</p>
            <p className="text-[11px] text-on-surface-variant leading-tight">
              {t('vault_desc', activeLocale)}
            </p>
          </div>

          {/* Settings Window Button with Gear Logo (above signout) */}
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-pine hover:bg-surface-container rounded-lg transition-colors cursor-pointer w-full text-left border border-outline-variant/30 bg-white shadow-2xs"
          >
            <Settings className="w-4 h-4 text-pine" />
            <span>{t('settings_btn', activeLocale)}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer w-full text-left"
          >
            <LogOut className="w-4 h-4 text-error" />
            <span>{t('sign_out', activeLocale)}</span>
          </button>
        </div>

        {/* Global Settings Window Modal */}
        <SettingsModal />
      </aside>

      {/* ==================== MOBILE BOTTOM APP NAVIGATION BAR ==================== */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#16181b]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-1.5 py-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-all select-none"
      >
        <div className="grid grid-cols-6 items-center justify-around gap-0.5 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all relative group min-h-[48px] ${
                  isActive
                    ? 'text-teal-800 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                {/* Active Indicator Top Pill */}
                {isActive && (
                  <span className="absolute top-0 w-7 h-1 bg-teal-700 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(15,118,110,0.4)]" />
                )}

                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-transform ${
                    isActive ? 'scale-110' : 'group-active:scale-95'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'text-teal-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                </div>

                <span
                  className={`text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-full ${
                    isActive ? 'font-bold text-teal-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
