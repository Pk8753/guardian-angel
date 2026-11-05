import { create } from 'zustand';

export interface UserSession {
  id: number;
  username: string;
  fullName: string;
  aliasName?: string;
  isAdmin: boolean;
  isFreshUser?: boolean;
  email?: string;
  dob?: string;
  location?: string;
}

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (user: UserSession) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserSession>) => void;
}

const getInitialAuth = (): { user: UserSession | null; isAuthenticated: boolean } => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  try {
    const hasCookie = document.cookie.includes('ga_auth_session=1');
    const stored = localStorage.getItem('ga_user');
    if (hasCookie && stored) {
      return { user: JSON.parse(stored), isAuthenticated: true };
    }
  } catch {
    // Ignore parse error
  }
  return { user: null, isAuthenticated: false };
};

const initial = getInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  isAuthenticated: initial.isAuthenticated,
  login: (user) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ga_user', JSON.stringify(user));
        document.cookie = 'ga_auth_session=1; path=/; max-age=86400; SameSite=Lax';
      } catch (e) {
        console.error('Storage error', e);
      }
    }
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ga_user');
        document.cookie = 'ga_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      } catch (e) {
        console.error('Storage error', e);
      }
      // Invalidate backend session cookie to maintain identity synchronization
      fetch('/api/logout', { method: 'POST' }).catch(() => {});
    }
    set({ user: null, isAuthenticated: false });
  },
  updateUser: (updates) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...updates } : null;
      if (typeof window !== 'undefined' && updated) {
        try {
          localStorage.setItem('ga_user', JSON.stringify(updated));
        } catch {}
      }
      return { user: updated };
    }),
}));
