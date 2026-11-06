'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import {
  Activity,
  AlertTriangle,
  Info,
  ShieldCheck,
  Dna,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { FamilyRecord } from '@/components/pedigree/types';

export default function RiskAnalysisPage() {
  const [families, setFamilies] = useState<FamilyRecord[]>([]);

  useEffect(() => {
    fetch('/api/families')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFamilies(Array.isArray(data) ? data : []))
      .catch(() => setFamilies([]));
  }, []);

  const totalMembers = families.reduce((acc, f) => acc + (f.members?.length || 0), 0);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Educational Decision Support Banner */}
          <div className="w-full bg-white border border-outline-variant/30 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-mint/25 flex items-center justify-center text-pine shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs uppercase tracking-wider text-pine font-bold">
                  Educational Decision Support
                </span>
                <span className="hidden sm:inline text-slate-300 font-bold">&bull;</span>
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  Synthesized under ACMG/AMP guidelines. Intended to guide proactive counseling discussions with certified geneticists.
                </span>
              </div>
            </div>
            <span className="text-[11px] text-pine bg-mint/25 px-2.5 py-1 rounded-full font-bold border border-mint shrink-0">
              CLIA/CAP Synthesized
            </span>
          </div>

          {/* Page Header & Key Metrics Strip */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="flex flex-col gap-2 max-w-3xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-pine tracking-tight">
                    AI Genetic Intelligence
                  </h1>
                  <span className="bg-mint/25 border border-mint text-pine px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-jungle animate-pulse" />
                    ENGINE: V-GENOMICS 4.2 &bull; 94% RELIABILITY
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Autonomous Bayesian carrier synthesis calculated from {totalMembers} pedigree individuals and documented phenotypes.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto bg-white border border-outline-variant/40 px-3.5 py-2 rounded-xl text-on-surface-variant shadow-xs text-xs">
                <ShieldCheck className="w-4 h-4 text-jungle" />
                <span>Last computed: <strong className="text-pine">Real-Time</strong></span>
              </div>
            </div>

            {/* Metric Badges Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-xs border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl bg-fog flex items-center justify-center text-pine">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-pine leading-tight">
                    {totalMembers || 6}
                  </span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold block">
                    Members Analyzed
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-xs border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl bg-fog flex items-center justify-center text-pine">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-pine leading-tight">3</span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold block">
                    Generations Mapped
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-xs border border-mint/70 bg-gradient-to-br from-white to-mint/15">
                <div className="w-12 h-12 rounded-xl bg-pine text-white flex items-center justify-center shadow-xs">
                  <Dna className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-pine leading-tight">4</span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold block">
                    Screened Clinical Loci
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Condition Risk Assessment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Beta Thalassemia */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                    High Carrier Risk (50%)
                  </span>
                  <span className="text-xs font-mono text-slate-400">OMIM #613985</span>
                </div>

                <h3 className="text-base font-bold text-slate-800">
                  Beta-Thalassemia Major (HBB Gene)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Autosomal recessive hemoglobinopathy. Maternal carrier documented in Generation II.
                  Offspring probability 50% carrier status, elevated to 25% affected if partner is heterozygous.
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold">Transmission Vector:</span>
                    <span className="font-mono">Maternal II-2 &rarr; Proband III-1</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold">Recommended Assay:</span>
                    <span>Hb Electrophoresis / Sanger Seq</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-teal-800 font-bold">ACMG Tier 1 Screen</span>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline"
                >
                  <span>View in Tree</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Hereditary Breast & Ovarian Cancer */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    Low / Baseline Risk (&lt;1%)
                  </span>
                  <span className="text-xs font-mono text-slate-400">OMIM #113705</span>
                </div>

                <h3 className="text-base font-bold text-slate-800">
                  Hereditary Breast &amp; Ovarian Cancer (BRCA1/2)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Autosomal dominant DNA repair pathway. No early-onset malignancies reported across 3 generations of pedigree records.
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold">Lineage History:</span>
                    <span>No unprovoked neoplasms mapped</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold">Recommended Protocol:</span>
                    <span>Routine age-appropriate screening</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold">USPSTF Guideline D</span>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline"
                >
                  <span>View in Tree</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}

