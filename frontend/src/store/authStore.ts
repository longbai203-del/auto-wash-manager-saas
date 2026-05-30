import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // 临时模拟登录
        if (email === 'admin@autowash.com' && password === 'admin123') {
          set({
            user: { id: 1, email, full_name: '系统管理员', role: 'admin' },
            token: 'fake-token',
            isAuthenticated: true,
          });
        } else {
          throw new Error('Invalid credentials');
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage' }
  )
);
