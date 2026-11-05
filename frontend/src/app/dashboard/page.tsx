'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  GitBranch,
  Dna,
  Sparkles,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Video,
  Clock,
  Send,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  ExternalLink,
  Share2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : (user?.username || 'Patient');

  // Multiple Family Pedigrees State
  const [families, setFamilies] = useState<any[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/families')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const list = Array.isArray(data) ? data : data.families || [];
          setFamilies(list);
        }
      })
      .catch((e) => console.error('Failed to load families:', e))
      .finally(() => setFamiliesLoading(false));
  }, []);

  // Interactive AI Question State
  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [panelScheduled, setPanelScheduled] = useState(false);

  const suggestedQuestions = [
    {
      q: 'What does 3rd-degree consanguinity mean for my child?',
      a: 'When cousins marry, they share about 6.25% of their DNA. This slightly increases the chance that both parents carry the exact same hidden gene. A quick carrier test helps you see if both of you carry any matching trait, so doctors can protect your future baby.'
    },
    {
      q: 'Can G6PD trait be passed down if mother is carrier?',
      a: 'Yes. G6PD is carried on the X chromosome. A mother who carries the trait has a 50% chance of passing it to her sons (who may have G6PD) or daughters (who may also become carriers).'
    },
    {
      q: 'Differences between Alpha vs Beta Thalassemia?',
      a: 'Both are inherited blood conditions that affect red blood cells. Being a single-gene carrier usually causes no problems, but if both mother and father carry the same trait, there is a 25% chance their child could have a severe form.'
    }
  ];

  const handleAskQuestion = (questionText: string) => {
    setQuery(questionText);
    const matched = suggestedQuestions.find(
      (sq) => sq.q.toLowerCase() === questionText.toLowerCase()
    );
    if (matched) {
      setAiAnswer(matched.a);
    } else {
      setAiAnswer(
        `GenWell AI analyzed your question regarding "${questionText}": Based on your 3-generation family tree, your family has documented Beta-Thalassemia and G6PD traits. A simple carrier test with your partner is the safest first step.`
      );
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#f4f7f6] overflow-hidden font-sans text-slate-800">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5">
            {/* ==================== 1. TOP WELCOME HERO BANNER ==================== */}
            <div className="relative w-full bg-white rounded-2xl p-6 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-slate-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Welcome Copy */}
              <div className="flex flex-col max-w-2xl space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 text-[11px] tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    CLINICAL NODE: ACTIVE
                  </span>
                  <span className="text-slate-500 text-[11px] font-medium">
                    Locus 11p15.4 Indexed
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09332c] tracking-tight">
                  Good Morning, {firstName}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your family health journey starts with understanding. Your records show{' '}
                  <strong className="text-slate-800 font-bold">92% complete details</strong> across 3
                  mapped generations of your family.
                </p>

                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <Link
                    href="/pedigree?create=true"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Family Pedigree</span>
                  </Link>
                  <Link
                    href="/pedigree"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-teal-800" />
                    <span>View Pedigree Charts</span>
                  </Link>
                </div>
              </div>

              {/* Right Priority Diagnostic Badge Tile */}
              <div className="flex items-center gap-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-xl border border-slate-200/90 shadow-xs w-full lg:w-auto shrink-0">
                {/* Circular 92% Gauge */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-200 fill-transparent"
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-teal-600 fill-transparent transition-all duration-1000 ease-out"
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * 92) / 100}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black text-slate-800 leading-none">92%</span>
                    <span className="text-[9px] text-slate-500 font-bold leading-none mt-1">INDEX</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-teal-800 font-bold">
                    PRIORITY DIAGNOSTIC
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    Carrier Scan Recommended
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      Locus: HBB 11p15.4
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[10px] font-bold">
                      Autosomal Recessive
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== 2. ROW OF 4 STAT TILES ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tile 1: Pedigree Size */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">PEDIGREE SIZE</span>
                    <GitBranch className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 leading-none">18</span>
                    <span className="text-xs text-slate-500 font-semibold">Members</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    3 generations mapped with both mother and father sides.
                  </p>
                </div>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>View Pedigree Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Tile 2: Phenotypes */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">PHENOTYPES</span>
                    <Dna className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 leading-none">2</span>
                    <span className="text-xs text-slate-500 font-semibold">Reported</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold">
                      &beta;-Thal trait
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
                      G6PD Def.
                    </span>
                  </div>
                </div>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>Update History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Tile 3: AI Surveillance */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">AI SURVEILLANCE</span>
                    <Sparkles className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-teal-700 leading-none">3</span>
                    <span className="text-xs text-slate-500 font-semibold">High-Priority</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Key health risks detected that could pass down to children.
                  </p>
                </div>
                <Link
                  href="/risk-analysis"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>Review Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Tile 4: Spousal Harmony */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">SPOUSAL HARMONY</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                      FZ
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        Fatima Al-Zahra
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Linked Tree Verified
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/couple-assessment"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>Review Couple Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* ==================== 2.5. FAMILY PEDIGREE CHARTS LIST & MANAGER ==================== */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#09332c]">
                      Your Family Pedigree Charts
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold text-[11px]">
                      {families.length} {families.length === 1 ? 'Chart' : 'Charts'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-pedigree chart library with auto-generated Family IDs, clinical linkage, and shareable doctor links.
                  </p>
                </div>

                <Link
                  href="/pedigree?create=true"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Family Pedigree</span>
                </Link>
              </div>

              {/* Charts Table matching Requirement 7 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-4 font-bold rounded-l-xl">Family ID</th>
                      <th className="py-3 px-4 font-bold">Chart Title</th>
                      <th className="py-3 px-4 font-bold">Proband (Starting Person)</th>
                      <th className="py-3 px-4 font-bold">Member Count</th>
                      <th className="py-3 px-4 font-bold">Last Updated</th>
                      <th className="py-3 px-4 font-bold">Share Status</th>
                      <th className="py-3 px-4 font-bold text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {familiesLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Loading your pedigree charts...
                        </td>
                      </tr>
                    ) : families.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <GitBranch className="w-8 h-8 text-slate-300" />
                            <p className="font-semibold text-slate-700">No Family Pedigrees Created Yet</p>
                            <p className="text-[11px] text-slate-400 max-w-sm">
                              Click "Create Family Pedigree" to build your first standard clinical health tree with automatic genetic links.
                            </p>
                            <Link
                              href="/pedigree?create=true"
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Family Pedigree</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      families.map((fam) => (
                        <tr key={fam.family_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                            <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-md">
                              {fam.family_id}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {fam.family_name || fam.name || `Family ${fam.family_id}`}
                            {fam.trait_or_disorder_name && (
                              <span className="block text-[10px] font-normal text-slate-500 truncate max-w-[220px]">
                                {fam.trait_or_disorder_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-teal-700" />
                              {fam.proband_name || 'Proband'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                              {fam.member_count ?? 1} {fam.member_count === 1 ? 'member' : 'members'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {fam.updated_at ? new Date(fam.updated_at).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="py-3.5 px-4">
                            {fam.share_enabled ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                                Link Shared
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                                Private
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/pedigree?family_id=${fam.family_id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition shadow-xs"
                              >
                                <span>Open Chart</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              {fam.share_token && (
                                <Link
                                  href={`/pedigree/share/${fam.share_token}`}
                                  target="_blank"
                                  className="p-1.5 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition"
                                  title="View Shareable Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ==================== 3. MAIN 2-COLUMN SECTION ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* -------------------- LEFT COLUMN (7 COLS) -------------------- */}
              <div className="lg:col-span-7 space-y-5">
                {/* Lineage Pedigree Model Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#09332c]">
                          Lineage Pedigree Model
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          3 Generations
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Family health tree showing parents, grandparents, and cousin connections.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                        className="p-1 rounded text-slate-600 hover:bg-white transition"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                        className="p-1 rounded text-slate-600 hover:bg-white transition"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href="/pedigree"
                        className="p-1 rounded text-slate-600 hover:bg-white transition"
                        title="Open Full Screen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* SVG Tree Diagram Box matching template */}
                  <div
                    className="w-full bg-[#f8faf9] rounded-xl p-5 border border-slate-200/90 flex flex-col items-center justify-center overflow-x-auto"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  >
                    <svg viewBox="0 0 620 320" className="w-full max-w-xl h-auto select-none">
                      {/* Generation I (Grandparents) */}
                      <g transform="translate(40, 20)">
                        {/* I-1: Paternal Grandfather */}
                        <g transform="translate(30, 0)">
                          <rect x="0" y="0" width="34" height="34" fill="#ffffff" stroke="#1e293b" strokeWidth="2" rx="2" />
                          <circle cx="17" cy="17" r="4" fill="#0f766e" />
                          <text x="17" y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">I-1</text>
                          <text x="17" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="#334155">Paternal GF</text>
                          <text x="17" y="55" textAnchor="middle" fontSize="8" fill="#0f766e">Carrier (HBB)</text>
                        </g>

                        {/* I-2: Paternal Grandmother */}
                        <g transform="translate(130, 0)">
                          <circle cx="17" cy="17" r="17" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
                          <text x="17" y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">I-2</text>
                          <text x="17" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="#334155">Paternal GM</text>
                          <text x="17" y="55" textAnchor="middle" fontSize="8" fill="#64748b">Non-carrier</text>
                        </g>

                        {/* Line I-1 to I-2 */}
                        <line x1="64" y1="17" x2="130" y2="17" stroke="#334155" strokeWidth="1.5" />
                        <line x1="97" y1="17" x2="97" y2="70" stroke="#334155" strokeWidth="1.5" />

                        {/* I-3: Maternal Grandfather */}
                        <g transform="translate(340, 0)">
                          <rect x="0" y="0" width="34" height="34" fill="#ffffff" stroke="#1e293b" strokeWidth="2" rx="2" />
                          <text x="17" y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">I-3</text>
                          <text x="17" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="#334155">Maternal GF</text>
                          <text x="17" y="55" textAnchor="middle" fontSize="8" fill="#64748b">Non-carrier</text>
                        </g>

                        {/* I-4: Maternal Grandmother */}
                        <g transform="translate(440, 0)">
                          <circle cx="17" cy="17" r="17" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
                          <circle cx="17" cy="17" r="4" fill="#10b981" />
                          <text x="17" y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">I-4</text>
                          <text x="17" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="#334155">Maternal GM</text>
                          <text x="17" y="55" textAnchor="middle" fontSize="8" fill="#059669">Carrier (G6PD)</text>
                        </g>

                        {/* Line I-3 to I-4 */}
                        <line x1="374" y1="17" x2="440" y2="17" stroke="#334155" strokeWidth="1.5" />
                        <line x1="407" y1="17" x2="407" y2="70" stroke="#334155" strokeWidth="1.5" />
                      </g>

                      {/* Generation II (Parents) */}
                      <g transform="translate(40, 110)">
                        {/* II-1: Father Omar */}
                        <g transform="translate(80, 0)">
                          <rect x="0" y="0" width="36" height="36" fill="#ffffff" stroke="#0f766e" strokeWidth="2" rx="2" />
                          <rect x="0" y="0" width="18" height="36" fill="#0f766e" rx="1" />
                          <text x="18" y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">II-1</text>
                          <text x="18" y="48" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f3830">Father (Omar)</text>
                          <text x="18" y="59" textAnchor="middle" fontSize="8" fill="#0f766e">&beta;-Thalassemia Trait</text>
                        </g>

                        {/* Consanguinity Double Line connecting II-1 and II-2 */}
                        <line x1="116" y1="15" x2="388" y2="15" stroke="#0f766e" strokeWidth="2" />
                        <line x1="116" y1="21" x2="388" y2="21" stroke="#0f766e" strokeWidth="2" />
                        
                        {/* Center Consanguinity Label */}
                        <g transform="translate(230, 2)">
                          <rect x="0" y="0" width="80" height="26" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x="40" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">3&deg;</text>
                          <text x="40" y="21" textAnchor="middle" fontSize="7" fill="#475569">Consanguinity</text>
                        </g>

                        {/* II-2: Mother Layla */}
                        <g transform="translate(388, 0)">
                          <circle cx="18" cy="18" r="18" fill="#ffffff" stroke="#059669" strokeWidth="2" />
                          <path d="M 18 0 A 18 18 0 0 1 18 36 Z" fill="#10b981" />
                          <text x="18" y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">II-2</text>
                          <text x="18" y="48" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f3830">Mother (Layla)</text>
                          <text x="18" y="59" textAnchor="middle" fontSize="8" fill="#059669">G6PD Carrier</text>
                        </g>

                        {/* Drop Stem from union to Proband */}
                        <line x1="270" y1="21" x2="270" y2="85" stroke="#334155" strokeWidth="1.5" />
                      </g>

                      {/* Generation III (Proband / You) */}
                      <g transform="translate(40, 215)">
                        <g transform="translate(251, 0)">
                          <rect x="0" y="0" width="38" height="38" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" rx="3" />
                          <rect x="0" y="0" width="19" height="38" fill="#0f766e" rx="1" />
                          <text x="19" y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f766e">III-1</text>
                          
                          {/* Proband Tag */}
                          <g transform="translate(-18, 44)">
                            <rect x="0" y="0" width="74" height="18" rx="9" fill="#0f172a" />
                            <text x="37" y="12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">
                              {firstName} (You)
                            </text>
                          </g>

                          <text x="19" y="74" textAnchor="middle" fontSize="8" fontWeight="semibold" fill="#0f766e">
                            Carrier (HBB &amp; G6PD heterozygous)
                          </text>
                        </g>
                      </g>
                    </svg>

                    {/* Pedigree Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-3 mt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-sm border border-slate-700 bg-white" />
                        <span>Clear / Unaffected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-sm border border-slate-700 bg-gradient-to-r from-teal-700 from-50% to-white to-50%" />
                        <span>Heterozygous Carrier</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-sm border border-slate-700 bg-slate-900" />
                        <span>Affected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-700 bg-slate-200" />
                        <span>Female Node</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-sm border border-slate-700 bg-slate-200" />
                        <span>Male Node</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => alert('Downloading official clinical PDF report...')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition"
                    >
                      <FileText className="w-4 h-4 text-teal-700" />
                      <span>Export Clinical PDF</span>
                    </button>
                    <Link
                      href="/pedigree"
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    >
                      Open Full Interactive Editor &rarr;
                    </Link>
                  </div>
                </div>

                {/* Understanding Consanguinity & Hereditary Lineages Literacy Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>GENOMIC LITERACY</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#09332c] leading-tight">
                    Understanding Shared Family Bloodlines &amp; Hereditary Health
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    {/* Family Photo Representation */}
                    <div className="sm:col-span-5 rounded-xl overflow-hidden shadow-sm h-44 border border-slate-200 relative bg-slate-100">
                      <img
                        src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80"
                        alt="Family Health"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Educational Text in Simple English */}
                    <div className="sm:col-span-7 space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Marrying within the family is a deeply respected and valued tradition in many cultures.
                        Modern genetic testing gives couples clear, private knowledge—spotting shared hidden
                        traits early so you can take simple steps to keep future generations healthy and thriving.
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <Link
                          href="/risk-analysis"
                          className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-900 transition"
                        >
                          <span>Read 5-min Clinical Summary</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-slate-400 font-medium">
                          &bull; Reviewed by Medical Genetics Board
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------------------- RIGHT COLUMN (5 COLS) -------------------- */}
              <div className="lg:col-span-5 space-y-5">
                {/* Action Directives Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Action Directives
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                      TIER 1 CLINICAL
                    </span>
                  </div>

                  {/* Sub-card 1: Pre-Marital Gene Panel */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                          <Dna className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Pre-Marital Gene Panel</h4>
                          <span className="text-[11px] text-slate-500">
                            Recommended for Fatima &amp; {firstName}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                        Urgent
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      A simple blood screening checking for Beta-Thalassemia, G6PD, and Cystic Fibrosis
                      at an accredited hospital so you have clear answers before marriage.
                    </p>

                    <button
                      type="button"
                      onClick={() => setPanelScheduled(true)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs ${
                        panelScheduled
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{panelScheduled ? 'Panel Scheduled (Lab Order #902)' : 'Schedule Gene Panel'}</span>
                    </button>
                  </div>

                  {/* Sub-card 2: Doctor Video Consultation */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80"
                          alt="Dr. Alisha Patel"
                          className="w-10 h-10 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Dr. Alisha Patel</h4>
                          <span className="text-[11px] text-slate-500">
                            Consultant Genetic Counsellor (FACMG)
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                        <Video className="w-3 h-3 text-slate-500" />
                        <span>Video</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Thursday &bull; 14:00 (GST)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold">
                        45 Mins
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      A friendly private video appointment to discuss your results and answer any questions
                      about having healthy children.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => alert('Rescheduling calendar opened...')}
                        className="py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition text-center"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingConfirmed(true)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition text-center shadow-xs ${
                          bookingConfirmed
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#0f172a] hover:bg-slate-800 text-white'
                        }`}
                      >
                        {bookingConfirmed ? 'Confirmed!' : 'Confirm Booking'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ask GenWell AI Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Ask GenWell AI</h2>
                      <p className="text-[11px] text-slate-500">
                        Ask any question about your family health in plain English
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      GPT-4Bio
                    </span>
                  </div>

                  {/* Question Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (query.trim()) handleAskQuestion(query);
                    }}
                    className="relative flex items-center"
                  >
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask about recessive inheritance, risks, or..."
                      className="w-full pl-3.5 pr-11 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* AI Answer Box */}
                  {aiAnswer && (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>GenWell Health Answer:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-[11px]">{aiAnswer}</p>
                    </div>
                  )}

                  {/* Suggested Inquiries */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      SUGGESTED INQUIRIES
                    </span>
                    <div className="space-y-1">
                      {suggestedQuestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAskQuestion(item.q)}
                          className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs text-slate-700 flex items-center gap-2 transition cursor-pointer"
                        >
                          <Search className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.q}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Your questions and health data are private, encrypted, and never shared.</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
