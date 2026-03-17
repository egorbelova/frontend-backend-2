import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, authStorage, type MeResponse } from '../api';

type AuthContextValue = {
  user: MeResponse | null;
  loading: boolean;
  refreshMe: () => Promise<MeResponse | null>;
  login: (email: string, password: string) => Promise<MeResponse>;
  register: (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: MeResponse['role'];
  }) => Promise<MeResponse>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async (): Promise<MeResponse | null> => {
    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch {
      authStorage.clearToken();
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshMe,
      login: async (email, password) => {
        const { accessToken } = await api.login(email, password);
        authStorage.setToken(accessToken);
        const me = await api.me();
        setUser(me);
        return me;
      },
      register: async (payload) => {
        await api.register(payload);
        const { accessToken } = await api.login(payload.email, payload.password);
        authStorage.setToken(accessToken);
        const me = await api.me();
        setUser(me);
        return me;
      },
      logout: async () => {
        await api.logout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

