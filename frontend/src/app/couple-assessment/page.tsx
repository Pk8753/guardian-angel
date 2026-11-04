'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import {
  Heart,
  ShieldCheck,
  Download,
  Stethoscope,
  AlertTriangle,
  GitMerge,
  Info,
  CheckCircle2,
  Dna,
  ArrowRight
} from 'lucide-react';

export default function CoupleAssessmentPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold tracking-wider uppercase border border-teal-200">
                  Pre-Conception Genomic Node
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-slate-500 text-xs font-mono">CRYPT-ID: #CP-8492</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Couple Hereditary Assessment &mdash; Kabir Sharma &amp; Ananya Verma
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Pre-conception dual-lineage genomic synthesis &bull; Synchronized pedigree cross-analysis against 3,240 autosomal variant pathways.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-teal-800" />
                <span>Export Clinical Brief</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Session scheduled with Medical Genetics Board.')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs transition"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Review with Geneticist</span>
              </button>
            </div>
          </div>

          {/* Clinical Protocol Recommendation Banner */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-800 flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  Clinical Recommendation &bull; Guideline Tier 2
                </span>
                <span className="text-xs text-teal-800 font-bold">Standard Protocol (ACMG / SHG)</span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Target Carrier Sanger Sequencing Advised for Partner A. Identified compound variant pathway
                supports non-invasive counseling and routine carrier screening with 25% homozygous risk
                if both partners carry concordant HBB alleles.
              </p>
            </div>
          </div>

          {/* 3-Column Comparative Genetic Synthesis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Partner A */}
            <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                      KS
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Kabir Sharma</h4>
                      <p className="text-[11px] text-slate-500">Age 29 &bull; Index Proband (Partner A)</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                    Pedigree: #F-000123
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Carrier Findings</span>
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">HBB (Beta-Thalassemia)</span>
                      <span className="px-1.5 py-0.5 bg-amber-200/60 text-amber-800 font-mono text-[10px] rounded">
                        c.92+5G&gt;C
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Heterozygous carrier verified via NGS variant panel.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">CFTR (Cystic Fibrosis)</span>
                      <span className="text-emerald-700 font-bold text-[10px]">Non-Carrier</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Synthesis Engine */}
            <div className="lg:col-span-4 rounded-2xl bg-teal-900 text-white p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-teal-800 pb-3">
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-5 h-5 text-teal-300" />
                    <span className="font-bold text-xs uppercase tracking-wider text-teal-200">
                      Synthesis Core
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-teal-800 text-teal-200 font-mono text-[10px]">
                    ACMG Class II
                  </span>
                </div>

                <div className="text-center py-2 space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-teal-300 font-bold">
                    Inbreeding Coefficient (F-Calc)
                  </span>
                  <div className="text-3xl font-black text-white">F = 0.0625</div>
                  <span className="text-xs text-teal-200">
                    Equivalent to First-Cousin Kinship (1/16)
                  </span>
                </div>

                <div className="p-3 bg-teal-800/80 rounded-xl border border-teal-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-teal-100">
                    <span>Recessive Offspring Risk</span>
                    <span className="text-amber-300 text-sm">25% (1 in 4)</span>
                  </div>
                  <p className="text-[11px] text-teal-200 leading-relaxed">
                    Identical By Descent (IBD) probability elevated due to shared ancestral branches.
                    Targeted prenatal chorionic villus sampling (CVS) recommended at 10-12 weeks.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-teal-800 flex items-center justify-between text-xs text-teal-300">
                <span>Consanguinity double-bar active</span>
                <span className="font-mono">OMIM Sync 100%</span>
              </div>
            </div>

            {/* Partner B */}
            <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                      AV
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Ananya Verma</h4>
                      <p className="text-[11px] text-slate-500">Age 27 &bull; Candidate Partner (Partner B)</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                    Pedigree: #F-000189
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Carrier Findings</span>
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">HBB (Beta-Thalassemia)</span>
                      <span className="px-1.5 py-0.5 bg-amber-200/60 text-amber-800 font-mono text-[10px] rounded">
                        IVS-I-5 (G&gt;C)
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Compound heterozygous risk concordant with Partner A.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">SMN1 (Spinal Muscular Atrophy)</span>
                      <span className="text-emerald-700 font-bold text-[10px]">2 Copies Present</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variant Concordance Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-teal-800" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Comparative Variant Concordance Matrix (3,240 Autosomal Loci)
                </h3>
              </div>
              <span className="text-xs text-slate-400">ACMG Guidelines 2024</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Gene / Condition</th>
                    <th className="px-5 py-3">Pattern</th>
                    <th className="px-5 py-3">Partner A Status</th>
                    <th className="px-5 py-3">Partner B Status</th>
                    <th className="px-5 py-3">Concordance Risk</th>
                    <th className="px-5 py-3 text-right">Clinical Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/80 transition-colors bg-red-50/20">
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      HBB (Beta-Thalassemia Major)
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">Autosomal Recessive</td>
                    <td className="px-5 py-3.5 text-amber-800 font-medium">Carrier (c.92+5G&gt;C)</td>
                    <td className="px-5 py-3.5 text-amber-800 font-medium">Carrier (IVS-I-5 G&gt;C)</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                        25% High Risk
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-teal-800">
                      Targeted Pre-implantation / CVS
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      CFTR (Cystic Fibrosis)
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">Autosomal Recessive</td>
                    <td className="px-5 py-3.5 text-slate-600">Non-carrier</td>
                    <td className="px-5 py-3.5 text-slate-600">Non-carrier</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        &lt;0.01% Low
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-500">
                      Standard Care
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      SMN1 (Spinal Muscular Atrophy)
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">Autosomal Recessive</td>
                    <td className="px-5 py-3.5 text-slate-600">2 Copies</td>
                    <td className="px-5 py-3.5 text-slate-600">2 Copies</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        &lt;0.01% Low
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-500">
                      Standard Care
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}

