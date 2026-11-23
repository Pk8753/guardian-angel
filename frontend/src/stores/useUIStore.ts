import { create } from 'zustand';
import { Locale } from '@/lib/translations';

export interface CitationDetail {
  title: string;
  excerpt: string;
  file_type?: string;
  source_type?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  timestamp: string;
  citationDetails?: CitationDetail[];
  suggestedFollowUps?: string[];
}

interface UIState {
  isSudoMode: boolean;
  toggleSudoMode: () => void;
  carrierNotation: 'dot' | 'half_fill' | 'letter';
  setCarrierNotation: (notation: 'dot' | 'half_fill' | 'letter') => void;
  activeLocale: Locale;
  setActiveLocale: (locale: Locale) => void;
  rehydrateLocale: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  isCreateFamilyModalOpen: boolean;
  setCreateFamilyModalOpen: (open: boolean) => void;
  isAddMemberModalOpen: boolean;
  setAddMemberModalOpen: (open: boolean) => void;
  selectedMemberForEdit: any | null;
  setSelectedMemberForEdit: (member: any | null) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  viewMode: 'patient' | 'provider';
  setViewMode: (mode: 'patient' | 'provider') => void;
  isCareAIOpen: boolean;
  setCareAIOpen: (open: boolean) => void;
  toggleCareAIOpen: () => void;
  careAIWindowState: 'normal' | 'minimized' | 'maximized';
  setCareAIWindowState: (state: 'normal' | 'minimized' | 'maximized') => void;
  careAIChatMessages: ChatMessage[];
  setCareAIChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  addCareAIChatMessage: (message: ChatMessage) => void;
  clearCareAIChatMessages: () => void;
  aiEngineMode: 'offline' | 'online';
  setAIEngineMode: (mode: 'offline' | 'online') => void;
  hasGlobalGeminiKey: boolean;
  setHasGlobalGeminiKey: (hasKey: boolean) => void;
  fetchGlobalAIConfig: () => Promise<void>;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  selectedGeminiModel: string;
  setSelectedGeminiModel: (model: string) => void;
  availableGeminiModels: Array<{ id: string; name: string; badge?: string; description?: string }>;
  setAvailableGeminiModels: (models: Array<{ id: string; name: string; badge?: string; description?: string }>) => void;
}

const DEFAULT_CARE_AI_WELCOME: ChatMessage = {
  id: 'ai-welcome',
  sender: 'ai',
  text: "Hello! I am **Care AI**, your clinical genetics and premarital screening assistant. You can ask me anything about your lab reports, carrier trait transmission probabilities, or reproductive peace-of-mind options.",
  source: 'Google AI Studio',
  timestamp: 'Just now',
  suggestedFollowUps: [
    "Can we have healthy children if we both carry traits?",
    "What does heterozygous carrier mean?",
    "What are our couple IVF with PGT-M options?"
  ]
};

const getInitialCareAIMessages = (): ChatMessage[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem('ga_care_ai_floating_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return [DEFAULT_CARE_AI_WELCOME];
};

const getInitialCareAIOpen = (): boolean => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('ga_care_ai_open') === 'true';
  }
  return false;
};

const getInitialViewMode = (): 'patient' | 'provider' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ga_view_mode') as 'patient' | 'provider' | null;
    if (saved === 'patient' || saved === 'provider') return saved;
  }
  return 'provider';
};

const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Next Gen Fast', description: 'Active high-speed multimodal intelligence' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', badge: 'Deep Reasoning', description: 'Advanced reasoning model for complex clinical genetics' },
  { id: 'gemini-3.0-flash', name: 'Gemini 3.0 Flash', badge: 'Production Fast', description: 'Standard clinical reasoning model' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Stable Fast', description: 'Comprehensive genomic intelligence' }
];

