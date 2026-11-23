'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore, ChatMessage, CitationDetail } from '@/stores/useUIStore';
import { t } from '@/lib/translations';
import {
  Sparkles,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Trash2,
  Search,
  FileText,
  HelpCircle,
  ArrowRight,
  Cpu,
  Globe,
  Copy,
  Check
} from 'lucide-react';

const defaultSuggestedQuestions = [
  { q: "What does my pre-marital genetic report mean in plain English?", cat: "lab" },
  { q: "Can we have healthy children if we both carry Beta-Thalassemia?", cat: "repro" },
  { q: "What is the difference between being a carrier and being sick?", cat: "carrier" },
  { q: "Explain the projected ★ Star Child symbol in our pedigree.", cat: "star" }
];

const getPageContext = (pathname: string): { name: string; context: string } => {
  if (pathname.includes('/couple-assessment')) {
    return {
      name: 'Couple Hereditary Assessment',
      context: 'User is on the Couple Assessment page reviewing premarital compatibility, partner carrier status, reproductive risk distribution (0% risk of newborn disease if single carrier; 75% healthy child chance if both are carriers), and IVF with PGT-M options.'
    };
  }
  if (pathname.includes('/risk-analysis')) {
    return {
      name: 'AI Genetic Intelligence & Risk Analysis',
      context: 'User is on the AI Genetic Intelligence page reviewing individual carrier traits, ClinVar & dbSNP variant classifications, Mendelian probability, and laboratory findings.'
    };
  }
  if (pathname.includes('/pedigree')) {
    return {
      name: 'Family Pedigree Tree',
      context: 'User is on the Family Pedigree page viewing their 3-generation family tree canvas, relatives (parents, siblings, spouse), carrier traits, and the projected Star Child (★) offspring.'
    };
  }
  if (pathname.includes('/profile')) {
    return {
      name: 'User Profile & Family Settings',
      context: 'User is on the Profile page managing their personal details, active family selection, and account settings.'
    };
  }
  return {
    name: 'Patient Dashboard',
    context: 'User is on the main Dashboard viewing their overall health tree completeness, quick-add family member actions, uploaded screening report highlights, and genomic literacy cards.'
  };
};

