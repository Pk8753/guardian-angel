import { create } from 'zustand';

interface UIState {
  isSudoMode: boolean;
  toggleSudoMode: () => void;
  carrierNotation: 'dot' | 'half_fill' | 'letter';
  setCarrierNotation: (notation: 'dot' | 'half_fill' | 'letter') => void;
  activeLocale: 'en' | 'ar' | 'hi';
  setActiveLocale: (locale: 'en' | 'ar' | 'hi') => void;
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
  setActiveLocale: (locale) => set({ activeLocale: locale }),
  isCreateFamilyModalOpen: false,
  setCreateFamilyModalOpen: (open) => set({ isCreateFamilyModalOpen: open }),
  isAddMemberModalOpen: false,
  setAddMemberModalOpen: (open) => set({ isAddMemberModalOpen: open }),
  selectedMemberForEdit: null,
  setSelectedMemberForEdit: (member) => set({ selectedMemberForEdit: member }),
}));

