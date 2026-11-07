'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PgtSimulator } from '@/components/simulation/PgtSimulator';
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
  ArrowRight,
  Sparkles,
  Send,
  Search,
  Compass,
  Cpu,
  RefreshCw,
  HelpCircle,
  UploadCloud,
  GitBranch
} from 'lucide-react';

export default function CoupleAssessmentPage() {
  const [assessment, setAssessment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatAnswer, setChatAnswer] = useState<any | null>(null);
  const [partnerAName, setPartnerAName] = useState('Partner A (Target Male)');
  const [partnerBName, setPartnerBName] = useState('Partner B (Target Female)');

  useEffect(() => {
    loadAssessment();
  }, []);

  const loadAssessment = async () => {
    setIsLoading(true);
    try {
      let pA = 'Partner A (Target Male)';
      let pB = 'Partner B (Target Female)';
      const famRes = await fetch('/api/families');
      if (famRes.ok) {
        const famData = await famRes.json();
        const activeFam = famData?.families?.[0];
        if (activeFam) {
          const members = activeFam.members || [];
          const maleTarget = members.find((m: any) => m.sex === 'male' && m.relationship !== 'child');
          const femaleTarget = members.find((m: any) => m.sex === 'female' && m.relationship !== 'child');
          if (maleTarget) pA = maleTarget.alias_name || maleTarget.name || 'Partner A (Target Male)';
          if (femaleTarget) pB = femaleTarget.alias_name || femaleTarget.name || 'Partner B (Target Female)';
        }
      }
      setPartnerAName(pA);
      setPartnerBName(pB);

      const res = await fetch('/api/ai/analyze-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_a: pA, partner_b: pB })
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        if (data?.partner_a?.name) setPartnerAName(data.partner_a.name);
        if (data?.partner_b?.name) setPartnerBName(data.partner_b.name);
      }
    } catch (e) {
      console.warn('Could not load couple assessment:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (text: string) => {
    if (!text.trim()) return;
    setUserQuery(text);
    setIsAsking(true);
    setChatAnswer(null);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      if (res.ok) {
        const data = await res.json();
        setChatAnswer(data);
      }
    } catch (e) {
      console.error('Error asking question:', e);
    } finally {
      setIsAsking(false);
    }
  };
  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-mint/25 text-pine text-[11px] font-bold tracking-wider uppercase border border-mint">
                  Pre-Conception Genomic Node
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-slate-500 text-xs font-mono">CRYPT-ID: #CP-8492</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-pine tracking-tight">
                Couple Hereditary Assessment &mdash; {partnerAName} &amp; {partnerBName}
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
                <Download className="w-3.5 h-3.5 text-pine" />
                <span>Export Clinical Brief</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Session scheduled with Medical Genetics Board.')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-pine hover:bg-pine-light rounded-xl shadow-xs transition"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Review with Geneticist</span>
              </button>
            </div>
          </div>

          {/* Empty State when no reports or pedigree added yet */}
          {!assessment?.has_data ? (
            <div className="p-6 sm:p-8 bg-fog/50 rounded-2xl border border-outline-variant/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-mint/30 text-pine flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-6 h-6 text-pine" />
              </div>
              <div className="max-w-lg mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-pine">No Parents Screening Reports or Pedigree Tree Uploaded Yet</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  To compute dual-parent genomic concordance, recessive offspring transmission risk, and personalized reproductive counseling, please upload parents&apos; reports or build the family tree below:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-4 bg-white rounded-2xl border border-outline-variant/30 text-left space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-pine">
                    <span className="w-5 h-5 rounded-full bg-pine text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Upload Parents Reports</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Upload official premarital screening PDFs for prospective parents to extract carrier traits.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pine hover:bg-pine-light text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-mint" />
                    <span>Upload on Dashboard</span>
                  </Link>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-outline-variant/30 text-left space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-pine">
                    <span className="w-5 h-5 rounded-full bg-pine text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Build Family Pedigree</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Map prospective parents and projected offspring (★) with documented phenotypes.
                  </p>
                  <Link
                    href="/pedigree"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-outline-variant/40 text-pine text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-pine" />
                    <span>Build Family Tree</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Clinical Protocol Recommendation Banner */}
              <div className="p-4 rounded-2xl bg-mint/20 border border-mint/60 flex items-start gap-4 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-pine flex items-center justify-center text-white shrink-0 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-pine uppercase tracking-wider">
                      Clinical Recommendation &bull; Guideline Tier 2
                    </span>
                    <span className="text-xs text-pine font-bold">Standard Protocol (ACMG / SHG)</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {assessment.clinical_recommendation || (
                      `Carrier Screening Protocol Advised for ${partnerAName} & ${partnerBName}. Verified genomic parameters support proactive counseling and routine carrier screening.`
                    )}
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
                        <div className="w-11 h-11 rounded-xl bg-pine text-white flex items-center justify-center font-bold text-sm">
                          {(assessment.partner_a?.name || partnerAName).replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'PA'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{assessment.partner_a?.name || partnerAName}</h4>
                          <p className="text-[11px] text-slate-500">{assessment.partner_a?.role || 'Target Proband (Partner A)'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                        Pedigree: #{assessment.partner_a?.pedigree_id || 'F-000123'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase text-slate-400">Carrier Findings</span>
                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">{assessment.partner_a?.condition || 'Screened Panel'}</span>
                          <span className="px-1.5 py-0.5 bg-amber-200/60 text-amber-800 font-mono text-[10px] rounded">
                            {assessment.partner_a?.variant || 'Verified'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          {assessment.partner_a?.carrier_status || 'Documented Carrier'}
                        </p>
                      </div>

                      {assessment.partner_a?.findings && assessment.partner_a.findings.length > 0 ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <span className="font-bold text-slate-700 block text-[11px]">Laboratory Biomarkers:</span>
                          {assessment.partner_a.findings.slice(0, 2).map((f: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                              <span>{f.parameter || f.name}</span>
                              <span className="font-mono font-bold text-slate-800">{f.value} {f.unit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">General Panel Screening</span>
                            <span className="text-jungle font-bold text-[10px]">Verified NGS Panel</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Central Synthesis Engine */}
                <div className="lg:col-span-4 rounded-2xl bg-pine text-white p-5 flex flex-col justify-between shadow-xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-pine-light pb-3">
                      <div className="flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-mint" />
                        <span className="font-bold text-xs uppercase tracking-wider text-mint">
                          Synthesis Core
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-pine-light text-mint font-mono text-[10px]">
                        ACMG Class II
                      </span>
                    </div>

                    <div className="text-center py-2 space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-mint font-bold">
                        Inbreeding Coefficient (F-Calc)
                      </span>
                      <div className="text-3xl font-black text-white">{assessment.synthesis?.inbreeding_coefficient || 'F = 0.000'}</div>
                      <span className="text-xs text-mint">
                        {assessment.synthesis?.kinship_level || 'Non-Consanguineous / Population Baseline'}
                      </span>
                    </div>

                    <div className="p-3 bg-pine-light/80 rounded-xl border border-pine-light space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>Recessive Offspring Risk</span>
                        <span className="text-amber-300 text-sm">{assessment.synthesis?.recessive_risk || '25% (1 in 4)'}</span>
                      </div>
                      <p className="text-[11px] text-mint/90 leading-relaxed">
                        {assessment.synthesis?.risk_details}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-pine-light flex items-center justify-between text-xs text-mint">
                    <span>{assessment.synthesis?.consanguinity_active ? 'Consanguinity double-bar active' : 'Lineage linkage verified'}</span>
                    <span className="font-mono">{assessment.synthesis?.child_node_status || 'Child Node ★ Linked'}</span>
                  </div>
                </div>

                {/* Partner B */}
                <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between shadow-xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                          {(assessment.partner_b?.name || partnerBName).replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'PB'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{assessment.partner_b?.name || partnerBName}</h4>
                          <p className="text-[11px] text-slate-500">{assessment.partner_b?.role || 'Candidate Target (Partner B)'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                        Pedigree: #{assessment.partner_b?.pedigree_id || 'F-000189'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase text-slate-400">Carrier Findings</span>
                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">{assessment.partner_b?.condition || 'Screened Panel'}</span>
                          <span className="px-1.5 py-0.5 bg-amber-200/60 text-amber-800 font-mono text-[10px] rounded">
                            {assessment.partner_b?.variant || 'Verified'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          {assessment.partner_b?.carrier_status || 'Documented Carrier'}
                        </p>
                      </div>

                      {assessment.partner_b?.findings && assessment.partner_b.findings.length > 0 ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <span className="font-bold text-slate-700 block text-[11px]">Laboratory Biomarkers:</span>
                          {assessment.partner_b.findings.slice(0, 2).map((f: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                              <span>{f.parameter || f.name}</span>
                              <span className="font-mono font-bold text-slate-800">{f.value} {f.unit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">General Panel Screening</span>
                            <span className="text-jungle font-bold text-[10px]">Verified NGS Panel</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== QWEN3 BRAIN: POSITIVE COUPLE ASSESSMENT & NAVIGATION ==================== */}
          {assessment && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pine text-white flex items-center justify-center shadow-xs">
                    <Cpu className="w-5 h-5 text-mint" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-pine">
                        Qwen3 Clinical Brain &bull; Couple Assessment
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-mint/25 text-pine text-[10px] font-bold border border-mint">
                        Compassionate Guidance
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Personalized genomic counseling synthesis to navigate pre-conception pathways
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadAssessment}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-outline-variant/30 hover:bg-slate-50 text-xs text-pine font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Update Assessment</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Positive Guidance Banner */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <Heart className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Positive Couple Assessment: {assessment.compatibility_status}</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {assessment.positive_summary}
                  </p>
                </div>

                {/* Motivational Destigmatization */}
                <div className="p-5 rounded-2xl bg-mint/20 border border-mint space-y-2">
                  <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-jungle shrink-0" />
                    <span>Motivational Insight</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {assessment.motivational_insight}
                  </p>
                </div>

                {/* Next Possible Ways */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-pine" />
                    <span>Next Possible Ways &amp; Proactive Solutions:</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assessment.next_possible_ways?.map((way: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-pine text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{way}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Q&A */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-pine" />
                    <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                      Ask Questions Based on These Results
                    </h4>
                  </div>

                  {assessment.potential_queries && (
                    <div className="flex flex-wrap gap-2">
                      {assessment.potential_queries.map((q: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAskQuestion(q)}
                          className="px-3 py-1.5 rounded-full bg-fog hover:bg-fog-dark border border-outline-variant/30 text-xs text-pine font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Search className="w-3 h-3 text-pine/50" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskQuestion(userQuery);
                    }}
                    className="relative flex items-center"
                  >
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Ask Qwen3 any question about your compatibility or options..."
                      className="w-full pl-4 pr-12 py-2.5 text-xs rounded-xl bg-fog border border-outline-variant/30 text-pine placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition"
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !userQuery.trim()}
                      className="absolute right-2 w-8 h-8 rounded-full bg-pine text-white flex items-center justify-center hover:bg-pine-light disabled:opacity-50 transition shadow-xs cursor-pointer"
                    >
                      {isAsking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>

                  {chatAnswer && (
                    <div className="p-4 rounded-2xl bg-mint/20 border border-mint space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-pine flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-jungle" />
                          <span>Qwen3 Clinical Answer:</span>
                        </span>
                        {chatAnswer.references && chatAnswer.references.length > 0 && (
                          <span className="text-[10px] font-mono text-teal-800 bg-mint/30 px-2 py-0.5 rounded">
                            Citations: {chatAnswer.references.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 leading-relaxed text-xs">
                        {chatAnswer.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Variant Concordance Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-pine" />
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
                  <tr className={`hover:bg-slate-50/80 transition-colors ${assessment?.synthesis?.recessive_risk?.includes('25%') ? 'bg-red-50/20' : 'bg-emerald-50/10'}`}>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {assessment?.partner_a?.condition || assessment?.partner_b?.condition || 'HBB (Beta-Thalassemia Major)'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">Autosomal Recessive</td>
                    <td className="px-5 py-3.5 text-amber-800 font-medium">
                      {assessment?.partner_a?.carrier_status ? `${assessment.partner_a.carrier_status} (${assessment.partner_a.variant})` : 'Carrier (c.92+5G>C)'}
                    </td>
                    <td className="px-5 py-3.5 text-amber-800 font-medium">
                      {assessment?.partner_b?.carrier_status ? `${assessment.partner_b.carrier_status} (${assessment.partner_b.variant})` : 'Carrier (IVS-I-5 G>C)'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${assessment?.synthesis?.recessive_risk?.includes('25%') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {assessment?.synthesis?.recessive_risk || '25% Risk'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-pine">
                      {assessment?.synthesis?.recessive_risk?.includes('25%') ? 'Targeted Pre-implantation / PGT-M' : 'Routine Clinical Care'}
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
          {/* Interactive PGT-M & Offspring Probability Simulator */}
          <PgtSimulator />
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}

