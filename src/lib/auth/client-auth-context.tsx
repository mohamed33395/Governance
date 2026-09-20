"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clientAuthService } from "@/services/client-auth.service";
import type { ClientUser, LoginPayload, SignupPayload } from "@/types/client-portal";

const TOKEN_KEY = "clientAuthToken";

interface ClientAuthContextValue {
  token: string | null;
  user: ClientUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    clientAuthService
      .me(stored)
      .then((me) => {
        setToken(stored);
        setUser(me);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await clientAuthService.login(payload);
    setToken(res.token);
    setUser(res.user);
    window.localStorage.setItem(TOKEN_KEY, res.token);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const res = await clientAuthService.signup(payload);
    setToken(res.token);
    setUser(res.user);
    window.localStorage.setItem(TOKEN_KEY, res.token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo<ClientAuthContextValue>(
    () => ({ token, user, isLoading, login, signup, logout }),
    [token, user, isLoading, login, signup, logout]
  );

  return <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>;
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be used within ClientAuthProvider");
  return ctx;
}
