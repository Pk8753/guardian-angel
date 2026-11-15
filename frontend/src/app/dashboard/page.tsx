'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { t } from '@/lib/translations';
import { PedigreeCanvas } from '@/components/pedigree/PedigreeCanvas';
import { PatientDashboard } from '@/components/dashboard/PatientDashboard';
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
  FileCheck,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeLocale, viewMode } = useUIStore();
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upload') === 'true') {
        setIsUploadModalOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('upload');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
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

  // Delete Tree Modal State
  const [deleteTreeModalOpen, setDeleteTreeModalOpen] = useState(false);
  const [targetFamilyToDelete, setTargetFamilyToDelete] = useState<string | null>(null);
  const [targetFamilyNameToDelete, setTargetFamilyNameToDelete] = useState<string>('');
  const [deleteWithMembers, setDeleteWithMembers] = useState(false);
  const [treeConfirmInput, setTreeConfirmInput] = useState('');
  const [isDeletingTree, setIsDeletingTree] = useState(false);
  const [deleteTreeError, setDeleteTreeError] = useState<string | null>(null);

  const openDeleteTreeModal = (familyId: string, familyName?: string) => {
    setTargetFamilyToDelete(familyId);
    setTargetFamilyNameToDelete(familyName || familyId);
    setDeleteWithMembers(false);
    setTreeConfirmInput('');
    setDeleteTreeError(null);
    setDeleteTreeModalOpen(true);
  };
  const handleDeleteFamily = openDeleteTreeModal;

  const closeDeleteTreeModal = () => {
    if (isDeletingTree) return;
    setDeleteTreeModalOpen(false);
    setTargetFamilyToDelete(null);
    setTreeConfirmInput('');
    setDeleteTreeError(null);
  };

  const handleConfirmDeleteTree = async () => {
    if (!targetFamilyToDelete) return;
    if (treeConfirmInput.trim().toLowerCase() !== 'confirm') {
      setDeleteTreeError('You must type "confirm" to proceed.');
      return;
    }

    setIsDeletingTree(true);
    setDeleteTreeError(null);

    try {
      const res = await fetch(`/api/families/${targetFamilyToDelete}?delete_members=${deleteWithMembers ? 'true' : 'false'}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_members: deleteWithMembers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete family chart.');
      }

      setFamilies((prev) => prev.filter((f) => f.family_id !== targetFamilyToDelete));
      closeDeleteTreeModal();
    } catch (e: any) {
      console.error('Delete chart error:', e);
      setDeleteTreeError(e.message || 'Failed to delete chart. Please try again.');
    } finally {
      setIsDeletingTree(false);
    }
  };

  // Interactive AI Question State
  interface DashboardChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    source?: string;
    timestamp: string;
  }

  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiReferences, setAiReferences] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [dynamicQueries, setDynamicQueries] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.0-flash');
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [aiLocus, setAiLocus] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [panelScheduled, setPanelScheduled] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<DashboardChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am Care AI. Ask me anything about your premarital screening results, family pedigree carrier traits, or national health policy guidelines.',
      source: 'Care AI Clinical Engine',
      timestamp: 'Now'
    }
  ]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiLoading]);

  const defaultSuggestedQuestions = [
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

  // Load dynamic potential queries generated by Qwen3 based on analyzed reports & pedigree
  const loadDynamicQueries = () => {
    fetch('/api/ai/analyze-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.potential_queries && Array.isArray(data.potential_queries) && data.potential_queries.length > 0) {
          setDynamicQueries(data.potential_queries);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDynamicQueries();
  }, []);

  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;
    const userMsgText = questionText.trim();
    setQuery(userMsgText);
    setIsAiLoading(true);
    setAiLoading(true);
    setAiAnswer(null);
    setAiSource(null);
    setAiLocus(null);
    setThinkingStep('Checking premarital reports & policy documents...');

    const userMsg: DashboardChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, userMsg]);

    const stepTimer = setTimeout(() => {
      setThinkingStep('Synthesizing genetic findings with clinical guidelines...');
    }, 900);

    try {
      const endpoint = selectedModel ? '/api/ai/ask-studio' : '/api/ai/ask';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsgText,
          model: selectedModel,
          view_mode: viewMode
        })
      });
      clearTimeout(stepTimer);

      if (res.ok) {
        const data = await res.json();
        const answerText = data.answer || 'No response generated.';
        const sourceText = data.source || data.model || selectedModel || 'Care AI Clinical Intelligence';
        const locusText = data.locus_reference || null;

        setAiAnswer(answerText);
        setAiSource(sourceText);
        setAiLocus(locusText);

        const aiMsg: DashboardChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: answerText,
          source: sourceText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        if (data.references && Array.isArray(data.references)) {
          setAiReferences(data.references);
        }
        return;
      }
    } catch (err) {
      console.error('Care AI query error:', err);
    } finally {
      clearTimeout(stepTimer);
      setIsAiLoading(false);
      setAiLoading(false);
      setThinkingStep('');
    }

    // Fallback if needed
    const matched = defaultSuggestedQuestions.find(
      (sq) => sq.q.toLowerCase() === userMsgText.toLowerCase()
    );
    const fallbackAnswer = matched
      ? matched.a
      : `Care AI analyzed your question regarding "${userMsgText}": Based on your family health records, your carrier traits are well-documented. Dual-partner carrier testing provides complete clarity.`;
    setAiAnswer(fallbackAnswer);
    setAiSource('Care AI Knowledge Engine');
    const fallbackMsg: DashboardChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: fallbackAnswer,
      source: 'Care AI Knowledge Engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, fallbackMsg]);
  };

  // Premarital & Genetic Screening Report Upload (Zero-Storage In-Memory Parsing)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedReportData, setAnalyzedReportData] = useState<any | null>(null);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [copiedReportText, setCopiedReportText] = useState(false);
  const [reportViewTab, setReportViewTab] = useState<'both' | 'report' | 'analysis'>('both');

  // Pedigree Tree Linkage & "Upload Another Report" State
  const [uploadTreeDestination, setUploadTreeDestination] = useState<'new' | 'existing'>('new');
  const [selectedTargetFamilyId, setSelectedTargetFamilyId] = useState<string>('');
  const [isChoosingDestination, setIsChoosingDestination] = useState<boolean>(false);
  const [latestUploadMeta, setLatestUploadMeta] = useState<any | null>(null);
  const [uploadRelation, setUploadRelation] = useState<string>('');
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
      if (uploadRelation) {
        formData.append('relation', uploadRelation);
      }
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

      const completeText = data.complete_report_text || data.masked_data?.complete_report_text || '';
      const patientName = data.patient_name || data.masked_data?.patient_name || '';

      const enrichedData = {
        ...data.masked_data,
        complete_report_text: completeText,
        patient_name: patientName,
        sudo_name: data.sudo_name || data.masked_data?.sudo_name,
        family_id: data.family_id || data.masked_data?.family_id,
        family_name: data.family_name || data.masked_data?.family_name,
        tree_created: data.tree_created ?? data.masked_data?.tree_created,
        sex: data.sex || data.masked_data?.sex,
        dob: data.dob || data.masked_data?.dob,
        location: data.location || data.masked_data?.location,
        already_exists: !!data.already_exists,
        updated: !!data.updated,
        analysis_message: data.message || '',
        child_node_added: !!data.child_node_added,
        couple_assessment: data.couple_assessment || null,
        target_male: data.target_male || '',
        target_female: data.target_female || '',
      };

      setAnalyzedReportData(enrichedData);
      const meta = {
        family_id: data.family_id,
        family_name: data.family_name,
        tree_created: data.tree_created,
        member_id: data.member_id,
        sudo_name: data.sudo_name,
        patient_name: patientName,
        sex: data.sex,
        dob: data.dob,
        location: data.location || data.masked_data?.location || '',
        complete_report_text: completeText
      };
      setLatestUploadMeta(meta);

      // Re-fetch families to immediately reflect new tree or added member on dashboard
      if (data.family_id) {
        setSelectedTargetFamilyId(data.family_id);
        loadFamilies(data.family_id);
      }
      loadDynamicQueries();
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
    setReportViewTab('both');
    setCopiedReportText(false);
    setIsChoosingDestination(false);
    setUploadTreeDestination('new');
    setUploadRelation('');
    setUploadGender('auto');
    setUploadCandidateName('');
    setUploadDob('');
    setLatestUploadMeta(null);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    handleResetUpload();
  };

  const handleCopyReportText = () => {
    const text = analyzedReportData?.complete_report_text || latestUploadMeta?.complete_report_text || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedReportText(true);
    setTimeout(() => setCopiedReportText(false), 2500);
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
    Boolean(uploadRelation) &&
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

          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-7 space-y-4 sm:space-y-5 pb-24 md:pb-8">
            {viewMode === 'patient' ? (
              <PatientDashboard
                user={user}
                activeFamily={activeFamily}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onAskQuestion={handleAskQuestion}
                query={query}
                setQuery={setQuery}
                aiAnswer={aiAnswer}
                aiLoading={aiLoading}
                aiSource={aiSource}
                aiLocus={aiLocus}
              />
            ) : (
              <>
            {/* ==================== 1. TOP WELCOME HERO BANNER ==================== */}
            <div className="relative w-full bg-white rounded-2xl p-4 sm:p-6 lg:p-7 shadow-[0_1px_4px_rgba(12,50,44,0.04)] border border-outline-variant/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
              {/* Left Welcome Copy */}
              <div className="flex flex-col max-w-2xl space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/25 text-pine font-bold border border-mint text-[11px] tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-jungle animate-pulse" />
                    {t('clinical_node_active', activeLocale)}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-pine tracking-tight">
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

                <div className="pt-2 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Link
                    href="/pedigree?create=true"
                    className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition shadow-xs flex-1 sm:flex-none text-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('btn_create_pedigree', activeLocale)}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 bg-mint/25 hover:bg-mint/40 text-pine border border-mint rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex-1 sm:flex-none text-center"
                    title="Upload Genetic Testing or Premarital Screening Report"
                  >
                    <UploadCloud className="w-4 h-4 text-pine" />
                    <span>{t('btn_upload_screening_report', activeLocale)}</span>
                  </button>
                </div>
              </div>

              {/* Right Priority Diagnostic Badge Tile */}
              <div className="flex items-center gap-3.5 sm:gap-4 bg-gradient-to-br from-fog-light to-mint/15 p-3.5 sm:p-4 rounded-xl border border-outline-variant/40 shadow-xs w-full lg:w-auto shrink-0">
                {/* Circular Gauge */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
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
                    <span className="text-lg sm:text-xl font-black text-pine leading-none">{completenessPercentage}%</span>
                    <span className="text-[8px] sm:text-[9px] text-on-surface-variant font-bold leading-none mt-1">INDEX</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Tile 1: Pedigree Size */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-outline-variant/30 shadow-[0_1px_3px_rgba(12,50,44,0.03)] flex flex-col justify-between">
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

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant text-[11px] uppercase tracking-wider bg-fog/60">
                      <th className="py-3 px-4 font-bold rounded-l-xl">Family ID</th>
                      <th className="py-3 px-4 font-bold">Chart Title</th>
                      <th className="py-3 px-4 font-bold">Key Member</th>
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
                              Click &quot;Create Family Pedigree&quot; or upload report to build your first standard clinical health tree with automatic genetic links.
                            </p>
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
                                onClick={() => openDeleteTreeModal(fam.family_id, fam.family_name || fam.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Chart"
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

              {/* Mobile Card View (Optimized for Mobile Phones) */}
              <div className="md:hidden space-y-3">
                {familiesLoading ? (
                  <div className="py-6 text-center text-slate-400 text-xs">Loading your pedigree charts...</div>
                ) : families.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-2 p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center">
                    <GitBranch className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-xs">No Family Pedigrees Created Yet</p>
                    <Link
                      href="/pedigree?create=true"
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Family Pedigree</span>
                    </Link>
                  </div>
                ) : (
                  families.map((fam) => (
                    <div key={fam.family_id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 rounded font-mono font-bold text-xs text-teal-800">
                          {fam.family_id}
                        </span>
                        {fam.share_enabled ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                            Shared
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            Private
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {fam.family_name || fam.name || `Family ${fam.family_id}`}
                        </h4>
                        {fam.trait_or_disorder_name && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{fam.trait_or_disorder_name}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60">
                        <span>Proband: <strong className="text-slate-800">{fam.proband_name || 'Proband'}</strong></span>
                        <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-bold text-[10px]">
                          {fam.member_count ?? 1} members
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/pedigree?family_id=${fam.family_id}`}
                          className="flex-1 py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition text-center shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>Open Chart</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        {fam.share_token && (
                          <Link
                            href={`/pedigree/share/${fam.share_token}`}
                            target="_blank"
                            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:text-teal-800 hover:bg-slate-100 transition"
                            title="View Shareable Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteFamily(fam.family_id, fam.family_name || fam.name)}
                          className="p-2 text-rose-500 bg-white border border-slate-200 rounded-lg hover:text-rose-700 hover:bg-rose-50 transition"
                          title="Delete Chart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ==================== 3. MAIN 2-COLUMN SECTION ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* -------------------- LEFT COLUMN (8 COLS) -------------------- */}
              <div className="lg:col-span-8 space-y-5">
                {/* Lineage Pedigree Model Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
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
                    <div className="w-full h-[360px] sm:h-[480px] lg:h-[620px] bg-fog rounded-2xl border border-outline-variant/40 flex items-center justify-center text-on-surface-variant text-xs">
                      Loading family pedigree model...
                    </div>
                  ) : members.length > 0 ? (
                    <div className="w-full h-[360px] sm:h-[480px] lg:h-[620px] rounded-2xl overflow-hidden relative">
                      <div className="sm:hidden absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-slate-600 font-medium z-10 pointer-events-none shadow-2xs">
                        Pinch &amp; drag to explore
                      </div>
                      <PedigreeCanvas
                        members={members}
                        isConsanguineous={isConsanguineous}
                        className="h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[320px] sm:h-[400px] bg-fog rounded-2xl border border-outline-variant/40 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <GitBranch className="w-10 h-10 text-outline-variant" />
                      <h3 className="text-sm font-bold text-pine">No Relatives in Default Tree</h3>
                      <p className="text-xs text-on-surface-variant max-w-sm">
                        Open the full interactive editor to add parents, siblings, children, and partners to your pedigree chart.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Screening Report</span>
                      </button>
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
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pine">
                    <ShieldCheck className="w-4 h-4 text-jungle" />
                    <span>GENOMIC LITERACY</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-pine leading-tight">
                    Understanding Shared Family Bloodlines &amp; Hereditary Health
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 items-center">
                    {/* Family Photo Representation */}
                    <div className="sm:col-span-5 rounded-xl overflow-hidden shadow-sm h-36 sm:h-44 border border-outline-variant/40 relative bg-fog">
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
              <div className="lg:col-span-4 space-y-4 sm:space-y-5">
                {/* Ask Care AI Messenger Card (Positioned directly next to Lineage Pedigree Model) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-pine flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-jungle" />
                        Ask Care AI
                      </h2>
                      <p className="text-[11px] text-on-surface-variant">
                        Premarital screening, policy &amp; pedigree intelligence
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-mint/25 text-pine text-[10px] font-bold border border-mint flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Unified Care AI
                    </span>
                  </div>

                  {/* Scrollable Chat Conversation Viewport */}
                  <div
                    ref={chatScrollRef}
                    className="h-80 overflow-y-auto space-y-3 p-3.5 bg-fog/50 rounded-2xl border border-outline-variant/20 scroll-smooth"
                  >
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2'}`}
                      >
                        {msg.sender === 'ai' && (
                          <div className="w-6 h-6 rounded-full bg-mint text-pine flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-pine" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs text-xs space-y-1.5 ${
                            msg.sender === 'user'
                              ? 'bg-pine text-white rounded-tr-xs'
                              : 'bg-white text-pine border border-outline-variant/30 rounded-tl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-line text-[11px]">{msg.text}</p>
                          <div
                            className={`flex items-center justify-between gap-3 text-[9px] pt-0.5 ${
                              msg.sender === 'user' ? 'text-white/70' : 'text-on-surface-variant/70'
                            }`}
                          >
                            {msg.sender === 'ai' && msg.source ? (
                              <span className="font-medium text-teal-800">
                                Source: <span className="underline decoration-mint underline-offset-2">{msg.source}</span>
                              </span>
                            ) : (
                              <span />
                            )}
                            <span className="shrink-0">{msg.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Left-side Care AI Thinking / Loading Bubble */}
                    {isAiLoading && (
                      <div className="flex justify-start items-start gap-2 animate-in fade-in duration-200">
                        <div className="w-6 h-6 rounded-full bg-mint text-pine flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 text-pine animate-spin" />
                        </div>
                        <div className="max-w-[85%] bg-white/95 border border-mint/70 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs space-y-1 text-xs">
                          <div className="flex items-center gap-2 font-bold text-pine">
                            <span className="inline-flex gap-1 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                            <span className="text-[11px] text-pine font-semibold">
                              {thinkingStep || 'Checking premarital reports & policy documents...'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Synthesizing with local Qdrant vectors and your health pedigree...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Question Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (query.trim() && !isAiLoading) handleAskQuestion(query);
                    }}
                    className="relative flex items-center"
                  >
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask about your screening results, policy rules, or risks..."
                      className="w-full pl-3.5 pr-11 py-2.5 text-xs rounded-xl bg-fog border border-outline-variant/30 text-pine placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition"
                    />
                    <button
                      type="submit"
                      disabled={isAiLoading || !query.trim()}
                      className="absolute right-2 w-7 h-7 rounded-full bg-pine text-white flex items-center justify-center hover:bg-pine-light disabled:opacity-40 transition shadow-xs cursor-pointer"
                      title="Send question"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Suggested Inquiries Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                      SUGGESTED INQUIRIES
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(dynamicQueries.length > 0 ? dynamicQueries : defaultSuggestedQuestions.map((d) => d.q)).map((qText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAskQuestion(qText)}
                          disabled={isAiLoading}
                          className="px-2.5 py-1 rounded-lg bg-fog hover:bg-fog-dark border border-outline-variant/30 text-[11px] text-pine flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 text-left"
                        >
                          <Search className="w-3 h-3 text-pine/50 shrink-0" />
                          <span className="truncate max-w-[260px]">{qText}</span>
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

                {/* Action Directives Card (Positioned below Ask Care AI) */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-outline-variant/30 shadow-[0_1px_4px_rgba(12,50,44,0.04)] space-y-4">
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
                  <div className="p-3.5 sm:p-4 rounded-xl bg-fog/60 border border-outline-variant/30 space-y-3">
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
                  <div className="p-3.5 sm:p-4 rounded-xl bg-fog/60 border border-outline-variant/30 space-y-3">
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


              </div>
            </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ==================== PREMARITAL & GENETIC REPORT UPLOAD MODAL ==================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className={`w-full ${analyzedReportData ? 'max-w-4xl' : 'max-w-2xl'} bg-white rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden my-8 transition-all duration-300`}>
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
                  {/* Split Target Row: Tree Indicator (Left) & Mandatory Relation Dropdown (Right) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Left: Shortened Target Tree */}
                    <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GitBranch className="w-3.5 h-3.5 text-pine shrink-0" />
                        <span className="text-slate-600 truncate">
                          Tree: <strong className="text-pine font-bold">{uploadTreeDestination === 'existing' ? (selectedTargetFamilyId || activeFamily?.family_id || 'Active') : 'New Tree'}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChoosingDestination(true)}
                        className="text-[11px] font-bold text-waterhole hover:underline cursor-pointer ml-1.5 shrink-0"
                      >
                        Change
                      </button>
                    </div>

                    {/* Right: Mandatory Relation Dropdown */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="upload-relation-select" className="text-xs font-bold text-pine flex items-center gap-1">
                          <span>Whose report is this?</span>
                          <span className="text-red-500 font-extrabold">*</span>
                        </label>
                        {!uploadRelation && (
                          <span className="text-[10px] text-red-500 font-semibold">Required</span>
                        )}
                      </div>
                      <select
                        id="upload-relation-select"
                        value={uploadRelation}
                        onChange={(e) => setUploadRelation(e.target.value)}
                        className={`w-full text-xs font-semibold px-2.5 py-1.5 bg-white rounded-xl border transition cursor-pointer ${
                          !uploadRelation
                            ? 'border-red-300 focus:border-red-500 bg-red-50/20 text-slate-600'
                            : 'border-outline-variant/60 focus:border-pine text-pine'
                        }`}
                      >
                        <option value="" disabled>-- Select member relation * --</option>
                        <optgroup label="Couples / Primary Targets (Opposite Genders)">
                          <option value="husband">Husband / Groom (Target Male)</option>
                          <option value="wife">Wife / Bride (Target Female)</option>
                          <option value="father">Father (Target Male)</option>
                          <option value="mother">Mother (Target Female)</option>
                          <option value="self_male">Self (Target Male)</option>
                          <option value="self_female">Self (Target Female)</option>
                          <option value="partner_male">Partner (Target Male)</option>
                          <option value="partner_female">Partner (Target Female)</option>
                        </optgroup>
                      </select>
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
                      title={!isValidForUpload ? (!uploadRelation ? 'Please select whose report this is to enable upload' : 'Please select a valid PDF or JPG file under 10 MB to enable upload') : 'Analyze report'}
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
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                  {/* Clean Analysis Status Header with masked patient name and tree linkage */}
                  <div className="p-4 bg-mint/20 border border-mint rounded-2xl space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-jungle shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-pine">
                            Report Analysis Complete
                          </span>
                          {(analyzedReportData.patient_name || analyzedReportData.patient_name_masked) && (
                            <span className="px-2 py-0.5 bg-white text-pine font-mono text-[10px] font-bold rounded border border-mint">
                              Patient: {analyzedReportData.patient_name || analyzedReportData.patient_name_masked}
                            </span>
                          )}
                        </div>
                      </div>
                      {analyzedReportData.family_id && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-white text-pine font-mono text-[11px] font-bold rounded-lg border border-mint">
                            Pedigree Chart: {analyzedReportData.family_id}
                          </span>
                          <span className="px-2 py-0.5 bg-pine text-white text-[10px] font-bold rounded-md">
                            {analyzedReportData.tree_created ? 'New Tree Created' : 'Linked to Existing Tree'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-mint/40 flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-pine">Sudo Member:</span>
                        <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-mint/50">
                          {analyzedReportData.sudo_name}
                        </span>
                        <span>&bull;</span>
                        <span>Sex: <strong className="capitalize">{analyzedReportData.sex || 'female'}</strong></span>
                        <span>&bull;</span>
                        <span>DOB: <strong>{analyzedReportData.dob || 'Not Documented'}</strong></span>
                        <span>&bull;</span>
                        <span>Location: <strong>{analyzedReportData.location || 'Abu Dhabi'}</strong></span>
                      </div>
                      {analyzedReportData.file_metadata?.original_filename && (
                        <span className="text-[11px] text-slate-500">
                          {analyzedReportData.file_metadata.original_filename}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Automatic Child Node & Dual Target Analysis Banner */}
                  {analyzedReportData.child_node_added && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50/80 via-emerald-50/50 to-mint/20 border border-emerald-300 rounded-2xl flex items-start gap-3 text-xs shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-pine text-amber-300 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        ★
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-pine text-xs">
                            Child Star Node Added to Pedigree Tree
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                            Opposite-Gender Targets Linked
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          Both targets are now registered in this tree ({analyzedReportData.target_male || 'Target Male'} &amp; {analyzedReportData.target_female || 'Target Female'}). A projected offspring node (★) has been automatically positioned with inherited carrier transmission probabilities and Qwen clinical assessment.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Upload Re-Identification Banner */}
                  {analyzedReportData.already_exists && (
                    <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-medium shadow-xs">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        user already exist &lt;{analyzedReportData.sudo_name}&gt; : updating its information
                      </span>
                    </div>
                  )}

                  {/* View Segmented Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-fog rounded-xl border border-outline-variant/30 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setReportViewTab('both')}
                      className={`flex-1 py-1.5 px-3 rounded-lg transition text-center cursor-pointer ${
                        reportViewTab === 'both'
                          ? 'bg-white text-pine shadow-xs border border-outline-variant/40'
                          : 'text-slate-600 hover:text-pine'
                      }`}
                    >
                      Complete Report &amp; Analysis
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportViewTab('report')}
                      className={`flex-1 py-1.5 px-3 rounded-lg transition text-center cursor-pointer ${
                        reportViewTab === 'report'
                          ? 'bg-white text-pine shadow-xs border border-outline-variant/40'
                          : 'text-slate-600 hover:text-pine'
                      }`}
                    >
                      Complete PDF Report ({analyzedReportData.complete_report_text ? `${analyzedReportData.complete_report_text.split('\n').filter(Boolean).length} lines` : 'Text'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportViewTab('analysis')}
                      className={`flex-1 py-1.5 px-3 rounded-lg transition text-center cursor-pointer ${
                        reportViewTab === 'analysis'
                          ? 'bg-white text-pine shadow-xs border border-outline-variant/40'
                          : 'text-slate-600 hover:text-pine'
                      }`}
                    >
                      Clinical Analysis
                    </button>
                  </div>

                  {/* COMPLETE EXTRACTED REPORT CARD (PyMuPDF) */}
                  {(reportViewTab === 'both' || reportViewTab === 'report') && (
                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 shadow-md text-white">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Complete Report Content (PyMuPDF)
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Full document text extracted in-memory with PyMuPDF &bull; Unredacted for testing
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyReportText}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-emerald-300 border border-slate-700 transition cursor-pointer"
                            title="Copy extracted report text"
                          >
                            {copiedReportText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                            <span>{copiedReportText ? 'Copied' : 'Copy Full Text'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Monospace Full Text Container */}
                      <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800/80 max-h-60 overflow-y-auto">
                        <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre-wrap break-words leading-relaxed select-text selection:bg-emerald-500 selection:text-black">
                          {analyzedReportData.complete_report_text || 'No text extracted from document.'}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* CLINICAL ANALYSIS CARDS */}
                  {(reportViewTab === 'both' || reportViewTab === 'analysis') && (
                    <>
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
                    </>
                  )}

                  {/* Results Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleCopyReportText}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-fog hover:bg-fog-dark border border-outline-variant/40 text-xs font-bold text-pine transition cursor-pointer"
                        title="Copy Complete Report Text to clipboard"
                      >
                        {copiedReportText ? <Check className="w-3.5 h-3.5 text-jungle" /> : <FileText className="w-3.5 h-3.5 text-pine" />}
                        <span>{copiedReportText ? 'Copied Text' : 'Copy Report Text'}</span>
                      </button>

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

      {/* ==================== DELETE TREE CONFIRMATION MODAL ==================== */}
      {deleteTreeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Family Chart
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {targetFamilyNameToDelete || 'Selected Tree'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteTreeModal}
                disabled={isDeletingTree}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope Choice Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Choose deletion scope:
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: Delete Tree Only */}
                <label
                  onClick={() => setDeleteWithMembers(false)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                    !deleteWithMembers
                      ? 'border-pine bg-mint/10 ring-1 ring-pine'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="dashboardDeleteTreeScope"
                    checked={!deleteWithMembers}
                    onChange={() => setDeleteWithMembers(false)}
                    className="mt-0.5 text-pine focus:ring-pine"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Delete only tree
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Removes this pedigree chart. All members and their health dossiers will be preserved in your database and profile.
                    </span>
                  </div>
                </label>

                {/* Option 2: Delete Tree + Users */}
                <label
                  onClick={() => setDeleteWithMembers(true)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                    deleteWithMembers
                      ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="dashboardDeleteTreeScope"
                    checked={deleteWithMembers}
                    onChange={() => setDeleteWithMembers(true)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">
                      Delete tree and users in this tree
                    </span>
                    <span className="text-[11px] text-rose-700 leading-relaxed block mt-0.5">
                      Permanently removes this chart AND deletes all users/members in this tree from your account, including from the Patient Profile &amp; Details page.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Confirmation Input Prompt */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                To confirm deletion, type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">confirm</span> below:
              </label>
              <input
                type="text"
                value={treeConfirmInput}
                onChange={(e) => setTreeConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && treeConfirmInput.trim().toLowerCase() === 'confirm' && !isDeletingTree) {
                    handleConfirmDeleteTree();
                  }
                }}
                placeholder='type "confirm"'
                autoFocus
                className="w-full h-11 px-3.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>

            {/* Error message */}
            {deleteTreeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {deleteTreeError}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeDeleteTreeModal}
                disabled={isDeletingTree}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTree}
                disabled={treeConfirmInput.trim().toLowerCase() !== 'confirm' || isDeletingTree}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer"
              >
                {isDeletingTree ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingTree ? 'Deleting...' : (deleteWithMembers ? 'Delete Tree & Users' : 'Delete Tree Only')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