export const isGeminiModelValid = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  const low = id.toLowerCase();
  // Filter out deprecated models that Google AI Studio no longer supports
  if (low.includes('2.5-pro') || low.includes('2.0') || low.includes('1.5') || low.includes('1.0')) {
    return false;
  }
  const match = low.match(/gemini-(\d+(?:\.\d+)?)/i);
  if (match) {
    const version = parseFloat(match[1]);
    return version >= 2.5;
  }
  return false;
};

const getInitialAIMode = (): 'offline' | 'online' => {
  if (typeof window !== 'undefined') {
    const savedMode = localStorage.getItem('ga_ai_mode') as 'offline' | 'online' | null;
    if (savedMode === 'offline' || savedMode === 'online') {
      return savedMode;
    }
    const savedKey = localStorage.getItem('ga_gemini_key');
    if (savedKey && savedKey.trim()) return 'online';
  }
  return 'offline';
};

const getInitialGeminiModel = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ga_gemini_model');
    if (saved && isGeminiModelValid(saved)) {
      return saved;
    }
    // Clean up any stale or invalid model identifier (< 2.5)
    try {
      localStorage.setItem('ga_gemini_model', 'gemini-3.8-flash');
    } catch {}
  }
  return 'gemini-3.8-flash';
};

const getInitialGeminiModels = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('ga_gemini_available_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((m: any) => m && m.id && isGeminiModelValid(m.id));
          if (valid.length > 0) return valid;
        }
      }
    } catch {}
  }
  return DEFAULT_GEMINI_MODELS;
};

const getInitialLocale = (): Locale => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('guardian_locale');
      if (saved === 'en' || saved === 'ar') {
        return saved;
      }
      const cookieMatch = document.cookie.match(/(?:^|;\s*)ga_locale=([^;]+)/);
      if (cookieMatch && (cookieMatch[1] === 'en' || cookieMatch[1] === 'ar')) {
        return cookieMatch[1] as Locale;
      }
    } catch {
      // fallback
    }
  }
  return 'en';
};

