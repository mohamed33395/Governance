import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClientMe } from '@/types/api';

type ClientAuthState = {
  token: string | null;
  user: ClientMe | null;
  setAuth: (token: string, user: ClientMe) => void;
  setUser: (user: ClientMe) => void;
  clear: () => void;
};

export const useClientAuth = create<ClientAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'client_auth' }
  )
);
