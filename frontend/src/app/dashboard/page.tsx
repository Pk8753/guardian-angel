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
  Trash2,
  UploadCloud,
  Lock,
  X,
  Check,
  Copy,
  Download,
  FileCheck
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

  const loadFamilies = async (preferredFamilyId?: string) => {
    try {
      const res = await fetch('/api/families');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.families || [];
        setFamilies(list);

        if (list.length > 0) {
          let targetId = preferredFamilyId;
          if (!targetId || !list.find((f: any) => f.family_id === targetId)) {
            const sortedByMembers = [...list].sort((a: any, b: any) => {
              const countA = a.member_count ?? (a.members?.length || 0);
              const countB = b.member_count ?? (b.members?.length || 0);
              return countB - countA;
            });
            targetId = sortedByMembers[0]?.family_id || list[0].family_id;
          }

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
    } catch (e) {
      console.error('Failed to load families:', e);
    } finally {
      setFamiliesLoading(false);
      setActiveFamilyLoading(false);
    }
  };

  useEffect(() => {
    loadFamilies();
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

  // Premarital & Genetic Screening Report Upload (Zero-Storage In-Memory Parsing)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedReportData, setAnalyzedReportData] = useState<any | null>(null);
  const [copiedAudit, setCopiedAudit] = useState(false);

  // Pedigree Tree Linkage & "Upload Another Report" State
  const [uploadTreeDestination, setUploadTreeDestination] = useState<'new' | 'existing'>('new');
  const [selectedTargetFamilyId, setSelectedTargetFamilyId] = useState<string>('');
  const [isChoosingDestination, setIsChoosingDestination] = useState<boolean>(false);
  const [latestUploadMeta, setLatestUploadMeta] = useState<any | null>(null);
  const [uploadGender, setUploadGender] = useState<'auto' | 'male' | 'female'>('auto');
  const [uploadCandidateName, setUploadCandidateName] = useState<string>('');
  const [uploadDob, setUploadDob] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setAnalyzedReportData(null);
    const file = e.target.files?.[0];
    if (!file) {
      setReportFile(null);
      return;
    }

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isJpg = name.endsWith('.jpg') || name.endsWith('.jpeg');

    if (!isPdf && !isJpg) {
      setReportFile(null);
      setFileError('Invalid format. Upload must be a PDF (.pdf) or JPG (.jpg, .jpeg) file only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setReportFile(null);
      setFileError(`File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 10 MB.`);
      return;
    }

    setReportFile(file);
  };

  const handleUploadAndAnalyze = async () => {
    if (!reportFile) return;
    setIsAnalyzing(true);
    setFileError(null);

    try {
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('target_tree', uploadTreeDestination);
      if (uploadGender !== 'auto') {
        formData.append('gender', uploadGender);
      }
      if (uploadCandidateName.trim()) {
        formData.append('candidate_name', uploadCandidateName.trim());
      }
      if (uploadDob.trim()) {
        formData.append('dob', uploadDob.trim());
      }
      if (uploadTreeDestination === 'existing' && selectedTargetFamilyId) {
        formData.append('family_id', selectedTargetFamilyId);
      }

      const res = await fetch('/api/reports/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to analyze report.');
      }

      setAnalyzedReportData(data.masked_data);
      const meta = {
        family_id: data.family_id,
        family_name: data.family_name,
        tree_created: data.tree_created,
        member_id: data.member_id,
        sudo_name: data.sudo_name,
        sex: data.sex,
        dob: data.dob,
        location: data.location || data.masked_data?.location || ''
      };
      setLatestUploadMeta(meta);

      // Re-fetch families to immediately reflect new tree or added member on dashboard
      if (data.family_id) {
        setSelectedTargetFamilyId(data.family_id);
        loadFamilies(data.family_id);
      }
    } catch (err: any) {
      setFileError(err.message || 'Unable to analyze report. Please verify connection to backend server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInitiateUploadAnother = () => {
    const currentFamId = latestUploadMeta?.family_id || activeFamily?.family_id || (families[0]?.family_id ?? '');
    setSelectedTargetFamilyId(currentFamId);
    setReportFile(null);
    setFileError(null);
    setAnalyzedReportData(null);
    setIsChoosingDestination(true);
  };

  const handleResetUpload = () => {
    setReportFile(null);
    setFileError(null);
    setAnalyzedReportData(null);
    setIsChoosingDestination(false);
    setUploadTreeDestination('new');
    setUploadGender('auto');
    setUploadCandidateName('');
    setUploadDob('');
    setLatestUploadMeta(null);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    handleResetUpload();
  };

  const handleCopyMaskedJson = () => {
    if (!analyzedReportData) return;
    navigator.clipboard.writeText(JSON.stringify(analyzedReportData, null, 2));
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2500);
  };

  const isValidForUpload = Boolean(
    reportFile &&
    !fileError &&
    reportFile.size <= 10 * 1024 * 1024 &&
    (reportFile.name.toLowerCase().endsWith('.pdf') ||
     reportFile.name.toLowerCase().endsWith('.jpg') ||
     reportFile.name.toLowerCase().endsWith('.jpeg'))
  );

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans text-pine">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5">
            {/* ==================== 1. TOP WELCOME HERO BANNER ==================== */}
            <div className="relative w-full bg-white rounded-2xl p-6 sm:p-7 shadow-[0_1px_4px_rgba(12,50,44,0.04)] border border-outline-variant/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Welcome Copy */}
              <div className="flex flex-col max-w-2xl space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-pine tracking-tight">
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('btn_create_pedigree', activeLocale)}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-mint/25 hover:bg-mint/40 text-pine border border-mint rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Upload Genetic Testing or Premarital Screening Report"
                  >
                    <UploadCloud className="w-4 h-4 text-pine" />
                    <span>{t('btn_upload_screening_report', activeLocale)}</span>
                  </button>
                </div>
              </div>

              {/* Right Priority Diagnostic Badge Tile */}
              <div className="flex items-center gap-4 bg-gradient-to-br from-fog-light to-mint/15 p-4 rounded-xl border border-outline-variant/40 shadow-xs w-full lg:w-auto shrink-0">
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
                      className="text-jungle fill-transparent transition-all duration-1000 ease-out"
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
                    <span className="text-xl font-black text-pine leading-none">{completenessPercentage}%</span>
                    <span className="text-[9px] text-on-surface-variant font-bold leading-none mt-1">INDEX</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-pine font-bold">
                    {t('priority_diagnostic', activeLocale)}
                  </span>
                  <h4 className="text-sm font-bold text-pine mt-0.5">
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
                    <span className="px-2 py-0.5 rounded bg-mint/25 text-pine text-[10px] font-bold border border-mint">
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
              <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-[0_1px_3px_rgba(12,50,44,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_pedigree_size', activeLocale)}</span>
                    <GitBranch className="w-4 h-4 text-pine/60" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-pine leading-none">{families.length}</span>
                    <span className="text-xs text-on-surface-variant font-semibold">{families.length === 1 ? 'Tree' : 'Trees'}</span>
                  </div>
                  {families.length > 0 ? (
                    <div className="space-y-1.5 mt-2.5 max-h-28 overflow-y-auto pr-1">
                      {families.map((fam) => {
                        const count = fam.member_count ?? (fam.members?.length || (fam.family_id === activeFamily?.family_id ? activeFamily?.members?.length : null) || 0);
                        return (
                          <div key={fam.family_id} className="flex items-center justify-between text-[11px] bg-fog px-2 py-1 rounded-md border border-outline-variant/20">
                            <span className="font-mono font-bold text-pine">{fam.family_id}</span>
                            <span className="text-on-surface-variant font-medium">
                              : {count} {count === 1 ? 'member in tree' : 'members in tree'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-on-surface font-medium leading-relaxed">
                        0 pedigree trees created.
                      </p>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        Pedigree size shows the number of pedigree trees of the user and total members in each tree.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-waterhole hover:text-waterhole-dark mt-4 transition"
                >
                  <span>{t('btn_view_canvas', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Link>
              </div>

              {/* Tile 2: Phenotypes */}
              <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-[0_1px_3px_rgba(12,50,44,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_phenotypes', activeLocale)}</span>
                    <Dna className="w-4 h-4 text-pine/60" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-pine leading-none">{uniquePhenotypes.length}</span>
                    <span className="text-xs text-on-surface-variant font-semibold">{t('stat_reported', activeLocale)}</span>
                  </div>
                  {uniquePhenotypes.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex flex-wrap gap-1">
                        {uniquePhenotypes.slice(0, 2).map((pt, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-mint/25 text-pine border border-mint text-[10px] font-bold truncate max-w-[150px]">
                            {pt}
                          </span>
                        ))}
                        {uniquePhenotypes.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-fog text-pine text-[10px] font-bold">
                            +{uniquePhenotypes.length - 2}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        Documented clinical traits and observed health conditions.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-on-surface font-medium leading-relaxed">
                        0 clinical traits reported.
                      </p>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        Phenotypes are observable physical traits or clinical conditions (such as blood disorders or inherited traits). No clinical traits are reported yet for this family.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/pedigree"
                  className="inline-flex items-center gap-1 text-xs font-bold text-waterhole hover:text-waterhole-dark mt-4 transition"
                >
                  <span>{t('btn_update_history', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Link>
              </div>

              {/* Tile 3: AI Surveillance */}
              <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-[0_1px_3px_rgba(12,50,44,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_ai_surveillance', activeLocale)}</span>
                    <Sparkles className="w-4 h-4 text-jungle" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black leading-none ${aiRiskCount > 0 ? 'text-pine' : 'text-on-surface'}`}>{aiRiskCount}</span>
                    <span className="text-xs text-on-surface-variant font-semibold">{aiRiskCount > 0 ? t('stat_high_priority', activeLocale) : 'Alerts'}</span>
                  </div>
                  {aiRiskCount > 0 ? (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-pine font-semibold leading-relaxed">
                        {[
                          carrierCount ? `${carrierCount} carrier${carrierCount > 1 ? 's' : ''}` : null,
                          affectedCount ? `${affectedCount} affected` : null,
                          isConsanguineous ? 'Consanguineous union' : null
                        ].filter(Boolean).join(' • ')}
                      </p>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        {t('stat_ai_desc', activeLocale)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-on-surface font-medium leading-relaxed">
                        0 elevated risk flags detected.
                      </p>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        AI surveillance scans your family tree to flag recessive traits and hereditary risks that could pass down to children.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/risk-analysis"
                  className="inline-flex items-center gap-1 text-xs font-bold text-waterhole hover:text-waterhole-dark mt-4 transition"
                >
                  <span>{t('btn_review_intel', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Link>
              </div>

              {/* Tile 4: Spousal Harmony */}
              <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-[0_1px_3px_rgba(12,50,44,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('stat_spousal_harmony', activeLocale)}</span>
                    <Users className="w-4 h-4 text-pine/60" />
                  </div>
                  {spouse ? (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-mint/30 border border-mint flex items-center justify-center font-bold text-xs text-pine shrink-0">
                          {(spouse.full_name || spouse.pseudonym || 'P').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-pine leading-tight truncate">
                            {spouse.full_name || spouse.pseudonym}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-jungle-dark mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-jungle" />
                            {isConsanguineous ? 'Consanguineous Union' : 'Linked Partner'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        Carrier traits matched between partners to protect future child health.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-pine leading-none">0</span>
                        <span className="text-xs text-on-surface-variant font-semibold">Linked</span>
                      </div>
                      <p className="text-[11px] text-on-surface font-medium leading-relaxed">
                        0 partners linked yet.
                      </p>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        Spousal harmony evaluates genetic compatibility between partners before marriage or pregnancy to prevent inherited conditions in future children.
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  href="/couple-assessment"
                  className="inline-flex items-center gap-1 text-xs font-bold text-waterhole hover:text-waterhole-dark mt-4 transition"
                >
                  <span>{t('btn_assess_couple', activeLocale)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </Link>
              </div>
            </div>

            {/* ==================== 2.5. FAMILY PEDIGREE CHARTS LIST & MANAGER ==================== */}
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-pine">
                      Your Family Pedigree Charts
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-mint/25 border border-mint text-pine font-bold text-[11px]">
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
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant text-[11px] uppercase tracking-wider bg-fog/60">
                      <th className="py-3 px-4 font-bold rounded-l-xl">Family ID</th>
                      <th className="py-3 px-4 font-bold">Chart Title</th>
                      <th className="py-3 px-4 font-bold">Proband (Starting Person)</th>
                      <th className="py-3 px-4 font-bold">Member Count</th>
                      <th className="py-3 px-4 font-bold">Last Updated</th>
                      <th className="py-3 px-4 font-bold">Share Status</th>
                      <th className="py-3 px-4 font-bold text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {familiesLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                          Loading your pedigree charts...
                        </td>
                      </tr>
                    ) : families.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <GitBranch className="w-8 h-8 text-outline-variant" />
                            <p className="font-semibold text-pine">No Family Pedigrees Created Yet</p>
                            <p className="text-[11px] text-on-surface-variant max-w-sm">
                              Click "Create Family Pedigree" to build your first standard clinical health tree with automatic genetic links.
                            </p>
                            <Link
                              href="/pedigree?create=true"
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Family Pedigree</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      families.map((fam) => (
                        <tr key={fam.family_id} className="hover:bg-fog/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-pine">
                            <span className="px-2 py-0.5 bg-fog border border-outline-variant/40 rounded-md">
                              {fam.family_id}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-pine">
                            {fam.family_name || fam.name || `Family ${fam.family_id}`}
                            {fam.trait_or_disorder_name && (
                              <span className="block text-[10px] font-normal text-on-surface-variant truncate max-w-[220px]">
                                {fam.trait_or_disorder_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-pine" />
                              {fam.proband_name || 'Proband'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-on-surface">
                            <span className="px-2 py-0.5 bg-fog rounded-md text-[11px] border border-outline-variant/30">
                              {fam.member_count ?? 1} {fam.member_count === 1 ? 'member' : 'members'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                            {fam.updated_at ? new Date(fam.updated_at).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="py-3.5 px-4">
                            {fam.share_enabled ? (
                              <span className="px-2 py-0.5 rounded-full bg-jungle/15 text-pine border border-jungle/40 font-bold text-[10px]">
                                Link Shared
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-fog text-on-surface-variant border border-outline-variant/20 font-semibold text-[10px]">
                                Private
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/pedigree?family_id=${fam.family_id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-pine hover:bg-pine-light text-white rounded-lg text-xs font-bold transition shadow-xs"
                              >
                                <span>Open Chart</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              {fam.share_token && (
                                <Link
                                  href={`/pedigree/share/${fam.share_token}`}
                                  target="_blank"
                                  className="p-1.5 text-on-surface-variant hover:text-pine hover:bg-fog rounded-lg transition"
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
                <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-pine">
                          Lineage Pedigree Model
                        </h2>
                        {activeFamily && (
                          <span className="text-sm font-bold text-pine bg-mint/25 px-2.5 py-0.5 rounded-lg border border-mint">
                            {activeFamily.family_name || activeFamily.name || `Family ${activeFamily.family_id}`}
                          </span>
                        )}
                        {members.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-fog text-pine font-semibold text-[11px] border border-outline-variant/20">
                            {members.length} {members.length === 1 ? 'member' : 'members'}
                          </span>
                        )}
                        {generationCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-mint/30 text-pine border border-mint font-bold text-[10px]">
                            {generationCount} {generationCount === 1 ? 'Generation' : 'Generations'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Interactive clinical pedigree chart showing family relationships, carriers, and phenotypes.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-fog p-1 rounded-xl border border-outline-variant/30">
                      <Link
                        href="/pedigree"
                        className="px-2.5 py-1 rounded-lg text-waterhole hover:bg-white hover:text-waterhole-dark transition text-xs font-semibold flex items-center gap-1.5"
                        title="Open in Pedigree Studio"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-waterhole" />
                        <span>Interactive Studio</span>
                      </Link>
                    </div>
                  </div>

                  {/* Real Interactive SVG Tree Canvas */}
                  {activeFamilyLoading ? (
                    <div className="w-full h-[620px] bg-fog rounded-2xl border border-outline-variant/40 flex items-center justify-center text-on-surface-variant text-xs">
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
                    <div className="w-full h-[400px] bg-fog rounded-2xl border border-outline-variant/40 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <GitBranch className="w-10 h-10 text-outline-variant" />
                      <h3 className="text-sm font-bold text-pine">No Relatives in Default Tree</h3>
                      <p className="text-xs text-on-surface-variant max-w-sm">
                        Open the full interactive editor to add parents, siblings, children, and partners to your pedigree chart.
                      </p>
                      <Link
                        href="/pedigree"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Relatives in Editor</span>
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1">
                    <Link
                      href="/pedigree"
                      className="text-xs font-bold text-waterhole hover:text-waterhole-dark transition flex items-center gap-1"
                    >
                      <span>Open Full Interactive Editor</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                    </Link>
                  </div>
                </div>

                {/* Understanding Consanguinity & Hereditary Lineages Literacy Card */}
                <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pine">
                    <ShieldCheck className="w-4 h-4 text-jungle" />
                    <span>GENOMIC LITERACY</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-pine leading-tight">
                    Understanding Shared Family Bloodlines &amp; Hereditary Health
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    {/* Family Photo Representation */}
                    <div className="sm:col-span-5 rounded-xl overflow-hidden shadow-sm h-44 border border-outline-variant/40 relative bg-fog">
                      <img
                        src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80"
                        alt="Family Health"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Educational Text in Simple English */}
                    <div className="sm:col-span-7 space-y-3">
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Marrying within the family is a deeply respected and valued tradition in many cultures.
                        Modern genetic testing gives couples clear, private knowledge—spotting shared hidden
                        traits early so you can take simple steps to keep future generations healthy and thriving.
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-outline-variant/20 text-[11px]">
                        <Link
                          href="/risk-analysis"
                          className="inline-flex items-center gap-1 font-bold text-waterhole hover:text-waterhole-dark transition"
                        >
                          <span>Read 5-min Clinical Summary</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-on-surface-variant/70 font-medium">
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
                <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-jungle" />
                      <h2 className="text-sm font-bold text-pine uppercase tracking-wide">
                        Action Directives
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold text-midnight bg-midnight/10 px-2 py-0.5 rounded-full tracking-wider">
                      TIER 1 CLINICAL
                    </span>
                  </div>

                  {/* Sub-card 1: Pre-Marital Gene Panel */}
                  <div className="p-4 rounded-xl bg-fog/60 border border-outline-variant/30 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-waterhole/10 border border-waterhole/20 text-waterhole flex items-center justify-center font-bold">
                          <Dna className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-pine">Pre-Marital Gene Panel</h4>
                          <span className="text-[11px] text-on-surface-variant">
                            Recommended for Fatima &amp; {firstName}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                        Urgent
                      </span>
                    </div>

                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      A simple blood screening checking for Beta-Thalassemia, G6PD, and Cystic Fibrosis
                      at an accredited hospital so you have clear answers before marriage.
                    </p>

                    <button
                      type="button"
                      onClick={() => setPanelScheduled(true)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs ${
                        panelScheduled
                          ? 'bg-pine text-white'
                          : 'bg-pine hover:bg-pine-light text-white'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{panelScheduled ? 'Panel Scheduled (Lab Order #902)' : 'Schedule Gene Panel'}</span>
                    </button>
                  </div>

                  {/* Sub-card 2: Doctor Video Consultation */}
                  <div className="p-4 rounded-xl bg-fog/60 border border-outline-variant/30 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80"
                          alt="Dr. Alisha Patel"
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/40"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-pine">Dr. Alisha Patel</h4>
                          <span className="text-[11px] text-on-surface-variant">
                            Consultant Genetic Counsellor (FACMG)
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-outline-variant/30 text-pine text-[10px] font-bold flex items-center gap-1">
                        <Video className="w-3 h-3 text-pine" />
                        <span>Video</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white border border-outline-variant/30 text-pine text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-pine/60" />
                        Thursday &bull; 14:00 (GST)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-outline-variant/30 text-pine text-[10px] font-semibold">
                        45 Mins
                      </span>
                    </div>

                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      A friendly private video appointment to discuss your results and answer any questions
                      about having healthy children.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => alert('Rescheduling calendar opened...')}
                        className="py-2 px-3 text-xs font-semibold text-pine bg-white hover:bg-fog border border-outline-variant/40 rounded-xl transition text-center"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingConfirmed(true)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition text-center shadow-xs ${
                          bookingConfirmed
                            ? 'bg-pine text-white'
                            : 'bg-pine hover:bg-pine-light text-white'
                        }`}
                      >
                        {bookingConfirmed ? 'Confirmed!' : 'Confirm Booking'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ask Care AI Card */}
                <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-pine">Ask Care AI</h2>
                      <p className="text-[11px] text-on-surface-variant">
                        Ask any question about your family health in plain English
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-mint/25 text-pine text-[10px] font-bold border border-mint">
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
                      className="w-full pl-3.5 pr-11 py-2.5 text-xs rounded-xl bg-fog border border-outline-variant/30 text-pine placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 w-7 h-7 rounded-full bg-pine text-white flex items-center justify-center hover:bg-pine-light transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* AI Answer Box */}
                  {aiAnswer && (
                    <div className="p-3.5 bg-mint/20 border border-mint rounded-xl space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-pine">
                        <Sparkles className="w-3.5 h-3.5 text-jungle" />
                        <span>Care AI Health Answer:</span>
                      </div>
                      <p className="text-pine leading-relaxed text-[11px]">{aiAnswer}</p>
                    </div>
                  )}

                  {/* Suggested Inquiries */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                      SUGGESTED INQUIRIES
                    </span>
                    <div className="space-y-1">
                      {suggestedQuestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAskQuestion(item.q)}
                          className="w-full text-left p-2 rounded-lg bg-fog hover:bg-fog-dark border border-outline-variant/30 text-xs text-pine flex items-center gap-2 transition cursor-pointer"
                        >
                          <Search className="w-3 h-3 text-pine/50 shrink-0" />
                          <span className="truncate">{item.q}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20 text-[10px] text-on-surface-variant/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-jungle shrink-0" />
                    <span>Your questions and health data are private, encrypted, and never shared.</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ==================== PREMARITAL & GENETIC REPORT UPLOAD MODAL ==================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-outline-variant/20 flex items-center justify-between gap-4 bg-fog/30">
              <h3 className="text-lg sm:text-xl font-extrabold text-pine tracking-tight">
                {activeLocale === 'ar' ? 'تقرير الفحص الجيني / فحص ما قبل الزواج' : 'Genetic Testing & Premarital Screening Report'}
              </h3>

              <button
                type="button"
                onClick={handleCloseUploadModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Motivating & Uplifting Phrase */}
            <div className="px-6 pt-4">
              <div className="p-4 bg-mint/15 rounded-2xl border border-mint/40 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-pine text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-mint" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                    {activeLocale === 'ar' ? 'رسالة أمل وتمكين وراثي' : 'Proactive Hereditary Awareness'}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {activeLocale === 'ar'
                      ? 'تمكين مستقبل عائلتك من خلال الوعي الجيني الاستباقي. كل نتيجة فحص تنير الطريق نحو تخطيط أسري آمن وأجيال قادمة أكثر صحة وعافية.'
                      : 'Empowering your family’s tomorrow through proactive genomic awareness. Every test result illuminates the path toward safe family planning and healthier future generations.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {isChoosingDestination ? (
                /* ==================== DESTINATION SELECTION VIEW ==================== */
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h4 className="text-base font-extrabold text-pine">Where should this report member be added?</h4>
                    <p className="text-xs text-slate-500">
                      Select whether this individual belongs to the existing family pedigree tree or requires a brand new tree.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Option 1: Add to Existing Tree */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadTreeDestination('existing');
                        setIsChoosingDestination(false);
                      }}
                      className="p-4 rounded-2xl border-2 text-left transition cursor-pointer hover:border-pine bg-white border-outline-variant/50 hover:bg-surface-container-low group flex flex-col justify-between shadow-xs hover:shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-pine group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-pine">Add to Existing Tree</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Link this individual into the current pedigree chart as a spouse/partner or relative.
                        </p>
                      </div>
                      <div className="mt-4 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-pine bg-fog px-2.5 py-0.5 rounded border border-outline-variant/30">
                          {selectedTargetFamilyId || activeFamily?.family_id || 'Current Chart'}
                        </span>
                        <span className="text-xs text-pine font-bold group-hover:translate-x-0.5 transition">Select &rarr;</span>
                      </div>
                    </button>

                    {/* Option 2: Create a New Tree */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadTreeDestination('new');
                        setIsChoosingDestination(false);
                      }}
                      className="p-4 rounded-2xl border-2 text-left transition cursor-pointer hover:border-pine bg-white border-outline-variant/50 hover:bg-surface-container-low group flex flex-col justify-between shadow-xs hover:shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-jungle group-hover:scale-110 transition" />
                          <span className="font-bold text-xs text-pine">Create a New Tree</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Start an independent pedigree tree with a brand new chart ID.
                        </p>
                      </div>
                      <div className="mt-4 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-jungle bg-mint/20 px-2.5 py-0.5 rounded border border-mint">
                          New Tree ID (FA-XXXXXX)
                        </span>
                        <span className="text-xs text-pine font-bold group-hover:translate-x-0.5 transition">Select &rarr;</span>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => setIsChoosingDestination(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !analyzedReportData ? (
                /* ==================== STATE 1: UPLOAD & VALIDATE (CLEAN & MINIMAL) ==================== */
                <div className="space-y-4">
                  {/* Target Tree Indicator */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-pine" />
                      <span className="text-slate-600">
                        Target: <strong className="text-pine font-bold">{uploadTreeDestination === 'existing' ? `Existing Tree (${selectedTargetFamilyId || activeFamily?.family_id || 'Active'})` : 'New Pedigree Tree'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChoosingDestination(true)}
                      className="text-[11px] font-bold text-waterhole hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* Individual Gender (Male/Female) Selector */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs">
                    <span className="text-slate-600 font-medium">Individual Gender:</span>
                    <div className="flex items-center gap-1.5">
                      {(['auto', 'male', 'female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setUploadGender(g)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            uploadGender === g
                              ? 'bg-pine text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-outline-variant/30'
                          }`}
                        >
                          {g === 'auto' ? 'Auto-Detect' : g === 'male' ? 'Male (XY)' : 'Female (XX)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Candidate Name & DOB inputs (for photo uploads or custom confirmation) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Candidate Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={uploadCandidateName}
                        onChange={(e) => setUploadCandidateName(e.target.value)}
                        placeholder="Auto-detected from document"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-low text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-pine"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Date of Birth (Optional)
                      </label>
                      <input
                        type="text"
                        value={uploadDob}
                        onChange={(e) => setUploadDob(e.target.value)}
                        placeholder="e.g. DD/MM/YYYY or YYYY-MM-DD"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-low text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-pine"
                      />
                    </div>
                  </div>

                  {/* Drag-and-drop / File Select Box */}
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition cursor-pointer text-center ${
                    reportFile
                      ? 'border-jungle/60 bg-mint/10'
                      : fileError
                        ? 'border-error/50 bg-red-50/40'
                        : 'border-outline-variant/60 hover:border-pine bg-fog/20 hover:bg-fog/40'
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {reportFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-mint flex items-center justify-center mx-auto text-pine shadow-xs">
                          {reportFile.name.toLowerCase().endsWith('.pdf') ? (
                            <FileText className="w-6 h-6 text-pine" />
                          ) : (
                            <FileCheck className="w-6 h-6 text-jungle" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-pine max-w-sm truncate">{reportFile.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {(reportFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for analysis
                          </p>
                        </div>
                        <span className="inline-block text-[10px] font-bold text-waterhole hover:underline pt-1">
                          Click to select a different file
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-outline-variant/40 flex items-center justify-center mx-auto text-pine shadow-xs">
                          <UploadCloud className="w-6 h-6 text-pine" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-pine">
                            Click or drag your premarital screening report here
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Supports PDF or JPG format &bull; Max 10 MB
                          </p>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Visual Validation Notice */}
                  {fileError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  {/* Modal Footer Controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={handleCloseUploadModal}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={!isValidForUpload || isAnalyzing}
                      onClick={handleUploadAndAnalyze}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                        !isValidForUpload || isAnalyzing
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-pine hover:bg-pine-light text-white cursor-pointer shadow-md'
                      }`}
                      title={!isValidForUpload ? 'Please select a valid PDF or JPG file under 10 MB to enable upload' : 'Analyze report'}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Analyzing Report...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload &amp; Analyze</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* ==================== STATE 2: MEANINGFUL CLINICAL ANALYSIS RESULTS ==================== */
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Clean Analysis Status Header with 2-character masked patient name */}
                  <div className="p-3.5 bg-mint/20 border border-mint rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-jungle shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-pine">
                            Report Analysis Complete
                          </span>
                          {analyzedReportData.patient_name_masked && (
                            <span className="px-2 py-0.5 bg-white text-pine font-mono text-[10px] font-bold rounded border border-mint">
                              Patient: {analyzedReportData.patient_name_masked}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600">
                          {analyzedReportData.file_metadata?.original_filename} &bull; Verified finding
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white text-jungle font-semibold text-[11px] rounded-full border border-mint">
                      De-Identified &bull; Private
                    </span>
                  </div>

                  {/* Pedigree Tree & Sudo Member Integration Card */}
                  <div className="p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <GitBranch className="w-4 h-4 text-pine mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-pine">
                            Pedigree Chart: {latestUploadMeta?.family_id || analyzedReportData.family_id}
                          </span>
                          <span className="px-2 py-0.5 bg-mint/30 text-pine font-bold text-[10px] rounded border border-mint">
                            {latestUploadMeta?.tree_created || analyzedReportData.tree_created ? 'New Tree Created' : 'Added to Existing Tree'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          <strong className="text-slate-800">Sudo Member:</strong> {latestUploadMeta?.sudo_name || analyzedReportData.sudo_name} &bull; <strong className="text-slate-800">Sex:</strong> {latestUploadMeta?.sex || analyzedReportData.sex} &bull; <strong className="text-slate-800">DOB:</strong> {latestUploadMeta?.dob || analyzedReportData.dob || 'Not Documented'}
                          {(latestUploadMeta?.location || analyzedReportData.location) && (
                            <> &bull; <strong className="text-slate-800">Location:</strong> {latestUploadMeta?.location || analyzedReportData.location}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/pedigree?family_id=${latestUploadMeta?.family_id || analyzedReportData.family_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pine hover:bg-pine-light text-white text-[11px] font-bold transition shrink-0"
                    >
                      <span>View in Canvas</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Genetic Finding Overview Card */}
                  <div className="p-4 bg-white rounded-2xl border border-outline-variant/40 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Dna className="w-4 h-4 text-pine" />
                        <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                          Identified Genetic Finding
                        </h4>
                      </div>
                      <span className="text-[10px] bg-fog px-2.5 py-0.5 rounded text-slate-600 font-mono font-bold">
                        {analyzedReportData.gene_locus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-fog rounded-xl border border-outline-variant/20 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Condition Name</span>
                        <span className="font-bold text-pine text-sm">{analyzedReportData.condition}</span>
                        <p className="text-[11px] text-slate-500 mt-1">Single-gene carrier trait. Carriers live full, active, healthy lives.</p>
                      </div>

                      <div className="p-3 bg-fog rounded-xl border border-outline-variant/20 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier Variant Details</span>
                        <span className="font-bold text-pine text-sm font-mono">{analyzedReportData.variant}</span>
                        <p className="text-[11px] text-slate-500 mt-1">{analyzedReportData.carrier_status}</p>
                      </div>
                    </div>
                  </div>

                  {/* SCREENING FINDINGS WITH LAB VALUES & CLINICAL MEANINGS */}
                  {analyzedReportData.screening_findings && analyzedReportData.screening_findings.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-outline-variant/40 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-pine" />
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                            Screening Findings &amp; Clinical Values
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {analyzedReportData.screening_findings.length} Parameters Evaluated
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {analyzedReportData.screening_findings.map((finding: any, idx: number) => (
                          <div key={idx} className="p-3 bg-fog/60 rounded-xl border border-outline-variant/20 text-xs space-y-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-1.5">
                              <span className="font-bold text-pine text-xs">{finding.parameter}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-pine bg-white px-2 py-0.5 rounded border border-outline-variant/30">
                                  {finding.value}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Ref: {finding.reference_range}
                                </span>
                                <span className="px-2 py-0.5 bg-mint/30 text-pine font-bold text-[10px] rounded-full border border-mint">
                                  {finding.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                              <strong className="text-slate-700">What this means:</strong> {finding.clinical_meaning}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meaningful Couple & Family Planning Guidance Card */}
                  <div className="p-4 bg-white rounded-2xl border border-outline-variant/40 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                      <Users className="w-4 h-4 text-pine" />
                      <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                        Family Planning &amp; Child Health Guidance
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 text-xs">Offspring Reproductive Risk</span>
                          <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 font-mono text-[10px] font-bold rounded">
                            {analyzedReportData.inheritance_pattern}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          {analyzedReportData.reproductive_risk}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 bg-mint/15 rounded-xl border border-mint/40 space-y-1">
                          <span className="font-bold text-pine text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-jungle shrink-0" />
                            If Your Partner is a Non-Carrier
                          </span>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Your children will be <strong>100% free of condition symptoms</strong>. About 50% will simply inherit healthy carrier status like you.
                          </p>
                        </div>

                        <div className="p-3 bg-fog rounded-xl border border-outline-variant/30 space-y-1">
                          <span className="font-bold text-pine text-[11px] flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-waterhole shrink-0" />
                            If Both Partners are Carriers
                          </span>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            There is a 25% chance of major condition in each pregnancy. Modern medical counseling and pre-conception screening protect this journey.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyMaskedJson}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-fog hover:bg-fog-dark border border-outline-variant/40 text-xs font-bold text-pine transition cursor-pointer"
                        title="Copy Analysis Summary to clipboard"
                      >
                        {copiedAudit ? <Check className="w-3.5 h-3.5 text-jungle" /> : <Copy className="w-3.5 h-3.5 text-pine" />}
                        <span>{copiedAudit ? 'Copied' : 'Copy Summary'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleInitiateUploadAnother}
                        className="px-3 py-2 rounded-xl bg-fog hover:bg-fog-dark border border-outline-variant/40 text-xs font-bold text-slate-700 transition cursor-pointer"
                      >
                        Upload Another Report
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseUploadModal}
                      className="px-5 py-2 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
