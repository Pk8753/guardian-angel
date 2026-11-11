import { create } from 'zustand';
import { Locale } from '@/lib/translations';

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
}

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
  isDarkMode: false,
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
  viewMode: 'patient',
  setViewMode: (mode) => set({ viewMode: mode }),
}));
