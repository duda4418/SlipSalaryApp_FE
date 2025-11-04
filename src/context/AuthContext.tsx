"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { login as apiLogin, logout as apiLogout, getStoredTokens, decodeAccess, storeTokens, scheduleAutoRefresh } from '@/lib/apiClient';
import type { TokenResponse, DecodedAccessToken } from '@/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  decoded: DecodedAccessToken | null;
  loading: boolean;
  isManager: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedAccessToken | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const bootstrap = useCallback(() => {
    const { access, refresh } = getStoredTokens();
    setAccessToken(access);
    setRefreshToken(refresh);
    setDecoded(access ? decodeAccess(access) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = scheduleAutoRefresh(async () => {
      await refresh();
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiLogin(email, password);
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken || null);
    const dec = decodeAccess(tokens.accessToken);
    setDecoded(dec);
    startAutoRefresh();
  }, [startAutoRefresh]);

  const logout = useCallback(() => {
    apiLogout();
    setAccessToken(null);
    setRefreshToken(null);
    setDecoded(null);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }, []);

  const refresh = useCallback(async () => {
    if (!refreshToken) return;
    try {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return;
      const data: TokenResponse = await res.json();
      storeTokens(data);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken || null);
      setDecoded(decodeAccess(data.accessToken));
    } catch {
      // ignore network errors
    }
  }, [refreshToken]);

  useEffect(() => {
    if (accessToken && refreshToken) startAutoRefresh();
  }, [accessToken, refreshToken, startAutoRefresh]);

  const value = useMemo<AuthContextValue>(() => ({
    accessToken,
    refreshToken,
    decoded,
    loading,
    isManager: !!decoded?.is_manager,
    login,
    logout,
    refresh,
  }), [accessToken, refreshToken, decoded, loading, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
