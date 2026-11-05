'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { t } from '@/lib/translations';
import { PedigreeCanvas } from '@/components/pedigree/PedigreeCanvas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  Maximize2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  ExternalLink,
  Share2,
  Trash2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeLocale } = useUIStore();
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : (user?.username || 'Patient');

  // Multiple Family Pedigrees State & Default Family Tree State
  const [families, setFamilies] = useState<any[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);
  const [activeFamily, setActiveFamily] = useState<any | null>(null);
  const [activeFamilyLoading, setActiveFamilyLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    fetch('/api/families')
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (data) {
          const list = Array.isArray(data) ? data : data.families || [];
          setFamilies(list);

          if (list.length > 0) {
            // Sort families by member count descending so the tree with the most members is selected by default
            const sortedByMembers = [...list].sort((a: any, b: any) => {
              const countA = a.member_count ?? (a.members?.length || 0);
              const countB = b.member_count ?? (b.members?.length || 0);
              return countB - countA;
            });
            const targetId = sortedByMembers[0]?.family_id || list[0].family_id;

            if (targetId) {
              try {
                const famRes = await fetch(`/api/families/${targetId}`);
                if (famRes.ok) {
                  const famData = await famRes.json();
                  setActiveFamily(famData.family || famData);
                }
              } catch (err) {
                console.error('Failed to load active family:', err);
              }
            }
          }
        }
      })
      .catch((e) => console.error('Failed to load families:', e))
      .finally(() => {
        setFamiliesLoading(false);
        setActiveFamilyLoading(false);
      });
  }, []);

  // Compute real metrics from active family members
  const members = activeFamily?.members || [];
  const pedigreeSize = members.length;
  const generationCount = new Set(
    members
      .map((m: any) => m.generation || (m.generation_index ? `Gen ${m.generation_index}` : null))
      .filter(Boolean)
  ).size;

  const uniquePhenotypes: string[] = Array.from(
    new Set<string>(
      members.flatMap((m: any) => {
        const list: string[] = [];
        if (Array.isArray(m.conditions)) list.push(...m.conditions);
        if (m.trait_or_disorder_name) list.push(m.trait_or_disorder_name);
        if (m.condition_locus) list.push(m.condition_locus);
        if (m.inherited_conditions) {
          if (Array.isArray(m.inherited_conditions)) list.push(...m.inherited_conditions);
          else list.push(m.inherited_conditions);
        }
        if (m.is_carrier && !list.length) list.push('Carrier Trait');
        if (m.is_affected && !list.length) list.push('Affected Trait');
        return list.map((c: any) => (typeof c === 'string' ? c : c?.name || c?.condition_name || '')).filter(Boolean);
      })
    )
  );

  const carrierCount = members.filter((m: any) => m.is_carrier).length;
  const affectedCount = members.filter((m: any) => m.is_affected).length;
  const isConsanguineous = !!activeFamily?.is_consanguineous;
  const aiRiskCount = carrierCount + affectedCount + (isConsanguineous ? 1 : 0);

  const spouse = members.find((m: any) =>
    ['spouse', 'wife', 'husband', 'partner'].includes((m.relationship_to_proband || '').toLowerCase())
  );

  const completenessPercentage = React.useMemo(() => {
    if (!members.length) return 0;
    let totalScore = 0;
    members.forEach((m: any) => {
      let memberScore = 0;
      if (m.full_name || m.name || m.pseudonym) memberScore += 25;
      if (m.sex && m.sex !== 'unknown') memberScore += 25;
      if (m.relationship_to_proband) memberScore += 25;
      if (
        (m.conditions && m.conditions.length > 0) ||
        m.medical_history ||
        m.is_carrier ||
        m.is_affected ||
        m.dob ||
        m.living_status ||
        m.age_or_age_at_death
      ) {
        memberScore += 25;
      }
      totalScore += memberScore;
    });
    return Math.min(100, Math.max(10, Math.round(totalScore / members.length)));
  }, [members]);

  const handleExportPDF = async () => {
    const svgElement = document.getElementById('pedigree-svg-root');
    if (!svgElement) {
      alert('Pedigree canvas is not currently rendered or ready to export.');
      return;
    }

    try {
      setExportingPDF(true);
      const canvas = await html2canvas(svgElement as any, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const famId = activeFamily?.family_id || 'FA-000001';
      pdf.save(`pedigree-${famId}-clinical-report.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleDeleteFamily = async (familyId: string, familyName?: string) => {
    if (!confirm(`Are you sure you want to delete family chart "${familyName || familyId}"? The chart will be removed, but all family members will be preserved in your database.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/families/${familyId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete family chart.');
      }
      setFamilies((prev) => prev.filter((f) => f.family_id !== familyId));
    } catch (e: any) {
      console.error('Delete chart error:', e);
      alert(e.message || 'Failed to delete chart. Please try again.');
    }
  };

  // Interactive AI Question State
  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
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
        `Care AI analyzed your question regarding "${questionText}": Based on your family tree, your records have documented hereditary traits. A simple carrier test with your partner is the safest first step.`
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
                    {t('clinical_node_active', activeLocale)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09332c] tracking-tight">
                  {t('good_morning', activeLocale)}, {firstName}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeLocale === 'ar' ? (
                    members.length > 0 ? (
                      <>
                        تبدأ رحلة صحة عائلتك بالفهم السليم. تشير سجلاتك إلى{' '}
                        <strong className="text-slate-800 font-bold">{completenessPercentage}% اكتمال البيانات</strong> عبر{' '}
                        {generationCount} {generationCount === 1 ? 'جيل موثق' : 'أجيال موثقة'} من عائلتك.
                      </>
                    ) : (
                      <>
                        تبدأ رحلة صحة عائلتك بالفهم السليم. تشير سجلاتك إلى{' '}
                        <strong className="text-slate-800 font-bold">0% اكتمال البيانات</strong> عبر 0 أجيال موثقة.
                      </>
                    )
                  ) : (
                    members.length > 0 ? (
                      <>
                        Your family health journey starts with understanding. Your records show{' '}
                        <strong className="text-slate-800 font-bold">{completenessPercentage}% complete details</strong> across{' '}
                        {generationCount} mapped {generationCount === 1 ? 'generation' : 'generations'} of your family.
                      </>
                    ) : (
                      <>
                        Your family health journey starts with understanding. Your records show{' '}
                        <strong className="text-slate-800 font-bold">0% complete details</strong> across 0 mapped generations. Start by creating a pedigree tree.
                      </>
                    )
                  )}
                </p>

                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <Link
                    href="/pedigree?create=true"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('btn_create_pedigree', activeLocale)}</span>
                  </Link>
                  <Link
                    href="/pedigree"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-teal-800" />
                    <span>{t('btn_view_pedigree', activeLocale)}</span>
                  </Link>
                </div>
              </div>

              {/* Right Priority Diagnostic Badge Tile */}
              <div className="flex items-center gap-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-xl border border-slate-200/90 shadow-xs w-full lg:w-auto shrink-0">
                {/* Circular Gauge */}
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
                      strokeDashoffset={251.2 - (251.2 * completenessPercentage) / 100}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black text-slate-800 leading-none">{completenessPercentage}%</span>
                    <span className="text-[9px] text-slate-500 font-bold leading-none mt-1">INDEX</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-teal-800 font-bold">
                    {t('priority_diagnostic', activeLocale)}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {carrierCount > 0
                      ? (activeLocale === 'ar' ? 'يوصى بفحص النواقل الجينية' : 'Carrier Scan Recommended')
                      : affectedCount > 0
                      ? (activeLocale === 'ar' ? 'متابعة سريرية موصى بها' : 'Clinical Follow-up Recommended')
                      : isConsanguineous
                      ? (activeLocale === 'ar' ? 'تقييم زواج الأقارب موصى به' : 'Consanguinity Screening Advised')
                      : members.length > 0
                      ? (activeLocale === 'ar' ? 'فحص صحي شامل' : 'Baseline Genetic Health Scan')
                      : (activeLocale === 'ar' ? 'لا توجد بيانات للفحص' : 'No Priority Diagnostic Data')}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {uniquePhenotypes.length > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold truncate max-w-[160px]">
                        {uniquePhenotypes[0]}
                      </span>
                    ) : activeFamily?.trait_or_disorder_name ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold truncate max-w-[160px]">
                        {activeFamily.trait_or_disorder_name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {members.length > 0 ? 'Standard Panel' : 'None'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[10px] font-bold">
                      {isConsanguineous
                        ? 'Consanguineous'
                        : carrierCount > 0
                        ? (activeLocale === 'ar' ? 'وراثة متنحية' : 'Autosomal Recessive')
                        : (activeLocale === 'ar' ? 'فحص وقائي' : 'Preventative')}
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
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_pedigree_size', activeLocale)}</span>
                    <GitBranch className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 leading-none">{families.length}</span>
                    <span className="text-xs text-slate-500 font-semibold">{families.length === 1 ? 'Tree' : 'Trees'}</span>
                  </div>
                  {families.length > 0 ? (
                    <div className="space-y-1.5 mt-2.5 max-h-28 overflow-y-auto pr-1">
                      {families.map((fam) => {
                        const count = fam.member_count ?? (fam.members?.length || (fam.family_id === activeFamily?.family_id ? activeFamily?.members?.length : null) || 0);
                        return (
                          <div key={fam.family_id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <span className="font-mono font-bold text-teal-800">{fam.family_id}</span>
                            <span className="text-slate-600 font-medium">
                              : {count} {count === 1 ? 'member in tree' : 'members in tree'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        0 pedigree trees created.
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Pedigree size shows the number of pedigree trees of the user and total members in each tree.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>{t('btn_view_canvas', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Link>
              </div>

              {/* Tile 2: Phenotypes */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_phenotypes', activeLocale)}</span>
                    <Dna className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 leading-none">{uniquePhenotypes.length}</span>
                    <span className="text-xs text-slate-500 font-semibold">{t('stat_reported', activeLocale)}</span>
                  </div>
                  {uniquePhenotypes.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex flex-wrap gap-1">
                        {uniquePhenotypes.slice(0, 2).map((pt, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold truncate max-w-[150px]">
                            {pt}
                          </span>
                        ))}
                        {uniquePhenotypes.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            +{uniquePhenotypes.length - 2}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Documented clinical traits and observed health conditions.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        0 clinical traits reported.
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Phenotypes are observable physical traits or clinical conditions (such as blood disorders or inherited traits). No clinical traits are reported yet for this family.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>{t('btn_update_history', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Link>
              </div>

              {/* Tile 3: AI Surveillance */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_ai_surveillance', activeLocale)}</span>
                    <Sparkles className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black leading-none ${aiRiskCount > 0 ? 'text-teal-700' : 'text-slate-900'}`}>{aiRiskCount}</span>
                    <span className="text-xs text-slate-500 font-semibold">{aiRiskCount > 0 ? t('stat_high_priority', activeLocale) : 'Alerts'}</span>
                  </div>
                  {aiRiskCount > 0 ? (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                        {[
                          carrierCount ? `${carrierCount} carrier${carrierCount > 1 ? 's' : ''}` : null,
                          affectedCount ? `${affectedCount} affected` : null,
                          isConsanguineous ? 'Consanguineous union' : null
                        ].filter(Boolean).join(' • ')}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        {t('stat_ai_desc', activeLocale)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        0 elevated risk flags detected.
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        AI surveillance scans your family tree to flag recessive traits and hereditary risks that could pass down to children.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/risk-analysis"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>{t('btn_review_intel', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Link>
              </div>

              {/* Tile 4: Spousal Harmony */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_spousal_harmony', activeLocale)}</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  {spouse ? (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-xs text-teal-800 shrink-0">
                          {(spouse.full_name || spouse.pseudonym || 'P').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                            {spouse.full_name || spouse.pseudonym}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isConsanguineous ? 'Consanguineous Union' : 'Linked Partner'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Carrier traits matched between partners to protect future child health.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 leading-none">0</span>
                        <span className="text-xs text-slate-500 font-semibold">Linked</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        0 partners linked yet.
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Spousal harmony evaluates genetic compatibility between partners before marriage or pregnancy to prevent inherited conditions in future children.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/couple-assessment"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 mt-4 transition"
                >
                  <span>{t('btn_assess_couple', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
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
                              <button
                                type="button"
                                onClick={() => handleDeleteFamily(fam.family_id, fam.family_name || fam.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Chart (Preserves Members in Database)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
              {/* -------------------- LEFT COLUMN (8 COLS) -------------------- */}
              <div className="lg:col-span-8 space-y-5">
                {/* Lineage Pedigree Model Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-[#09332c]">
                          Lineage Pedigree Model
                        </h2>
                        {activeFamily && (
                          <span className="text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/80">
                            {activeFamily.family_name || activeFamily.name || `Family ${activeFamily.family_id}`}
                          </span>
                        )}
                        {members.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {members.length} {members.length === 1 ? 'member' : 'members'}
                          </span>
                        )}
                        {generationCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 font-bold text-[10px]">
                            {generationCount} {generationCount === 1 ? 'Generation' : 'Generations'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Interactive clinical pedigree chart showing family relationships, carriers, and phenotypes.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <Link
                        href="/pedigree"
                        className="px-2.5 py-1 rounded-lg text-slate-700 hover:bg-white hover:text-teal-900 transition text-xs font-semibold flex items-center gap-1.5"
                        title="Open in Pedigree Studio"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-teal-800" />
                        <span>Interactive Studio</span>
                      </Link>
                    </div>
                  </div>

                  {/* Real Interactive SVG Tree Canvas */}
                  {activeFamilyLoading ? (
                    <div className="w-full h-[620px] bg-slate-50/70 rounded-2xl border border-slate-200/80 flex items-center justify-center text-slate-400 text-xs">
                      Loading family pedigree model...
                    </div>
                  ) : members.length > 0 ? (
                    <div className="w-full h-[620px] rounded-2xl overflow-hidden relative">
                      <PedigreeCanvas
                        members={members}
                        isConsanguineous={isConsanguineous}
                        className="h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[400px] bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <GitBranch className="w-10 h-10 text-slate-300" />
                      <h3 className="text-sm font-bold text-slate-700">No Relatives in Default Tree</h3>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Open the full interactive editor to add parents, siblings, children, and partners to your pedigree chart.
                      </p>
                      <Link
                        href="/pedigree"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Relatives in Editor</span>
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1">
                    <Link
                      href="/pedigree"
                      className="text-xs font-bold text-slate-500 hover:text-teal-800 transition flex items-center gap-1"
                    >
                      <span>Open Full Interactive Editor</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
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

              {/* -------------------- RIGHT COLUMN (4 COLS) -------------------- */}
              <div className="lg:col-span-4 space-y-5">
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

                {/* Ask Care AI Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Ask Care AI</h2>
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
                        <span>Care AI Health Answer:</span>
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
