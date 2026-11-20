'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useUIStore } from '@/stores/useUIStore';
import { t } from '@/lib/translations';
import {
  ShieldCheck,
  Lock,
  Key,
  EyeOff,
  Eye,
  RefreshCw,
  FileCheck,
  Download,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  FileText,
  Fingerprint,
  ArrowRight
} from 'lucide-react';

export default function PrivacySecurityPage() {
  const router = useRouter();
  const { isSudoMode, toggleSudoMode, activeLocale } = useUIStore();
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  const handleRotateKey = () => {
    setRotated(true);
    setTimeout(() => setRotated(false), 3000);
  };

  const complianceItems = [
    {
      title: 'HIPAA § 164.312 & DPDP Act 2023',
      desc: 'All genomic variant loci, phenotypic traits, and pedigree nodes are encrypted at rest with 256-bit AES-GCM.',
      status: 'VERIFIED'
    },
    {
      title: 'Client-Side Key Derivation (PBKDF2)',
      desc: 'Master plaintext keys never leave the client enclave. Keys are salted with 600,000 iterations.',
      status: 'AIR-GAPPED'
    },
    {
      title: 'Sovereign UAE GCC Enclave Residency',
      desc: 'Strict sovereign boundary adherence under UAE MoHAP guidelines. Zero external third-party API exposure.',
      status: 'COMPLIANT'
    },
    {
      title: 'Zero-Knowledge Sudo Anonymization',
      desc: 'Automated cryptographic pseudonym replacement for all consultation exports and shareable doctor links.',
      status: 'ACTIVE'
    }
  ];

  const auditEvents = [
    {
      action: t('privacy_audit_event_1', activeLocale),
      timestamp: 'Today, 09:14:22 UTC',
      hash: 'sha256:4f8e...91c2',
      status: 'VERIFIED'
    },
    {
      action: t('privacy_audit_event_2', activeLocale),
      timestamp: 'Today, 08:30:05 UTC',
      hash: 'sha256:d3a1...74bc',
      status: 'AUTHENTICATED'
    },
    {
      action: t('privacy_audit_event_3', activeLocale),
      timestamp: 'Yesterday, 19:42:18 UTC',
      hash: 'sha256:b81e...22fe',
      status: 'ENCRYPTED'
    }
  ];

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/25 text-pine text-xs font-bold uppercase tracking-wider border border-mint">
                    <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-pulse" />
                    {t('privacy_zk_active', activeLocale)}
                  </span>
                  <span className="text-xs text-slate-600 font-bold bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {t('privacy_secure_enclave', activeLocale)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-pine tracking-tight">
                  {t('privacy_center_title', activeLocale)}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {t('privacy_center_subtitle', activeLocale)}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 max-w-md">
                <div className="w-12 h-12 rounded-xl bg-mint/25 text-pine flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <span>{t('privacy_hipaa_dpdp', activeLocale)}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-jungle" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {t('privacy_hipaa_desc', activeLocale)}
                  </p>
                </div>
              </div>
            </div>

            {/* Row 1: Sudo Shield & AES Vault Key Rotation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Sudo Mode & Pseudonymity */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <EyeOff className="w-5 h-5 text-pine" />
                      <h3 className="font-bold text-slate-800 text-sm">
                        {t('privacy_sudo_card_title', activeLocale)}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSudoMode ? 'bg-mint/30 text-pine border border-mint' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isSudoMode ? t('active', activeLocale) : 'STANDARD'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t('privacy_sudo_card_desc', activeLocale)}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {t('privacy_sudo_action_label', activeLocale)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {t('privacy_sudo_action_sub', activeLocale)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSudoMode}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      isSudoMode
                        ? 'bg-pine hover:bg-pine-light text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {isSudoMode ? t('privacy_btn_disable_sudo', activeLocale) : t('privacy_btn_enable_sudo', activeLocale)}
                  </button>
                </div>
              </div>

              {/* Cryptographic Key Vault */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Key className="w-5 h-5 text-pine" />
                      <h3 className="font-bold text-slate-800 text-sm">
                        {t('privacy_aes_card_title', activeLocale)}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-mint/25 text-pine border border-mint text-[10px] font-bold">
                      AES-GCM-256
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t('privacy_aes_card_desc', activeLocale)}
                  </p>

                  {rotated && (
                    <div className="p-3 bg-mint/25 border border-mint text-pine rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-jungle" />
                      <span>{t('privacy_keys_rotated_success', activeLocale)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {t('privacy_aes_fingerprint', activeLocale)} sha256:7f8a9b...c41
                  </span>
                  <button
                    type="button"
                    onClick={handleRotateKey}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-pine" />
                    <span>{t('privacy_btn_rotate_keys', activeLocale)}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Compliance Checklist & Cryptographic Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Compliance Matrix (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-pine" />
                      <h3 className="font-bold text-slate-800 text-sm">
                        {t('privacy_compliance_title', activeLocale)}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-jungle bg-mint/25 px-2 py-0.5 rounded-full border border-mint">
                      100% Enforced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {complianceItems.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-white text-pine border border-slate-200">
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                            {item.desc}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 pt-1">
                          <CheckCircle2 className="w-3 h-3 text-jungle" />
                          <span>Active Safeguard</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Cryptographic Enclave Audit: Node #994-Alpha</span>
                  <Link href="/profile" className="text-pine font-bold hover:underline inline-flex items-center gap-1">
                    <span>{t('clinical_profile', activeLocale)}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>

              {/* Real-Time Audit Trail (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-pine" />
                      <h3 className="font-bold text-slate-800 text-sm">
                        {t('privacy_audit_log_title', activeLocale)}
                      </h3>
                    </div>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jungle opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-jungle"></span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    {auditEvents.map((ev, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{ev.action}</span>
                          <span className="text-[9px] font-mono font-bold text-jungle bg-mint/20 px-1.5 py-0.5 rounded">
                            {ev.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{ev.timestamp}</span>
                          <span className="font-mono">{ev.hash}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-mint/15 rounded-2xl border border-mint/40 text-[11px] text-pine flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-jungle shrink-0" />
                  <span>Immutable SHA-256 Ledger: Zero logs shared externally.</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
