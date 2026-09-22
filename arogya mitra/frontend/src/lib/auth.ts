import { create } from 'zustand';
import { api } from './api';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: 'SUPERADMIN' | 'DOCTOR' | 'CHO' | 'ANM' | 'ASHA' | 'NURSE' | 'PHARMACIST' | 'BILLING';
  branch_id?: string;
  designation?: string;
  email?: string;
  phone?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('arogya_user') || 'null'),
  accessToken: localStorage.getItem('arogya_access_token'),
  isAuthenticated: !!localStorage.getItem('arogya_access_token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/auth/login', { username, password });
      localStorage.setItem('arogya_access_token', data.access_token);
      localStorage.setItem('arogya_refresh_token', data.refresh_token);
      localStorage.setItem('arogya_user', JSON.stringify(data.user));

      set({
        user: data.user,
        accessToken: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('arogya_access_token');
    localStorage.removeItem('arogya_refresh_token');
    localStorage.removeItem('arogya_user');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: async () => {
    const token = localStorage.getItem('arogya_access_token');
    if (!token) return;

    try {
      const user = await api.get<UserProfile>('/auth/me');
      localStorage.setItem('arogya_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      // Token might be invalid or expired
      localStorage.removeItem('arogya_access_token');
      localStorage.removeItem('arogya_user');
      set({ user: null, isAuthenticated: false });
    }
  },
}));