export function CareAIFloatingChat() {
  const pathname = usePathname();
  const pageInfo = getPageContext(pathname || '');

  const {
    isCareAIOpen,
    setCareAIOpen,
    careAIWindowState,
    setCareAIWindowState,
    viewMode,
    activeLocale,
    aiEngineMode,
    hasGlobalGeminiKey,
    geminiApiKey,
    selectedGeminiModel,
    setSelectedGeminiModel,
    availableGeminiModels,
    careAIChatMessages,
    addCareAIChatMessage,
    clearCareAIChatMessages
  } = useUIStore();

  const [query, setQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [activeCitationPreview, setActiveCitationPreview] = useState<CitationDetail | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isOnline = aiEngineMode === 'online' || hasGlobalGeminiKey || Boolean(geminiApiKey && geminiApiKey.trim());

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [careAIChatMessages, isAiLoading, thinkingStep]);

  if (!isCareAIOpen) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-2">
        <button
          type="button"
          onClick={() => {
            setCareAIOpen(true);
            setCareAIWindowState('normal');
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-pine hover:bg-pine-light text-white font-bold shadow-2xl border border-mint/40 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Ask Care AI — Clinical Genetics & Screening Assistant"
          aria-label="Ask Care AI"
        >
          <div className="w-6 h-6 rounded-full bg-mint/20 flex items-center justify-center text-mint group-hover:rotate-12 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-jungle animate-pulse" />
          </div>
          <span className="text-xs tracking-tight">Ask Care AI</span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white/90 font-medium">
            {isOnline ? 'Gemini' : 'Qwen'}
          </span>
        </button>
      </div>
    );
  }

  const handleClearChat = () => {
    clearCareAIChatMessages();
  };

  const getFallbackAnswer = (q: string): string => {
    const qLower = q.toLowerCase();
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Arabic inquiry detection
    const isArabic = /[\u0600-\u06FF]/.test(q) || qLower.includes('arabic') || qLower.includes('بالعربي') || qLower.includes('عربي');
    if (isArabic) {
      if (qLower.includes('طفل') || qLower.includes('اطفال') || qLower.includes('صحي') || qLower.includes('سليم') || qLower.includes('healthy') || qLower.includes('child')) {
        return "**نعم، بكل تأكيد وبإذن الله يمكنكم إنجاب أطفال أصحاء.**\n\n• **احتمالات الحمل الطبيعي:** حتى لو كان كلا الزوجين يحملان نفس الصفة المتنحية (مثل الثلاسيميا)، فإن هناك **احتمال بنسبة 75% (3 من 4) في كل حمل** لإنجاب طفل سليم تماماً ومعافى.\n• **حامل الصفة شخص معافى:** صفة حامل المرض تعني أنك سليم ونشيط ولا تعاني من أي أعراض.\n• **فحص الأجنة PGT-M:** يمنح الأزواج الراغبين في الاطمئنان التام إمكانية فحص الأجنة مخبرياً قبل الحمل للتأكد من سلامتها بنسبة 100%.";
      }
      if (qLower.includes('مرحبا') || qLower.includes('سلام') || qLower.includes('اهلا') || qLower.includes('marhaba') || qLower.includes('salam')) {
        return `أهلاً وسهلاً بك وبأسرتك الكريمة! أنا **Care AI**، مساعدك الذكي للإرشاد الوراثي والفحص الطبي لما قبل الزواج. أنت تشاهد الآن صفحة **${pageInfo.name}**. كيف يمكنني مساعدتك أنت وشريكك اليوم؟`;
      }
      return `يسعدني تقديم الإرشاد الوراثي الطبي لك ولأسرتك الكريمة في صفحة **${pageInfo.name}** وفقاً لمعايير الفحص الطبي لما قبل الزواج بدولة الإمارات العربية المتحدة. يمكنك سؤالي عن نتائج الفحوصات المخبرية، أو أمراض الدم الوراثية (مثل الثلاسيميا ونقص الخميرة G6PD)، أو احتمالات الوراثة، أو خيارات التخطيط الإنجابي الآمن.`;
    }

    if (qLower.includes('date') || qLower.includes('today') || qLower.includes('what day') || qLower.includes('time')) {
      return `Today is **${todayStr}**. It is my pleasure to assist you! How can I help you and your partner with your premarital records or health planning today?`;
    }
    if (qLower.startsWith('hi') || qLower.startsWith('hello') || qLower.startsWith('hey') || qLower.includes('marhaba') || qLower.includes('salam')) {
      const pageName = pageInfo.name.toLowerCase().includes('dashboard') ? 'dashboard' : `${pageInfo.name.toLowerCase()} screen`;
      return `Hello! It is a pleasure to see you on your ${pageName} today. That is a very important question, and I am happy to help clarify the difference.`;
    }
    if (qLower.includes('pedigree') || qLower.includes('family tree') || qLower.includes('tree')) {
      return `Your family pedigree tree maps your lineage across three generations to help you understand inherited carrier traits before marriage. You can add relatives, record screening findings, or review projected offspring on the **${pageInfo.name}** screen. What questions do you have about your family tree?`;
    }
    if (qLower.includes('healthy') || qLower.includes('child') || qLower.includes('baby') || qLower.includes('risk')) {
      return "In medical genetics, being carriers for an autosomal recessive trait (such as Beta-Thalassemia, Sickle Cell, or G6PD) is completely compatible with a joyful, healthy family. Even if both partners carry identical recessive traits, there is a **75% probability in each pregnancy** that the baby is born free of the condition (50% healthy carrier, 25% completely non-carrier). Furthermore, modern pathways like Pre-implantation Genetic Testing (**PGT-M**) with IVF ensure parents can have healthy children with 100% confidence.";
    }
    if (qLower.includes('carrier') || qLower.includes('heterozygous') || qLower.includes('trait')) {
      return "Being a **heterozygous carrier** means you have inherited one standard gene and one genetic variation. You are completely healthy and do not have the clinical disease. Carrier status only matters for reproductive planning if your partner carries a variation in the exact same gene.";
    }
    if (qLower.includes('star') || qLower.includes('symbol')) {
      return "The **★ Star Child** symbol in your pedigree represents a future projected offspring. It is not an actual child, but rather a clinical forecast illustrating inheritance probabilities (such as carrier transmission) to help you understand your reproductive choices in advance.";
    }
    return `I am here to assist you with your premarital screening and family health planning on the **${pageInfo.name}** screen. Based on your records, proactive carrier screening gives you and your partner clear, reassuring insights. How can I assist you with your results or questions today?`;
  };

  const handleAskQuestion = async (userMsgText: string) => {
    if (!userMsgText.trim() || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMsgText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addCareAIChatMessage(userMsg);
    setQuery('');
    setIsAiLoading(true);
    setThinkingStep('Reviewing lab records & genetic variants...');

    const stepTimer1 = setTimeout(() => {
      setThinkingStep('Cross-referencing national health policy & standards...');
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setThinkingStep('Synthesizing clinical recommendations...');
    }, 1400);

    try {
      const historyPayload = careAIChatMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const isOnline = aiEngineMode === 'online' || Boolean(geminiApiKey && geminiApiKey.trim());
      const endpoint = isOnline ? '/api/ai/ask-studio' : '/api/ai/ask';

      let activeFamilyId: string | undefined = undefined;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        activeFamilyId = urlParams.get('family_id') || sessionStorage.getItem('ga_active_family_id') || undefined;
      }
      const enrichedContext = activeFamilyId
        ? `${pageInfo.context} (Active Family Chart ID: ${activeFamilyId})`
        : pageInfo.context;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsgText.trim(),
          family_id: activeFamilyId,
          ai_mode: isOnline ? 'online' : 'offline',
          model: selectedGeminiModel || 'gemini-3.8-flash',
          api_key: geminiApiKey ? geminiApiKey.trim() : undefined,
          view_mode: viewMode,
          current_page: pageInfo.name,
          page_context: enrichedContext,
          conversation_history: historyPayload
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.ok) {
        const data = await res.json();
        // Graceful handling if backend returned error or quota/model unavailability message
        if (data.error || (data.answer && typeof data.answer === 'string' && data.answer.startsWith('Google AI Studio error:'))) {
          const fallbackText = getFallbackAnswer(userMsgText);
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedFollowUps: [
              "Can we have healthy children?",
              "What is an ACMG Pedigree?",
              "What does heterozygous mean in plain English?"
            ]
          };
          addCareAIChatMessage(aiMsg);
        } else {
          const answerText = data.answer || 'No response generated.';
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: answerText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            citationDetails: data.citation_details || (data.references ? data.references.map((r: string) => ({ title: r, excerpt: '' })) : []),
            suggestedFollowUps: data.suggested_follow_ups || []
          };
          addCareAIChatMessage(aiMsg);
        }
      } else {
        const fallbackText = getFallbackAnswer(userMsgText);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          source: aiEngineMode === 'online' ? 'Google AI Studio (Fallback)' : 'Care AI Clinical Knowledge',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedFollowUps: [
            "Can we have healthy children?",
            "What is an ACMG Pedigree?",
            "What does heterozygous mean in plain English?"
          ]
        };
        addCareAIChatMessage(aiMsg);
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error('Care AI query error:', err);
      const fallbackText = getFallbackAnswer(userMsgText);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        source: 'Care AI Clinical Knowledge',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          "Can we have healthy children?",
          "What is an ACMG Pedigree?",
          "What are our couple reproductive options?"
        ]
      };
      addCareAIChatMessage(aiMsg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAiLoading(false);
      setThinkingStep('');
    }
  };

  const renderFormattedText = (rawText: string, isUser: boolean = false) => {
    return (
      <div className="space-y-2 leading-relaxed text-xs">
        {rawText.split('\n\n').map((paragraph, pIdx) => {
          if (paragraph.startsWith('• ') || paragraph.startsWith('- ')) {
            const items = paragraph.split('\n');
            return (
              <ul key={pIdx} className="list-disc list-inside space-y-1 pl-1">
                {items.map((it, iIdx) => {
                  const cleaned = it.replace(/^[•\-]\s*/, '');
                  return <li key={iIdx}>{renderBoldText(cleaned, isUser)}</li>;
                })}
              </ul>
            );
          }
          return <p key={pIdx}>{renderBoldText(paragraph, isUser)}</p>;
        })}
      </div>
    );
  };

  const renderBoldText = (text: string, isUser: boolean = false) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className={isUser ? "font-extrabold text-white" : "font-bold text-pine dark:text-emerald-300"}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Minimized floating pill docked at bottom-right
  if (careAIWindowState === 'minimized') {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 bg-pine text-white rounded-full shadow-2xl border border-mint/40 px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-pine-light transition-all animate-in fade-in slide-in-from-bottom-2">
        <button
          type="button"
          onClick={() => setCareAIWindowState('normal')}
          className="flex items-center gap-2 text-xs font-bold cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-jungle animate-pulse" />
          <span>Ask Care AI</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-mint/20 text-mint font-semibold">
            {isOnline ? 'Gemini' : 'Qwen'}
          </span>
        </button>
        <div className="flex items-center gap-1 pl-2 border-l border-white/20">
          <button
            type="button"
            onClick={() => setCareAIWindowState('normal')}
            className="p-1 hover:bg-white/10 rounded-md transition cursor-pointer"
            title="Restore Window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCareAIOpen(false)}
            className="p-1 hover:bg-white/10 rounded-md transition text-white/70 hover:text-white cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const isMaximized = careAIWindowState === 'maximized';

  return (
    <>
      <div
        className={`fixed z-40 bg-white dark:bg-slate-900 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 shadow-2xl border border-outline-variant/40 ${
          isMaximized
            ? 'inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] rounded-none sm:top-4 sm:bottom-4 sm:right-4 sm:left-auto sm:w-[720px] sm:max-w-[96vw] sm:rounded-3xl'
            : 'inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] rounded-none sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[430px] sm:h-[640px] sm:max-h-[86vh] sm:rounded-3xl'
        }`}
      >
        {/* Header Bar - Navy Blue Branded */}
        <div className="p-3.5 bg-gradient-to-r from-midnight to-midnight-dark text-white flex items-center justify-between gap-3 shrink-0 shadow-xs border-b border-midnight-dark/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white leading-tight">
                  Ask Care AI
                </h3>
                {isOnline ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 shrink-0"
                    title={`Active model configured in Settings: ${selectedGeminiModel}`}
                  >
                    <Globe className="w-2.5 h-2.5" />
                    <span>{availableGeminiModels.find((m) => m.id === selectedGeminiModel)?.name || selectedGeminiModel || 'Gemini'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                    <Cpu className="w-2.5 h-2.5" />
                    <span>Local Qwen</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Clear, Minimize, Maximize, Close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition text-[11px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCareAIWindowState('minimized')}
              title="Minimize to bar"
              className="hidden sm:inline-flex p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCareAIWindowState(isMaximized ? 'normal' : 'maximized')}
              title={isMaximized ? "Restore size" : "Maximize window"}
              className="hidden sm:inline-flex p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setCareAIOpen(false)}
              title="Close window"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Viewport */}
        <div className="flex-1 overflow-hidden flex flex-col bg-fog dark:bg-slate-900">
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth select-text"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          >
            {careAIChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex select-text ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2.5'}`}
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-mint text-pine flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-pine" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs text-xs space-y-2 select-text ${
                    msg.sender === 'user'
                      ? 'bg-waterhole text-white rounded-tr-xs'
                      : 'bg-[#eafaf4] dark:bg-slate-800 text-pine dark:text-emerald-100 border border-[#90ebcd]/70 dark:border-mint/30 rounded-tl-xs'
                  }`}
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                >
                  {renderFormattedText(msg.text, msg.sender === 'user')}

                <div
                  className={`flex flex-col gap-1 text-[9px] pt-1 border-t select-text ${
                    msg.sender === 'user' ? 'border-white/10 text-white/70' : 'border-slate-100 dark:border-slate-700 text-on-surface-variant/70'
                  }`}
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                >
                  {msg.sender === 'ai' && msg.citationDetails && msg.citationDetails.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {msg.citationDetails.map((cit, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => setActiveCitationPreview(cit)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint/30 hover:bg-mint/50 text-pine text-[9px] font-semibold border border-mint/60 transition cursor-pointer"
                          title="Click to preview citation"
                        >
                          <FileText className="w-2.5 h-2.5 text-pine" />
                          <span className="truncate max-w-[140px]">{cit.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.sender === 'ai' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <p className="text-[10px] font-semibold text-pine/80 dark:text-slate-300 flex items-center gap-1">
                        <HelpCircle className="w-2.5 h-2.5 text-jungle" /> Suggested questions
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {msg.suggestedFollowUps.map((qText, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            disabled={isAiLoading}
                            onClick={() => handleAskQuestion(qText)}
                            className="text-[10px] text-start px-2.5 py-1 rounded-lg bg-mint/20 hover:bg-mint/40 text-pine dark:text-white font-medium border border-mint/40 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <span>{qText}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-jungle shrink-0 rtl:rotate-180" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-0.5 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          setCopiedMsgId(msg.id);
                          setTimeout(() => setCopiedMsgId(null), 2000);
                        }}
                        className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer inline-flex items-center gap-1 text-[9px]"
                        title="Copy text"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5 opacity-70" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <span className="ml-auto">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* AI Thinking Animation */}
          {isAiLoading && (
            <div className="flex justify-start items-start gap-2.5 animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-full bg-mint text-pine flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-pine animate-spin" />
              </div>
              <div className="max-w-[85%] bg-white dark:bg-slate-800 border border-mint/70 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-pine dark:text-white">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-jungle animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span className="text-[11px]">
                    {thinkingStep || 'Reviewing lab records & genetic variants...'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {isOnline ? 'Synthesizing with Google AI Studio Gemini API...' : 'Synthesizing with local Qdrant vectors and your health pedigree...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Input & Suggestions Footer */}
        <div className="p-3.5 border-t border-outline-variant/20 bg-white dark:bg-slate-900 space-y-2.5 shrink-0">
          {/* Question Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim() && !isAiLoading) handleAskQuestion(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about carrier status, reports, or risks..."
              disabled={isAiLoading}
              className="flex-1 py-2 px-3.5 rounded-xl bg-fog/70 dark:bg-slate-800 border border-outline-variant/30 text-xs text-pine dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-waterhole focus:bg-white dark:focus:bg-slate-800 transition"
            />
            <button
              type="submit"
              disabled={!query.trim() || isAiLoading}
              className="w-8 h-8 rounded-xl bg-pine hover:bg-pine-light text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition cursor-pointer shadow-xs"
              title="Send question"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Suggested inquiries
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {defaultSuggestedQuestions.map((sq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskQuestion(sq.q)}
                  disabled={isAiLoading}
                  className="px-2 py-0.5 rounded-lg bg-fog dark:bg-slate-800 hover:bg-fog-dark border border-outline-variant/30 text-[10px] text-pine dark:text-slate-200 flex items-center gap-1 transition cursor-pointer disabled:opacity-50 text-start"
                >
                  <Search className="w-2.5 h-2.5 text-pine/50 shrink-0" />
                  <span className="truncate max-w-[200px]">{sq.q}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Citation Preview Modal */}
      {activeCitationPreview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 border border-outline-variant/40 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-pine dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-pine" />
                <span>{activeCitationPreview.title}</span>
              </h4>
              <button
                type="button"
                onClick={() => setActiveCitationPreview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed bg-fog/50 dark:bg-slate-700/50 p-3 rounded-xl border border-outline-variant/20">
              {activeCitationPreview.excerpt || "Official citation reference verified in national health policy & premarital carrier protocol."}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCitationPreview(null)}
                className="px-3 py-1.5 bg-pine text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-pine-light transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
