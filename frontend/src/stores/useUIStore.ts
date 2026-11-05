import { create } from 'zustand';
import { Locale } from '@/lib/translations';

interface UIState {
  isSudoMode: boolean;
  toggleSudoMode: () => void;
  carrierNotation: 'dot' | 'half_fill' | 'letter';
  setCarrierNotation: (notation: 'dot' | 'half_fill' | 'letter') => void;
  activeLocale: Locale;
  setActiveLocale: (locale: Locale) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  isCreateFamilyModalOpen: boolean;
  setCreateFamilyModalOpen: (open: boolean) => void;
  isAddMemberModalOpen: boolean;
  setAddMemberModalOpen: (open: boolean) => void;
  selectedMemberForEdit: any | null;
  setSelectedMemberForEdit: (member: any | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSudoMode: false,
  toggleSudoMode: () => set((state) => ({ isSudoMode: !state.isSudoMode })),
  carrierNotation: 'dot',
  setCarrierNotation: (notation) => set({ carrierNotation: notation }),
  activeLocale: 'en',
  setActiveLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guardian_locale', locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
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
}));
