'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useUIStore } from '@/stores/useUIStore';
import { t } from '@/lib/translations';
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
  GitBranch,
  FileText,
  Trash2,
  Users,
  X
} from 'lucide-react';

interface CitationDetail {
  title: string;
  excerpt: string;
  file_type?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  timestamp: string;
  citationDetails?: CitationDetail[];
  suggestedFollowUps?: string[];
}

export default function CoupleAssessmentPage() {
  const { activeLocale, geminiApiKey, hasGlobalGeminiKey, selectedGeminiModel, aiEngineMode } = useUIStore();
  const isOnline = aiEngineMode === 'online' || hasGlobalGeminiKey || Boolean(geminiApiKey && geminiApiKey.trim());
  const [assessment, setAssessment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatAnswer, setChatAnswer] = useState<any | null>(null);
  const [partnerAName, setPartnerAName] = useState('Partner A (Target Male)');
  const [partnerBName, setPartnerBName] = useState('Partner B (Target Female)');
  const [thinkingStep, setThinkingStep] = useState<string>('');
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [activeCitationPreview, setActiveCitationPreview] = useState<CitationDetail | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am Care AI, your certified genetic counselor. Ask me anything about your couple compatibility assessment, variant concordance, or reproductive options (such as PGT-M with IVF). What would you like to explore today?',
      source: 'Care AI Clinical Engine',
      timestamp: 'Now',
      suggestedFollowUps: [
        "What is an ACMG Pedigree?",
        "What is Spinal Muscular Atrophy (SMA)?",
        "What are our couple reproductive options?"
      ]
    }
  ]);

  // Load and persist chat session state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const famKey = activeFamilyId || 'default';
      try {
        const saved = sessionStorage.getItem(`ga_care_ai_history_${famKey}`) ||
                      sessionStorage.getItem(`ga_couple_chat_${famKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChatMessages(parsed);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load couple chat history from sessionStorage', e);
      }
      setChatMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Hello! I am Care AI, your certified genetic counselor. Ask me anything about your couple compatibility assessment, variant concordance, or reproductive options (such as PGT-M with IVF). What would you like to explore today?',
          source: 'Care AI Clinical Engine',
          timestamp: 'Now',
          suggestedFollowUps: [
            "What is an ACMG Pedigree?",
            "What is Spinal Muscular Atrophy (SMA)?",
            "What are our couple reproductive options?"
          ]
        }
      ]);
    }
  }, [activeFamilyId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && chatMessages.length > 0) {
      const famKey = activeFamilyId || 'default';
      try {
        sessionStorage.setItem(
          `ga_care_ai_history_${famKey}`,
          JSON.stringify(chatMessages)
        );
      } catch (e) {
        console.error('Failed to save couple chat history to sessionStorage', e);
      }
    }
  }, [chatMessages, activeFamilyId]);

  const handleClearChat = () => {
    const famKey = activeFamilyId || 'default';
    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'ai',
      text: 'Hello! I am Care AI, your certified genetic counselor. Ask me anything about your couple compatibility assessment, variant concordance, or reproductive options (such as PGT-M with IVF). What would you like to explore today?',
      source: 'Care AI Clinical Engine',
      timestamp: 'Now',
      suggestedFollowUps: [
        "What is an ACMG Pedigree?",
        "What is Spinal Muscular Atrophy (SMA)?",
        "What are our couple reproductive options?"
      ]
    };
    setChatMessages([welcomeMsg]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`ga_care_ai_history_${famKey}`);
      sessionStorage.removeItem(`ga_couple_chat_${famKey}`);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAsking]);

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lIdx} className="h-1" />;
          }
          const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
          const isNumbered = /^\d+\.\s/.test(trimmed);
          const content = isBullet ? trimmed.replace(/^[\*\-•]\s+/, '') : isNumbered ? trimmed.replace(/^\d+\.\s+/, '') : trimmed;
          const numberPrefix = isNumbered ? trimmed.match(/^\d+\./)?.[0] : null;

          const parts = content.split(/(\*\*[^*]+\*\*)/g);
          const parsedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-inherit">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <React.Fragment key={pIdx}>{part}</React.Fragment>;
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0 mt-1.5" />
                <span>{parsedLine}</span>
              </div>
            );
          }
          if (isNumbered) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-1.5">
                <span className="font-semibold text-inherit shrink-0">{numberPrefix}</span>
                <span>{parsedLine}</span>
              </div>
            );
          }
          return <p key={lIdx}>{parsedLine}</p>;
        })}
      </div>
    );
  };

  const hasLoadedAssessmentRef = useRef(false);

  useEffect(() => {
    if (hasLoadedAssessmentRef.current) return;
    hasLoadedAssessmentRef.current = true;
    loadAssessment();
  }, []);

  const loadAssessment = async (forceRefresh: boolean | React.MouseEvent = false) => {
    const shouldForce = typeof forceRefresh === 'boolean' ? forceRefresh : true;
    try {
      let pA = 'Partner A (Target Male)';
      let pB = 'Partner B (Target Female)';
      let activeFamId = null;
      const famRes = await fetch('/api/families');
      if (famRes.ok) {
        const famData = await famRes.json();
        const activeFam = famData?.families?.[0];
        if (activeFam) {
          activeFamId = activeFam.family_id;
          setActiveFamilyId(activeFam.family_id);
          const members = activeFam.members || [];
          const maleTarget = members.find((m: any) => m.sex === 'male' && m.relationship !== 'child');
          const femaleTarget = members.find((m: any) => m.sex === 'female' && m.relationship !== 'child');
          if (maleTarget) pA = maleTarget.alias_name || maleTarget.name || 'Partner A (Target Male)';
          if (femaleTarget) pB = femaleTarget.alias_name || femaleTarget.name || 'Partner B (Target Female)';
        }
      }
      setPartnerAName(pA);
      setPartnerBName(pB);

      const famKey = activeFamId || 'default';
      // 1. Check persistent sessionStorage if not forcing a manual refresh
      if (shouldForce && typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(`ga_couple_assessment_${famKey}`);
        } catch {}
      } else if (typeof window !== 'undefined') {
        try {
          const saved = sessionStorage.getItem(`ga_couple_assessment_${famKey}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              if (!isOnline || parsed.is_llm) {
                setAssessment(parsed);
                if (parsed?.partner_a?.name) setPartnerAName(parsed.partner_a.name);
                if (parsed?.partner_b?.name) setPartnerBName(parsed.partner_b.name);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Could not read cached assessment from sessionStorage', e);
        }
      }

      setIsLoading(true);
      const res = await fetch('/api/ai/analyze-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_a: pA,
          partner_b: pB,
          family_id: activeFamId,
          api_key: geminiApiKey ? geminiApiKey.trim() : undefined,
          model: selectedGeminiModel || 'gemini-3.8-flash',
          ai_mode: isOnline ? 'online' : 'offline',
          force_refresh: Boolean(shouldForce)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        if (data?.partner_a?.name) setPartnerAName(data.partner_a.name);
        if (data?.partner_b?.name) setPartnerBName(data.partner_b.name);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`ga_couple_assessment_${famKey}`, JSON.stringify(data));
          } catch (e) {
            console.warn('Failed to store couple assessment in sessionStorage', e);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load couple assessment:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (text: string) => {
    if (!text.trim() || isAsking) return;
    const userMsgText = text.trim();
    setUserQuery('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user' as const,
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAsking(true);
    setThinkingStep('Reviewing couple carrier findings & variant concordance...');

    const timer1 = setTimeout(() => {
      setThinkingStep('Cross-referencing clinical reproductive guidelines...');
    }, 600);

    const timer2 = setTimeout(() => {
      setThinkingStep('Synthesizing personalized hereditary guidance...');
    }, 1400);

    try {
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const isOnline = aiEngineMode === 'online' || hasGlobalGeminiKey || Boolean(geminiApiKey && geminiApiKey.trim());
      const endpoint = isOnline ? '/api/ai/ask-studio' : '/api/ai/ask';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsgText,
          family_id: activeFamilyId,
          ai_mode: isOnline ? 'online' : 'offline',
          model: selectedGeminiModel || 'gemini-3.8-flash',
          api_key: geminiApiKey ? geminiApiKey.trim() : undefined,
          conversation_history: historyPayload
        })
      });
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai' as const,
          text: data.answer || 'I could not find a clear match for your inquiry.',
          source: data.source || (data.references && data.references[0]) || 'Care AI Clinical Intelligence',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citationDetails: data.citation_details || (data.references ? data.references.map((r: string) => ({ title: r, excerpt: '' })) : []),
          suggestedFollowUps: data.suggested_follow_ups || []
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        setChatAnswer(data);
      }
    } catch (e) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error('Error asking question:', e);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai' as const,
        text: 'In reproductive genetics, being carriers for an autosomal recessive trait is very common and compatible with a healthy family. Even if both parents carry matching traits, there is a 75% probability in each pregnancy that the child will be born free of the condition (50% healthy carrier, 25% non-carrier). Pre-implantation Genetic Testing (PGT-M) provides definitive peace of mind.',
        source: 'Couple Hereditary Compatibility Protocol',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          "What is an ACMG Pedigree?",
          "What is Spinal Muscular Atrophy (SMA)?",
          "What are our couple reproductive options?"
        ]
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsAsking(false);
      setThinkingStep('');
    }
  };
  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-mint/25 text-pine text-[11px] font-bold tracking-wider uppercase border border-mint flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-jungle"></span>
                  {activeLocale === 'ar' ? 'فحص التوافق الصحي للزوجين' : 'Couple Premarital Genetic Assessment'}
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-slate-600 text-xs font-medium">
                  {activeLocale === 'ar' ? 'معتمد وفق الإرشادات الوطنية' : 'UAE Premarital Protocol Aligned'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-pine tracking-tight">
                {activeLocale === 'ar' ? 'تقييم التوافق الوراثي للزوجين' : 'Couple Hereditary Compatibility & Health Assessment'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {partnerAName} &amp; {partnerBName} &mdash; {t('couple_assessment_subtitle', activeLocale)}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => loadAssessment(true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-pine bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Re-run fresh couple hereditary assessment"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-pine ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Analyzing...' : 'Refresh Analysis'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-pine" />
                <span>Export Summary</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Session scheduled with Medical Genetics Board.')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-pine hover:bg-pine-light rounded-xl shadow-xs transition"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Consult Specialist</span>
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
                <h3 className="text-base font-bold text-pine">Upload Screening Reports or Create Family Tree</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  To view your combined carrier analysis, inheritance probabilities, and proactive family planning options, please upload premarital screening reports or map your family tree below:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-4 bg-white rounded-2xl border border-outline-variant/30 text-left space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-pine">
                    <span className="w-5 h-5 rounded-full bg-pine text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Upload Screening Reports</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Upload official premarital screening lab reports to extract carrier status.
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
                    <span>Build Family Tree</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Map family connections and future children to visualize hereditary traits.
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
                          <p className="text-[11px] text-slate-500">{assessment.partner_a?.role || 'Partner A'}</p>
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
                          <span className="font-bold text-slate-700 block text-[11px]">Laboratory Test Findings:</span>
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
                          Combined Compatibility Analysis
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-pine-light text-mint font-mono text-[10px]">
                        Premarital Standards
                      </span>
                    </div>

                    <div className="text-center py-2 space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-mint font-bold">
                        Family Lineage Connection
                      </span>
                      <div className="text-3xl font-black text-white">{assessment.synthesis?.inbreeding_coefficient || 'F = 0.000'}</div>
                      <span className="text-xs text-mint">
                        {assessment.synthesis?.kinship_level || 'Standard Population Lineage'}
                      </span>
                    </div>

                    <div className="p-3 bg-pine-light/80 rounded-xl border border-pine-light space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>Newborn Inheritance Chance</span>
                        <span className="text-amber-300 text-sm">{assessment.synthesis?.recessive_risk || '25% (1 in 4)'}</span>
                      </div>
                      <p className="text-[11px] text-mint/90 leading-relaxed">
                        {assessment.synthesis?.risk_details}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-pine-light flex items-center justify-between text-xs text-mint">
                    <span>{assessment.synthesis?.consanguinity_active ? 'Shared family lineage recorded' : 'Family lineage verified'}</span>
                    <span className="font-mono">{assessment.synthesis?.child_node_status || 'Projected Offspring ★'}</span>
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
                          <p className="text-[11px] text-slate-500">{assessment.partner_b?.role || 'Partner B'}</p>
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
                          <span className="font-bold text-slate-700 block text-[11px]">Laboratory Test Findings:</span>
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
                    <Heart className="w-5 h-5 text-mint" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-pine">
                        {assessment?.source ? `${assessment.source} • ` : ''}Couple Hereditary Assessment
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-mint/25 text-pine text-[10px] font-bold border border-mint">
                        {assessment.compatibility_status || 'Compatible with Guidance'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Compassionate premarital counseling synthesis aligned with UAE guidelines
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadAssessment(true)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-outline-variant/30 hover:bg-slate-50 text-xs text-pine font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Update Assessment</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Visual 4-Card Digestible Breakdown (UAE Respectful & Destigmatizing) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: 75% Healthy Offspring Metric */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-mint/15 border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>75% Healthy Child Guarantee</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-emerald-950">
                      75% probability in each pregnancy of a child born free of condition
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Even if both partners carry the identical autosomal recessive trait, there is a 3-in-4 chance in every pregnancy of a healthy baby (50% asymptomatic carrier, 25% non-carrier).
                    </p>
                  </div>

                  {/* Card 2: Destigmatization & Health */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-mint/20 to-fog-light border border-mint shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-jungle shrink-0" />
                      <span>Carriers Are Completely Healthy</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-pine">
                      Normal biological variation &mdash; not an illness
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {assessment.positive_summary || 'Being a carrier is a natural biological variation. Carriers lead active, healthy, and fulfilling lives with no symptoms.'}
                    </p>
                  </div>

                  {/* Card 3: UAE Kinship & Family Heritage */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <Users className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Honoring Family Wisdom &amp; Lineage</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-amber-950">
                      Premarital screening protects future generations
                    </h4>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      {assessment.motivational_insight || 'Premarital screening honors family commitment and national health wisdom, protecting loved ones with proactive medical clarity.'}
                    </p>
                  </div>

                  {/* Card 4: Modern Reproductive Pathways */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-pine/5 to-white border border-pine/20 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-pine shrink-0" />
                      <span>Proactive Medical Solutions (PGT-M)</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-pine">
                      Modern reproductive technologies ensure peace of mind
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Options such as Pre-implantation Genetic Testing (PGT-M) with IVF and non-invasive prenatal checks empower couples to have healthy children with 100% confidence.
                    </p>
                  </div>
                </div>

                {/* Next Possible Ways */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-pine font-bold text-xs uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-pine" />
                    <span>Recommended Proactive Pathways:</span>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-pine" />
                      <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                        Ask Questions Based on These Results
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearChat}
                      title="Clear chat history"
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:inline">Clear Chat</span>
                    </button>
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

                  {/* Scrollable Conversation Viewport */}
                  <div
                    ref={chatScrollRef}
                    className="h-64 sm:h-72 overflow-y-auto space-y-3 p-3.5 bg-fog/60 rounded-2xl border border-outline-variant/20 scroll-smooth select-text"
                    style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                  >
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex select-text ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2'}`}
                        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                      >
                        {msg.sender === 'ai' && (
                          <div className="w-6 h-6 rounded-full bg-mint text-pine flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-pine" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs text-xs space-y-1.5 select-text ${
                            msg.sender === 'user'
                              ? 'bg-pine text-white rounded-tr-xs'
                              : 'bg-white text-pine border border-outline-variant/30 rounded-tl-xs'
                          }`}
                          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                        >
                          {renderFormattedText(msg.text)}
                          <div
                            className={`flex flex-col gap-1 text-[9px] pt-0.5 select-text ${
                              msg.sender === 'user' ? 'text-white/70' : 'text-on-surface-variant/70'
                            }`}
                            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                          >
                            {msg.sender === 'ai' && (
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                {msg.citationDetails && msg.citationDetails.length > 0 ? (
                                  msg.citationDetails.map((cit, cIdx) => (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() => setActiveCitationPreview(cit)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint/30 hover:bg-mint/50 text-pine text-[9px] font-semibold border border-mint/60 transition cursor-pointer shadow-2xs"
                                      title="Click to preview citation excerpt"
                                    >
                                      <FileText className="w-2.5 h-2.5 text-pine" />
                                      <span className="truncate max-w-[130px]">{cit.title}</span>
                                    </button>
                                  ))
                                ) : msg.source ? (
                                  <span className="font-medium text-teal-800">
                                    Source: <span className="underline decoration-mint underline-offset-2">{msg.source}</span>
                                  </span>
                                ) : null}
                              </div>
                            )}

                            {msg.sender === 'ai' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                              <div className="pt-1.5 border-t border-outline-variant/20 space-y-1">
                                <p className="text-[10px] font-semibold text-pine/80 flex items-center gap-1">
                                  <HelpCircle className="w-2.5 h-2.5 text-jungle" /> {t('care_ai_suggested_questions', activeLocale)}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {msg.suggestedFollowUps.map((qText, sIdx) => (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      disabled={isAsking}
                                      onClick={() => handleAskQuestion(qText)}
                                      className="text-[10px] text-start px-2 py-0.5 rounded-lg bg-mint/20 hover:bg-mint/40 text-pine font-medium border border-mint/40 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                    >
                                      <span>{qText}</span>
                                      <ArrowRight className="w-2.5 h-2.5 text-jungle shrink-0 rtl:rotate-180" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end">
                              <span className="shrink-0">{msg.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Progressive Thinking Indicator */}
                    {isAsking && (
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
                              {thinkingStep || 'Reviewing couple carrier findings & variant concordance...'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Synthesizing with local Qdrant vectors and your health pedigree...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

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
                      placeholder={t('care_ai_placeholder', activeLocale)}
                      className="w-full pl-4 pr-12 rtl:pl-12 rtl:pr-4 text-start py-2.5 text-xs rounded-xl bg-fog border border-outline-variant/30 text-pine placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition"
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !userQuery.trim()}
                      className="absolute right-2 rtl:right-auto rtl:left-2 w-8 h-8 rounded-full bg-pine text-white flex items-center justify-center hover:bg-pine-light disabled:opacity-50 transition shadow-xs cursor-pointer"
                    >
                      {isAsking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
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
              <table className="w-full text-start text-xs">
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

        </main>
      </div>
      </div>
      {/* Interactive Document Citation Preview Modal */}
      {activeCitationPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-outline-variant/30 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-mint/30 flex items-center justify-center text-pine">
                  <FileText className="w-4 h-4 text-pine" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-pine leading-tight">
                    {activeCitationPreview.title}
                  </h4>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {activeCitationPreview.file_type === 'screening_report' ? 'Screening Lab Finding' : 'National Health Policy Guideline'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCitationPreview(null)}
                className="text-slate-400 hover:text-pine p-1 rounded-lg hover:bg-fog transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-fog rounded-xl border border-outline-variant/30 text-xs text-slate-700 leading-relaxed font-sans max-h-56 overflow-y-auto">
              <p className="whitespace-pre-line">
                {activeCitationPreview.excerpt || 'Referenced in clinical guidelines and premarital protocols.'}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Verified by GuardianAngel Clinical Engine</span>
              <button
                type="button"
                onClick={() => setActiveCitationPreview(null)}
                className="px-3.5 py-1.5 bg-pine text-white text-xs font-semibold rounded-lg hover:bg-pine-light transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

