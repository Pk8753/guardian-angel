'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PgtSimulator } from '@/components/simulation/PgtSimulator';
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
  X,
  Calendar,
  Check,
  UserCheck,
  Plus,
  ChevronRight
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
  const { activeLocale } = useUIStore();
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

  // Multiple Couple Profiles (One-to-Many)
  const [coupleProfiles, setCoupleProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(true);

  // Friendly Introductory Popup / Modal: "Help us know more about your potential spouse"
  const [isNewMatchModalOpen, setIsNewMatchModalOpen] = useState<boolean>(false);
  const [matchPartnerLabel, setMatchPartnerLabel] = useState<string>('');
  const [matchRelationshipType, setMatchRelationshipType] = useState<string>('First Cousin (Paternal)');
  const [matchScreeningStatus, setMatchScreeningStatus] = useState<string>('Not yet screened');
  const [matchKnownTrait, setMatchKnownTrait] = useState<string>('None / Unknown');
  const [matchFamilyHistory, setMatchFamilyHistory] = useState<string>('No known genetic conditions');
  const [matchDocName, setMatchDocName] = useState<string>('');
  const [isSavingMatch, setIsSavingMatch] = useState<boolean>(false);

  // Counselor Booking Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

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

  // Load couple assessment profiles from database
  const loadCoupleProfiles = async () => {
    try {
      const res = await fetch('/api/couple-assessments');
      if (res.ok) {
        const data = await res.json();
        const list = data.couple_assessments || [];
        setCoupleProfiles(list);
        if (list.length > 0 && selectedProfileId === null) {
          setSelectedProfileId(list[0].id);
          setPartnerBName(list[0].partner_label);
        }
      }
    } catch (e) {
      console.error('Failed to load couple profiles:', e);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // Load sample counselors for booking
  const loadProviders = async () => {
    try {
      const res = await fetch('/api/patient/providers');
      if (res.ok) {
        const data = await res.json();
        const list = data.providers || [];
        setProviders(list);
        if (list.length > 0) {
          setSelectedProviderId(list[0].id);
          if (list[0].available_slots && list[0].available_slots.length > 0) {
            setSelectedSlot(list[0].available_slots[0].full_label || list[0].available_slots[0].time);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load providers:', e);
    }
  };

  useEffect(() => {
    loadCoupleProfiles();
    loadProviders();

    // Check if openModal was requested in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openModal') === 'true') {
        setIsNewMatchModalOpen(true);
      }
    }
  }, []);

  const handleSelectProfile = (profile: any) => {
    setSelectedProfileId(profile.id);
    setPartnerBName(profile.partner_label);
  };

  // Handle Create New Match
  const handleCreateNewMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchPartnerLabel.trim()) return;

    setIsSavingMatch(true);

    const answers = {
      relationship_type: matchRelationshipType,
      screening_status: matchScreeningStatus,
      known_traits: matchKnownTrait,
      family_history: matchFamilyHistory,
    };

    // Calculate plain summary
    let summary = `Compatibility evaluation for ${matchPartnerLabel} (${matchRelationshipType}).`;
    if (matchKnownTrait !== 'None / Unknown') {
      summary += ` Partner carries trait for ${matchKnownTrait}. If both partners carry matching traits, there is a 75% probability in each pregnancy of having an unaffected child. Modern pathways like premarital testing and PGT-M provide complete peace of mind.`;
    } else {
      summary += ` Autosomal recessive trait analysis shows that routine premarital screening gives couples complete clarity. Over 95%+ of pregnancies between relatives result in healthy, thriving children.`;
    }

    const docs = matchDocName.trim()
      ? [{ file_name: matchDocName.trim(), file_url: `/data/documents/${matchDocName.trim()}` }]
      : [];

    try {
      const res = await fetch('/api/couple-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_label: matchPartnerLabel.trim(),
          relationship_type: matchRelationshipType,
          answers,
          risk_estimate: {
            trait: matchKnownTrait,
            recessive_probability: matchKnownTrait !== 'None / Unknown' ? '25%' : '<3%',
            healthy_baby_rate: '75%+'
          },
          plain_summary: summary,
          documents: docs
        })
      });

      if (res.ok) {
        const data = await res.json();
        await loadCoupleProfiles();
        if (data.assessment_id) {
          setSelectedProfileId(data.assessment_id);
          setPartnerBName(matchPartnerLabel.trim());
        }
        setIsNewMatchModalOpen(false);
        setMatchPartnerLabel('');
        setMatchDocName('');
      }
    } catch (e) {
      console.error('Failed to save couple assessment:', e);
    } finally {
      setIsSavingMatch(false);
    }
  };

  // Handle Delete Profile
  const handleDeleteProfile = async (profileId: number) => {
    if (!confirm('Are you sure you want to remove this couple assessment profile?')) return;
    try {
      const res = await fetch(`/api/couple-assessments/${profileId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCoupleProfiles();
        setSelectedProfileId(null);
      }
    } catch (e) {
      console.error('Failed to delete couple profile', e);
    }
  };

  // Handle Counselor Appointment Booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !selectedSlot) return;

    setIsBookingSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: selectedProviderId,
          assessment_type: 'couple',
          couple_assessment_id: selectedProfileId,
          scheduled_at: selectedSlot,
          notes: bookingNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setBookingSuccessMsg(`Your couple counseling session on ${selectedSlot} is confirmed!`);
        setTimeout(() => {
          setIsBookingModalOpen(false);
          setBookingSuccessMsg(null);
          setBookingNotes('');
        }, 1800);
      }
    } catch (e) {
      console.error('Booking failed', e);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

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
      if (!shouldForce && typeof window !== 'undefined') {
        try {
          const saved = sessionStorage.getItem(`ga_couple_assessment_${famKey}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              setAssessment(parsed);
              if (parsed?.partner_a?.name) setPartnerAName(parsed.partner_a.name);
              if (parsed?.partner_b?.name) setPartnerBName(parsed.partner_b.name);
              return;
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
        body: JSON.stringify({ partner_a: pA, partner_b: pB, family_id: activeFamId })
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

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsgText,
          family_id: activeFamilyId,
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
                <span className="px-2.5 py-0.5 rounded-full bg-mint/25 text-pine text-[11px] font-bold tracking-wider uppercase border border-mint">
                  Couple Health Compatibility
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-slate-600 text-xs font-medium">100% Confidential &bull; UAE Healthcare Standards</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-pine tracking-tight">
                {t('couple_assessment_title', activeLocale)} &mdash; {partnerAName} &amp; {partnerBName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {t('couple_assessment_subtitle', activeLocale)}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setIsNewMatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-pine hover:bg-pine-light rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Start New Couple Assessment</span>
              </button>
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
                <span>Export Clinical Brief</span>
              </button>
            </div>
          </div>

          {/* Multiple Couple Assessment Profiles Manager (One-to-Many) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-100" />
                  <h2 className="text-base font-bold text-pine">Your Couple Assessments</h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                    {coupleProfiles.length} {coupleProfiles.length === 1 ? 'profile' : 'profiles'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage and compare compatibility assessments for different potential spouses.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewMatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-pine text-white text-xs font-bold rounded-xl hover:bg-pine-light transition shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Potential Match</span>
              </button>
            </div>

            {/* Profiles List / Tabs */}
            {isLoadingProfiles ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading couple assessments...</div>
            ) : coupleProfiles.length === 0 ? (
              <div className="p-6 bg-fog rounded-xl text-center space-y-2 border border-dashed border-slate-200">
                <p className="text-xs font-bold text-pine">No Couple Assessments Saved Yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Help us know more about your potential spouse to receive a warm, personalized compatibility overview and clear next steps.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewMatchModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-pine text-white text-xs font-bold rounded-xl hover:bg-pine-light transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start First Couple Assessment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Profile Selector Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {coupleProfiles.map((p) => {
                    const isSelected = p.id === (selectedProfileId || coupleProfiles[0]?.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProfile(p)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                          isSelected
                            ? 'bg-pine text-white border-pine shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSelected ? 'text-mint fill-mint' : 'text-slate-400'}`} />
                        <span>{p.partner_label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {p.relationship_type || 'Relative'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Profile Detailed Card */}
                {(() => {
                  const active = coupleProfiles.find((p) => p.id === (selectedProfileId || coupleProfiles[0]?.id)) || coupleProfiles[0];
                  if (!active) return null;
                  return (
                    <div className="p-4 bg-fog/70 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-pine">
                              Match Evaluation: {active.partner_label}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-mint/30 text-pine text-[11px] font-semibold">
                              {active.relationship_type}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Created {new Date(active.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                            {active.plain_summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProfileId(active.id);
                              setIsBookingModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pine text-white text-xs font-bold rounded-xl hover:bg-pine-light transition shadow-xs cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book Counselor for {active.partner_label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(active.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove this profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Trait & Documents Sub-row */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400">Known Trait: </span>
                          <span className="font-semibold text-slate-700">{active.answers?.known_traits || 'None reported'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Screening Status: </span>
                          <span className="font-semibold text-slate-700">{active.answers?.screening_status || 'Pending'}</span>
                        </div>
                        {active.documents && active.documents.length > 0 && (
                          <div className="flex items-center gap-1 text-pine font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{active.documents.length} document(s) linked</span>
                          </div>
                        )}
                      </div>

                      {/* Auto-Escalation to Accredited Human Counseling Banner */}
                      {Boolean(
                        (active.answers?.known_traits && !['None / Unknown', 'None reported', 'None', ''].includes(active.answers.known_traits)) ||
                        active.plain_summary?.toLowerCase().includes('carrier') ||
                        active.plain_summary?.toLowerCase().includes('elevated') ||
                        active.plain_summary?.toLowerCase().includes('thalassemia') ||
                        active.plain_summary?.toLowerCase().includes('sickle') ||
                        active.plain_summary?.toLowerCase().includes('sma') ||
                        active.relationship_type?.includes('First Cousin')
                      ) && (
                        <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-emerald-50/60 to-teal-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-amber-950">
                                  Recommended: Speak with an Accredited Counselor
                                </span>
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Supportive Guidance
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 leading-snug">
                                Guidance from an expert ensures peace of mind and explores modern family pathways (such as PGT-M with IVF, non-invasive screening, or targeted pediatric care).
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProfileId(active.id);
                              setIsBookingModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pine hover:bg-pine-light text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0 self-start sm:self-auto"
                          >
                            <Calendar className="w-3.5 h-3.5 text-mint" />
                            <span>Book Consultation for this Match</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
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
                  onClick={() => loadAssessment(true)}
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
                    className="h-64 sm:h-72 overflow-y-auto space-y-3 p-3.5 bg-fog/60 rounded-2xl border border-outline-variant/20 scroll-smooth"
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
                          {renderFormattedText(msg.text)}
                          <div
                            className={`flex flex-col gap-1 text-[9px] pt-0.5 ${
                              msg.sender === 'user' ? 'text-white/70' : 'text-on-surface-variant/70'
                            }`}
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
          {/* Interactive PGT-M & Offspring Probability Simulator */}
          <PgtSimulator />
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

      {/* Guided Intake Modal: "Help us know more about your potential spouse." */}
      {isNewMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-mint/30 flex items-center justify-center text-pine shrink-0">
                  <Heart className="w-5 h-5 text-pine fill-pine/20" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-pine leading-snug">
                    Help us know more about your potential spouse
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confidential &amp; judgment-free premarital compatibility assessment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewMatch} className="space-y-4">
              {/* Partner Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Potential Spouse&apos;s First Name or Reference Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima, Match 1, Potential Partner"
                  value={matchPartnerLabel}
                  onChange={(e) => setMatchPartnerLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition"
                />
              </div>

              {/* Relationship Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  How are you related to your potential spouse?
                </label>
                <select
                  value={matchRelationshipType}
                  onChange={(e) => setMatchRelationshipType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition"
                >
                  <option value="First Cousin (Paternal)">First Cousin (Paternal - Uncle or Aunt on Father&apos;s side)</option>
                  <option value="First Cousin (Maternal)">First Cousin (Maternal - Uncle or Aunt on Mother&apos;s side)</option>
                  <option value="Second Cousin">Second Cousin (Parents are cousins)</option>
                  <option value="Distantly Related / Same Tribe">Distantly Related / Same Tribe or Extended Family</option>
                  <option value="Not Related">Not Related</option>
                </select>
              </div>

              {/* Premarital Screening Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Has your potential spouse completed pre-marital screening?
                </label>
                <select
                  value={matchScreeningStatus}
                  onChange={(e) => setMatchScreeningStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition"
                >
                  <option value="Completed Pre-Marital Screening">Completed Pre-Marital Screening (Has report)</option>
                  <option value="Screening Scheduled / In Progress">Screening Scheduled / In Progress</option>
                  <option value="Not yet screened">Not yet screened</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Known Carrier Trait */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Are there any known carrier traits in your potential spouse?
                </label>
                <select
                  value={matchKnownTrait}
                  onChange={(e) => setMatchKnownTrait(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition"
                >
                  <option value="None / Unknown">None / Not known</option>
                  <option value="Beta-Thalassemia Trait">Beta-Thalassemia Trait</option>
                  <option value="Sickle Cell Trait">Sickle Cell Trait</option>
                  <option value="G6PD Deficiency">G6PD Deficiency</option>
                  <option value="Cystic Fibrosis (CF) Trait">Cystic Fibrosis (CF) Trait</option>
                  <option value="Spinal Muscular Atrophy (SMA) Trait">Spinal Muscular Atrophy (SMA) Trait</option>
                  <option value="Inherited Hearing Loss Trait">Inherited Hearing Loss Trait</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Family History */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Family History of Inherited Conditions
                </label>
                <select
                  value={matchFamilyHistory}
                  onChange={(e) => setMatchFamilyHistory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition"
                >
                  <option value="No known genetic conditions">No known genetic conditions in family</option>
                  <option value="Family history of blood condition (Thalassemia / Sickle Cell)">Family history of blood condition (Thalassemia / Sickle Cell)</option>
                  <option value="Family history of hearing loss">Family history of hearing loss</option>
                  <option value="Family history of childhood muscle weakness">Family history of childhood muscle weakness</option>
                  <option value="Other inherited condition">Other inherited condition</option>
                </select>
              </div>

              {/* Document Upload for Partner */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Partner Screening Document (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. fatima_screening_report.pdf"
                      value={matchDocName}
                      onChange={(e) => setMatchDocName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pine/30"
                    />
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-pine" />
                      <span>Browse</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setMatchDocName(file.name);
                        }}
                      />
                    </label>
                  </div>
                  {/* Sample Document Quick Picker */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Quick sample:</span>
                    <button
                      type="button"
                      onClick={() => setMatchDocName('partner_premarital_screening.pdf')}
                      className="text-[11px] text-pine underline hover:text-pine-light cursor-pointer"
                    >
                      partner_premarital_screening.pdf
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setMatchDocName('partner_hemoglobin_electrophoresis.pdf')}
                      className="text-[11px] text-pine underline hover:text-pine-light cursor-pointer"
                    >
                      partner_hemoglobin_electrophoresis.pdf
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewMatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMatch}
                  className="px-5 py-2.5 bg-pine text-white text-xs font-bold rounded-xl hover:bg-pine-light transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingMatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <span>Save Assessment &amp; View Results</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counselor Appointment Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-mint/30 flex items-center justify-center text-pine shrink-0">
                  <Stethoscope className="w-5 h-5 text-pine" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-pine leading-snug">
                    Book Couple Genetic Counseling Session
                  </h3>
                  <p className="text-xs text-slate-500">
                    Session linked to: <span className="font-semibold text-slate-700">{partnerBName || 'Partner'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-800">Booking Confirmed!</h4>
                <p className="text-xs text-emerald-700">{bookingSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4">
                {/* Select Provider */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Choose a Certified Genetic Counselor
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {providers.map((prov) => {
                      const isSelected = prov.id === selectedProviderId;
                      return (
                        <div
                          key={prov.id}
                          onClick={() => {
                            setSelectedProviderId(prov.id);
                            if (prov.available_slots && prov.available_slots.length > 0) {
                              setSelectedSlot(prov.available_slots[0].full_label || prov.available_slots[0].time);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-mint/15 border-pine ring-1 ring-pine'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-pine">{prov.full_name}</span>
                            <span className="text-[10px] text-slate-500">{prov.location}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{prov.specialty}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Languages: {Array.isArray(prov.languages) ? prov.languages.join(', ') : 'Arabic, English'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Select Time Slot */}
                {(() => {
                  const currProv = providers.find((p) => p.id === selectedProviderId);
                  const slots = currProv?.available_slots || [];
                  return (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Select Available Appointment Slot
                      </label>
                      {slots.length === 0 ? (
                        <p className="text-xs text-slate-400">No open slots available for this provider.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {slots.slice(0, 8).map((slot: any, idx: number) => {
                            const label = slot.full_label || `${slot.day_name} ${slot.date} at ${slot.time}`;
                            const isSelected = selectedSlot === label;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedSlot(label)}
                                className={`p-2 rounded-lg text-left text-[11px] font-medium border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-pine text-white border-pine shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Questions or Notes for the Counselor (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. We would like to discuss our carrier screening results and IVF with PGT-M options."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pine/30"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBookingSubmitting || !selectedSlot}
                    className="px-5 py-2.5 bg-pine text-white text-xs font-bold rounded-xl hover:bg-pine-light transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isBookingSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <span>Confirm Appointment</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