const syncLocaleToDOM = (locale: Locale) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('guardian_locale', locale);
      document.cookie = `ga_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    } catch {
      // fallback
    }
  }
};

const initialLocale = getInitialLocale();
if (typeof window !== 'undefined') {
  syncLocaleToDOM(initialLocale);
}

const getInitialDarkMode = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('guardian_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark') ||
        Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {}
  }
  return false;
};

export const useUIStore = create<UIState>((set) => ({
  isSudoMode: false,
  toggleSudoMode: () => set((state) => ({ isSudoMode: !state.isSudoMode })),
  carrierNotation: 'dot',
  setCarrierNotation: (notation) => set({ carrierNotation: notation }),
  activeLocale: initialLocale,
  isSettingsModalOpen: false,
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
  setActiveLocale: (locale) => {
    syncLocaleToDOM(locale);
    set({ activeLocale: locale });
  },
  rehydrateLocale: () => {
    const locale = getInitialLocale();
    syncLocaleToDOM(locale);
    set({ activeLocale: locale });
  },
  isDarkMode: getInitialDarkMode(),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('guardian_theme', next ? 'dark' : 'light');
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDarkMode: next };
    }),
  setDarkMode: (dark) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guardian_theme', dark ? 'dark' : 'light');
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ isDarkMode: dark });
  },
  isCreateFamilyModalOpen: false,
  setCreateFamilyModalOpen: (open) => set({ isCreateFamilyModalOpen: open }),
  isAddMemberModalOpen: false,
  setAddMemberModalOpen: (open) => set({ isAddMemberModalOpen: open }),
  selectedMemberForEdit: null,
  setSelectedMemberForEdit: (member) => set({ selectedMemberForEdit: member }),
  viewMode: getInitialViewMode(),
  setViewMode: (mode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ga_view_mode', mode);
      } catch {}
    }
    set({ viewMode: mode });
  },
  isCareAIOpen: getInitialCareAIOpen(),
  setCareAIOpen: (open) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('ga_care_ai_open', String(open));
      } catch {}
    }
    set({ isCareAIOpen: open });
  },
  toggleCareAIOpen: () =>
    set((state) => {
      const next = !state.isCareAIOpen;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('ga_care_ai_open', String(next));
        } catch {}
      }
      return { isCareAIOpen: next };
    }),
  careAIWindowState: 'normal',
  setCareAIWindowState: (winState) => set({ careAIWindowState: winState }),
  careAIChatMessages: getInitialCareAIMessages(),
  setCareAIChatMessages: (messages) =>
    set((state) => {
      const next = typeof messages === 'function' ? messages(state.careAIChatMessages) : messages;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('ga_care_ai_floating_chat_history', JSON.stringify(next));
        } catch {}
      }
      return { careAIChatMessages: next };
    }),
  addCareAIChatMessage: (message) =>
    set((state) => {
      const next = [...state.careAIChatMessages, message];
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('ga_care_ai_floating_chat_history', JSON.stringify(next));
        } catch {}
      }
      return { careAIChatMessages: next };
    }),
  clearCareAIChatMessages: () => {
    const cleared: ChatMessage[] = [
      {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: "Conversation cleared. How can I assist you with your family genetics, carrier screening, or pedigree health records today?",
        source: 'Care AI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          "Can we have healthy children?",
          "Explain our carrier risk",
          "What is premarital genetic counseling?"
        ]
      }
    ];
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('ga_care_ai_floating_chat_history', JSON.stringify(cleared));
      } catch {}
    }
    set({ careAIChatMessages: cleared });
  },
  aiEngineMode: getInitialAIMode(),
  setAIEngineMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ga_ai_mode', mode);
    }
    set({ aiEngineMode: mode });
  },
  hasGlobalGeminiKey: false,
  setHasGlobalGeminiKey: (hasKey) =>
    set((state) => ({
      hasGlobalGeminiKey: hasKey,
      aiEngineMode: hasKey ? 'online' : state.aiEngineMode,
    })),
  fetchGlobalAIConfig: async () => {
    try {
      const res = await fetch('/api/ai/config');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const hasKey = Boolean(data.has_key);
          const updates: Partial<UIState> = {
            hasGlobalGeminiKey: hasKey,
          };
          if (hasKey) {
            updates.aiEngineMode = 'online';
            if (typeof window !== 'undefined') {
              localStorage.setItem('ga_ai_mode', 'online');
            }
          }
          if (data.current_model && isGeminiModelValid(data.current_model)) {
            updates.selectedGeminiModel = data.current_model;
            if (typeof window !== 'undefined') {
              localStorage.setItem('ga_gemini_model', data.current_model);
            }
          }
          if (Array.isArray(data.models) && data.models.length > 0) {
            const valid = data.models.filter((m: any) => m && m.id && isGeminiModelValid(m.id));
            if (valid.length > 0) {
              updates.availableGeminiModels = valid;
              if (typeof window !== 'undefined') {
                localStorage.setItem('ga_gemini_available_models', JSON.stringify(valid));
              }
            }
          }
          set(updates);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch global AI config:', err);
    }
  },
  geminiApiKey: typeof window !== 'undefined' ? localStorage.getItem('ga_gemini_key') || '' : '',
  setGeminiApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ga_gemini_key', key);
      if (key && key.trim()) {
        localStorage.setItem('ga_ai_mode', 'online');
      }
    }
    set((state) => ({
      geminiApiKey: key,
      aiEngineMode: key && key.trim() ? 'online' : state.aiEngineMode
    }));
  },
  selectedGeminiModel: getInitialGeminiModel(),
  setSelectedGeminiModel: (model) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ga_gemini_model', model);
    }
    set({ selectedGeminiModel: model });
  },
  availableGeminiModels: getInitialGeminiModels(),
  setAvailableGeminiModels: (models) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ga_gemini_available_models', JSON.stringify(models));
      } catch {}
    }
    set({ availableGeminiModels: models });
  },
}));
