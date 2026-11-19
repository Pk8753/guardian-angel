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
  role?: string;
}

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (user: UserSession) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserSession>) => void;
}

export const normalizeUser = (raw: any): UserSession | null => {
  if (!raw) return null;
  const fullName = raw.fullName || raw.full_name || raw.name || raw.username || 'Patient';
  const aliasName = raw.aliasName || raw.alias_name || 'Anonymous-Patient';
  const role = raw.role || (raw.isAdmin || (typeof raw.username === 'string' && raw.username.toLowerCase() === 'admin') ? 'admin' : 'patient');
  return {
    id: raw.id,
    username: raw.username,
    fullName,
    aliasName,
    email: raw.email || '',
    role,
    isAdmin: raw.isAdmin ?? (typeof raw.username === 'string' && raw.username.toLowerCase() === 'admin'),
    isFreshUser: raw.isFreshUser ?? false,
    dob: raw.dob,
    location: raw.location
  };
};

const getInitialAuth = (): { user: UserSession | null; isAuthenticated: boolean } => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  try {
    const hasCookie = document.cookie.includes('ga_auth_session=1');
    const stored = sessionStorage.getItem('ga_user') || localStorage.getItem('ga_user');
    if (hasCookie && stored) {
      const parsed = JSON.parse(stored);
      const normalized = normalizeUser(parsed);
      return { user: normalized, isAuthenticated: !!normalized };
    }
  } catch {
    // Ignore parse error
  }
  return { user: null, isAuthenticated: false };
};

// Global transparent fetch interceptor for multi-tab X-Session-User-Id isolation
if (typeof window !== 'undefined' && !(window as any).__ga_fetch_intercepted) {
  (window as any).__ga_fetch_intercepted = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const stored = sessionStorage.getItem('ga_user') || localStorage.getItem('ga_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id) {
          init = init ? { ...init } : {};
          const headers = new Headers(init.headers || {});
          if (!headers.has('X-Session-User-Id')) {
            headers.set('X-Session-User-Id', String(u.id));
          }
          init.headers = headers;
        }
      }
    } catch {
      // ignore
    }
    return originalFetch(input, init);
  };
}

const initial = getInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  isAuthenticated: initial.isAuthenticated,
  login: (rawUser) => {
    const user = normalizeUser(rawUser);
    if (typeof window !== 'undefined' && user) {
      try {
        sessionStorage.setItem('ga_user', JSON.stringify(user));
        localStorage.setItem('ga_user', JSON.stringify(user));
        document.cookie = 'ga_auth_session=1; path=/; max-age=86400; SameSite=Lax';
      } catch (e) {
        console.error('Storage error', e);
      }
    }
    set({ user, isAuthenticated: !!user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('ga_user');
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
      const updated = state.user ? normalizeUser({ ...state.user, ...updates }) : null;
      if (typeof window !== 'undefined' && updated) {
        try {
          sessionStorage.setItem('ga_user', JSON.stringify(updated));
          localStorage.setItem('ga_user', JSON.stringify(updated));
        } catch {}
      }
      return { user: updated };
    }),
}));
