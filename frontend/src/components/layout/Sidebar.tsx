'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { LogOut } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const navItems = [
    { label: 'Home Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Family Pedigree', href: '/pedigree', icon: 'account_tree' },
    { label: 'AI Risk Analysis', href: '/risk-analysis', icon: 'genetics' },
    { label: 'Couple Assessment', href: '/couple-assessment', icon: 'diversity_1' },
    { label: 'Privacy & Security', href: '/privacy-security', icon: 'shield_lock' },
    { label: 'Patient Profile & Details', href: '/profile', icon: 'person_pin' },
  ];

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    router.push('/login');
  };

  return (
    <aside className="shrink-0 w-72 h-screen bg-surface-container-lowest z-40 flex flex-col justify-between py-6 px-4 border-r border-outline-variant/40 shadow-[0_1px_8px_rgba(12,50,44,0.04)] overflow-y-auto select-none">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-3 px-3 group">
          <div className="w-10 h-10 rounded-xl bg-pine flex items-center justify-center text-white shadow-[0_4px_12px_rgba(12,50,44,0.25)] group-hover:bg-pine-light transition-colors">
            <span className="material-symbols-outlined text-[24px] text-jungle">biotech</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-pine tracking-tight leading-none">GuardianAngel</span>
            </div>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">
              Hereditary Intelligence
            </span>
          </div>
        </Link>

        {/* Certified Node Badge */}
        <div className="px-3">
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center gap-3">
            <span className="material-symbols-outlined text-jungle text-[20px]">verified_user</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-pine">Clinical Pedigree Engine</span>
              <span className="text-[11px] text-on-surface-variant">v4.2 Certified Node • GCP Enclave</span>
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

      {/* Sidebar Bottom Trust Block */}
      <div className="flex flex-col gap-3 px-2 pt-4">
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Genomic Privacy</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jungle opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-jungle"></span>
            </span>
          </div>
          <p className="text-xs font-bold text-pine">Zero-Knowledge Hardware Vault</p>
          <p className="text-[11px] text-on-surface-variant leading-tight">
            Encrypted with 256-bit AES client keys. HIPAA & DPDP Act 2023 certified.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer w-full text-left"
        >
          <LogOut className="w-4 h-4 text-error" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
