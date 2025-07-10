// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  token: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  getToken: () => string | null;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      // store the entire User object; you can extend User later
      login: (user) => {
        set({ user });
      },

      logout: () => {
        set({ user: null });
      },

      // convenience getters
      getToken: () => {
        return get().user?.token ?? null;
      },
      isLoggedIn: () => {
        return get().user !== null;
      },
    }),
    {
      name: 'admin-auth',      // key in localStorage
      // you can add whitelist/blacklist here if you only want to persist certain fields
      // whitelist: ['user']
    }
  )
);
