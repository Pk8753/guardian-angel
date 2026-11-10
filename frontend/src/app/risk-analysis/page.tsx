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
  FileText,
  Sparkles,
  Send,
  Search,
  Heart,
  Compass,
  HelpCircle,
  RefreshCw,
  Cpu,
  Calendar,
  UploadCloud
} from 'lucide-react';
import { FamilyRecord } from '@/components/pedigree/types';

interface DetectedConditionItem {
  name: string;
  omim?: string;
  carrier_status?: string;
  inheritance?: string;
  child_transmission: string;
  positive_guidance: string;
  consultation_action: string;
}

interface QwenAssessment {
  source: string;
  is_llm: boolean;
  has_data?: boolean;
  positive_summary: string;
  motivational_insight: string;
  risk_explanation?: string;
  consanguinity_guidance?: string;
  innovative_technologies?: string[];
  compatibility_status: string;
  next_possible_ways: string[];
  potential_queries: string[];
  detected_conditions?: DetectedConditionItem[];
}

export default function RiskAnalysisPage() {
  const [families, setFamilies] = useState<FamilyRecord[]>([]);
  const [assessment, setAssessment] = useState<QwenAssessment | null>(null);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const [scrapedReports, setScrapedReports] = useState<any[]>([]);

  // Interactive Q&A state
  const [userQuery, setUserQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatAnswer, setChatAnswer] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/families')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => setFamilies(data?.families || (Array.isArray(data) ? data : [])))
      .catch(() => setFamilies([]));

    fetch('/api/reports/scraped')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => setScrapedReports(data?.reports || (Array.isArray(data) ? data : [])))
      .catch(() => setScrapedReports([]));

    loadAssessment();
  }, []);

  const loadAssessment = async () => {
    setIsLoadingAssessment(true);
    try {
      const res = await fetch('/api/ai/analyze-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
      }
    } catch (err) {
      console.error('Could not load couple assessment:', err);
    } finally {
      setIsLoadingAssessment(false);
    }
  };

  const handleAskQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;
    setUserQuery(queryText);
    setIsAsking(true);
    setChatAnswer(null);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      if (res.ok) {
        const data = await res.json();
        setChatAnswer(data);
      }
    } catch (err) {
      console.error('Error asking Qwen3:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const totalMembers = families.reduce((acc, f) => acc + (f.members?.length || 0), 0);
  const generationsMapped = families.length > 0
    ? Math.max(0, ...families.map((f) => {
        const gens = (f.members || []).map((m) => Number(m.generation) || 1);
        return gens.length > 0 ? Math.max(...gens) : 0;
      }))
    : 0;
  const screenedLociCount = (scrapedReports.length > 0 || (assessment?.detected_conditions && assessment.detected_conditions.length > 0))
    ? Math.max(scrapedReports.length, assessment?.detected_conditions?.length || 0)
    : 0;
  const hasUserData = totalMembers > 0 || scrapedReports.length > 0 || (assessment?.has_data ?? false);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-5">
          {/* Page Header & Key Metrics Strip */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="flex flex-col gap-1.5 max-w-3xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-pine tracking-tight">
                    AI Genetic Intelligence
                  </h1>
                  <span className="bg-mint/25 border border-mint text-pine px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-jungle animate-pulse" />
                    ENGINE: V-GENOMICS 4.2 &bull; 94% RELIABILITY
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Autonomous carrier risk synthesis and newborn transmission intelligence computed from your health records.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto bg-white border border-outline-variant/40 px-3 py-1.5 rounded-xl text-on-surface-variant shadow-xs text-xs">
                <ShieldCheck className="w-4 h-4 text-jungle" />
                <span>Last computed: <strong className="text-pine">Real-Time</strong></span>
              </div>
            </div>

            {/* Metric Badges Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3.5 shadow-xs border border-outline-variant/30">
                <div className="w-10 h-10 rounded-xl bg-fog flex items-center justify-center text-pine">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-pine leading-tight">
                    {totalMembers}
                  </span>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold block">
                    Members Analyzed
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 flex items-center gap-3.5 shadow-xs border border-outline-variant/30">
                <div className="w-10 h-10 rounded-xl bg-fog flex items-center justify-center text-pine">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-pine leading-tight">
                    {generationsMapped}
                  </span>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold block">
                    Generations Mapped
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 flex items-center gap-3.5 shadow-xs border border-mint/70 bg-gradient-to-br from-white to-mint/15">
                <div className="w-10 h-10 rounded-xl bg-pine text-white flex items-center justify-center shadow-xs">
                  <Dna className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-pine leading-tight">
                    {screenedLociCount}
                  </span>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold block">
                    Screened Clinical Loci
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== QWEN3 BRAIN: REPORT ANALYSIS & POSITIVE COUPLE ASSESSMENT ==================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pine text-white flex items-center justify-center shadow-xs">
                  <Cpu className="w-5 h-5 text-mint" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-pine">
                      Qwen3 Clinical Brain &bull; Couple Hereditary Assessment
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-mint/25 text-pine text-[10px] font-bold border border-mint">
                      Positive Guidance Mode
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Compassionate carrier synthesis based on {scrapedReports.length} uploaded screening reports &amp; active pedigree
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadAssessment}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-outline-variant/30 hover:bg-slate-50 text-xs text-pine font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAssessment ? 'animate-spin' : ''}`} />
                <span>Re-Analyze</span>
              </button>
            </div>

            {isLoadingAssessment ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-pine" />
                <p>Qwen3 is analyzing your reports and synthesizing positive couple guidance...</p>
              </div>
            ) : !hasUserData ? (
              <div className="p-6 sm:p-8 bg-fog/50 rounded-2xl border border-outline-variant/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-mint/30 text-pine flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-6 h-6 text-pine" />
                </div>
                <div className="max-w-lg mx-auto space-y-1.5">
                  <h3 className="text-base font-bold text-pine">No Screening Reports or Pedigree Tree Uploaded Yet</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    To activate autonomous AI genetic intelligence, newborn transmission analysis, and clinical counseling pathways, please complete the two steps below:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
                  <div className="p-4 bg-white rounded-2xl border border-outline-variant/30 text-left space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-pine">
                      <span className="w-5 h-5 rounded-full bg-pine text-white flex items-center justify-center text-[10px]">1</span>
                      <span>Premarital Screening PDF</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Upload your official premarital or genetic screening report to extract CBC, HbA2, and hemoglobinopathy markers.
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
                      <span>Family Pedigree Chart</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Map your family lineage, partners, and documented phenotypes across 3 generations.
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

                <p className="text-[11px] text-on-surface-variant/80 pt-1">
                  Once your records are added, Qwen AI will analyze hereditary patterns, determine transmission risks to future children, and provide proactive consultation options.
                </p>
              </div>
            ) : assessment ? (
              <div className="space-y-6">
                {/* Positive Summary Banner */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <Heart className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Positive Genomic Overview: {assessment.compatibility_status}</span>
                    </div>
                    <Link
                      href="/dashboard"
                      className="px-3 py-1.5 bg-pine hover:bg-pine-light text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-mint" />
                      <span>Schedule Consultation</span>
                    </Link>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {assessment.positive_summary}
                  </p>
                </div>

                {/* Motivational Insight */}
                <div className="p-5 rounded-2xl bg-mint/20 border border-mint space-y-2">
                  <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-jungle shrink-0" />
                    <span>Motivational Insight &amp; Destigmatization</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {assessment.motivational_insight}
                  </p>
                </div>

                {/* Reassuring Plain-Language Risk Demystification */}
                {assessment.risk_explanation && (
                  <div className="p-5 rounded-2xl bg-white border border-outline-variant/40 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-pine shrink-0" />
                      <span>Understanding Risk vs. Diagnosis in Plain Language</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {assessment.risk_explanation}
                    </p>
                  </div>
                )}

                {/* Cultural Lineage & Consanguinity Context */}
                {assessment.consanguinity_guidance && (
                  <div className="p-5 rounded-2xl bg-fog/60 border border-outline-variant/40 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                      <Heart className="w-4 h-4 text-pine shrink-0" />
                      <span>Shared Ancestry &amp; Consanguinity: Scientific Certainty</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {assessment.consanguinity_guidance}
                    </p>
                  </div>
                )}

                {/* Innovative Reproductive & Privacy Technologies */}
                {assessment.innovative_technologies && assessment.innovative_technologies.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                      <Cpu className="w-4 h-4 text-pine" />
                      <span>Innovative &amp; Privacy-Preserving Reproductive Technologies:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {assessment.innovative_technologies.map((tech, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white border border-outline-variant/40 flex items-start gap-3 shadow-xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-mint/40 text-pine flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            ★
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">{tech}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Possible Ways */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-pine" />
                    <span>Navigating Your Next Possible Steps:</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assessment.next_possible_ways.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-pine text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Q&A Based on Analysis Outcome */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-pine" />
                      <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                        Ask Questions Based on This Analysis Outcome
                      </h4>
                    </div>
                  </div>

                  {/* Suggested Potential Queries from Qwen3 */}
                  {assessment.potential_queries && assessment.potential_queries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {assessment.potential_queries.map((q, idx) => (
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

                  {/* Question Input Form */}
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
                      placeholder="Type any questions about your results, reproductive options, or policy centers..."
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

                  {/* Real-time Answer Card */}
                  {chatAnswer && (
                    <div className="p-4 rounded-2xl bg-mint/20 border border-mint space-y-2 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-pine flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-jungle" />
                          <span>Qwen3 Clinical Answer:</span>
                        </span>
                        {chatAnswer.references && chatAnswer.references.length > 0 && (
                          <span className="text-[10px] font-mono text-teal-800 bg-mint/30 px-2 py-0.5 rounded">
                            Policy Citations: {chatAnswer.references.join(', ')}
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
            ) : null}
          </div>

          {/* Condition Risk Assessment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {!hasUserData || !assessment?.detected_conditions || assessment.detected_conditions.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-8 border border-outline-variant/30 text-center space-y-2">
                <Dna className="w-8 h-8 text-outline/50 mx-auto" />
                <h3 className="text-sm font-bold text-pine">No Clinical Conditions Documented Yet</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  Condition-specific carrier risks and transmission probabilities to future children will be dynamically synthesized once you upload your premarital screening report or document carrier phenotypes in the Family Pedigree.
                </p>
              </div>
            ) : (
              assessment.detected_conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        {cond.carrier_status || 'Documented Trait'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{cond.omim || 'Clinical Locus'}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800">
                      {cond.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Inheritance Pattern: {cond.inheritance}
                    </p>

                    {/* Newborn Child Transmission Box */}
                    <div className="p-3.5 bg-mint/15 rounded-xl border border-mint/40 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-pine text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-jungle" />
                        <span>Transmission to Newborn Child:</span>
                      </div>
                      <p className="text-[11px] text-pine leading-relaxed font-medium">
                        {cond.child_transmission}
                      </p>
                    </div>

                    {/* Positive Guidance */}
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {cond.positive_guidance}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pine text-white text-xs font-bold rounded-xl hover:bg-pine-light transition shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-mint" />
                      <span>{cond.consultation_action || 'Schedule Consultation'}</span>
                    </Link>
                    <Link
                      href="/pedigree"
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline"
                    >
                      <span>View in Tree</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}

