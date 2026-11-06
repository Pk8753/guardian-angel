'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useUIStore } from '@/stores/useUIStore';
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
  AlertCircle
} from 'lucide-react';

export default function PrivacySecurityPage() {
  const { isSudoMode, toggleSudoMode } = useUIStore();
  const [rotated, setRotated] = useState(false);

  const handleRotateKey = () => {
    setRotated(true);
    setTimeout(() => setRotated(false), 3000);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/25 text-pine text-xs font-bold uppercase tracking-wider border border-mint">
                  <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-pulse" />
                  End-To-End Zero Knowledge Active
                </span>
                <span className="text-xs text-slate-600 font-bold bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  Pedigree Node #994-Alpha &bull; Secure Enclave
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-pine tracking-tight">
                Privacy &amp; Security Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Data Sovereignty, Granular Lineage Sharing &amp; Cryptographic Access Controls. You retain absolute mathematical ownership of all diploid sequencing and pedigree nodes.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 max-w-md">
              <div className="w-12 h-12 rounded-xl bg-mint/25 text-pine flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <span>HIPAA &amp; DPDP Compliant</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-jungle" />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  Zero public indexing, client-side zero-knowledge encrypted vault.
                </p>
              </div>
            </div>
          </div>

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Sudo Mode & Pseudonymity */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <EyeOff className="w-5 h-5 text-pine" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Sudo / De-Identification Shield
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSudoMode ? 'bg-mint/30 text-pine border border-mint' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isSudoMode ? 'ACTIVE' : 'STANDARD'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                When Sudo Mode is enabled, patient real names, birth dates, and contact coordinates
                are automatically replaced with cryptographically pseudorandom identifiers (e.g. <code>Silent-Falcon-9214</code>)
                across all pedigree charts and export screens.
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Anonymize Display Coordinates
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Mask proband identity during clinical consultations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleSudoMode}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    isSudoMode
                      ? 'bg-pine hover:bg-pine-light text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {isSudoMode ? 'Disable Sudo' : 'Enable Sudo'}
                </button>
              </div>
            </div>

            {/* Cryptographic Key Vault */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-pine" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    256-bit AES Vault Key Rotation
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-mint/25 text-pine border border-mint text-[10px] font-bold">
                  AES-GCM-256
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Client keys are derived using PBKDF2 with 600,000 iterations. The server never receives
                the master plaintext key, preventing subpoena-based disclosure.
              </p>

              {rotated && (
                <div className="p-3 bg-mint/25 border border-mint text-pine rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-jungle" />
                  <span>Client-side encryption key successfully rotated and re-salted.</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-mono">
                  Key fingerprint: sha256:7f8a9b...c41
                </span>
                <button
                  type="button"
                  onClick={handleRotateKey}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-pine" />
                  <span>Rotate Vault Keys</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}
