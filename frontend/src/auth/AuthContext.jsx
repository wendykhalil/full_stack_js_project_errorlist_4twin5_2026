import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { apiFetch } from './api';

const AuthContext = createContext(null);

const LS_TOKEN = 'bmptn_token';
const LS_USER = 'bmptn_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(LS_USER);
    return raw ? JSON.parse(raw) : null;
  });

  const isAuthenticated = Boolean(token && user);

  const persist = useCallback((nextToken, nextUser) => {
    setToken(nextToken || '');
    setUser(nextUser || null);
    if (nextToken) localStorage.setItem(LS_TOKEN, nextToken);
    else localStorage.removeItem(LS_TOKEN);
    if (nextUser) localStorage.setItem(LS_USER, JSON.stringify(nextUser));
    else localStorage.removeItem(LS_USER);
  }, []);

  // Expose a generic setter so other login methods (e.g., SMS OTP) can update
  // the in-memory auth state immediately (avoids redirecting back to /login).
  const setSession = useCallback((nextToken, nextUser) => {
    persist(nextToken, nextUser);
  }, [persist]);

  const updateSessionUser = useCallback((nextUser) => {
    persist(token, nextUser || null);
  }, [persist, token]);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const loginWithGoogle = useCallback(async (credential, role) => {
    const data = await apiFetch('/auth/google', { method: 'POST', body: { credential, ...(role ? { role } : {}) } });
    persist(data.token, data.user);
    return data; // { token, user, needsRole }
  }, [persist]);

  const register = useCallback(async (payload) => {
    const data = await apiFetch('/auth/register', { method: 'POST', body: payload });
    return data.user;
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return null;
    const data = await apiFetch('/auth/me', { token });
    // /auth/me returns { user }
    persist(token, data.user);
    return data.user;
  }, [token, persist]);

  const updateProfile = useCallback(async (payload) => {
    const data = await apiFetch('/auth/profile', { method: 'PATCH', token, body: payload });
    if (data?.user) persist(token, data.user);
    return data.user;
  }, [token, persist]);

  const changePassword = useCallback(async (payload) => {
    return apiFetch('/auth/change-password', { method: 'POST', token, body: payload });
  }, [token]);

  const logout = useCallback(async () => {
    // Best-effort server-side audit log
    try {
      if (token) {
        await apiFetch('/auth/logout', { method: 'POST', token });
      }
    } catch {
      // ignore - intentionally empty
    } finally {
      persist('', null);
    }
  }, [token, persist]);

  const forgotPassword = useCallback(async (payload) => {
    return apiFetch('/auth/forgot-password', { method: 'POST', body: payload });
  }, []);

  const resetPassword = useCallback(async (payload) => {
    return apiFetch('/auth/reset-password', { method: 'POST', body: payload });
  }, []);

  const value = useMemo(
    () => ({
      token, 
      user, 
      isAuthenticated,
      login, 
      loginWithGoogle, 
      register, 
      refreshMe,
      updateProfile, 
      changePassword, 
      logout,
      setSession,
      updateSessionUser,
      forgotPassword, 
      resetPassword
    }),
    [
      token, 
      user, 
      isAuthenticated,
      login, 
      loginWithGoogle, 
      register, 
      refreshMe,
      updateProfile, 
      changePassword, 
      logout,
      setSession,
      updateSessionUser,
      forgotPassword, 
      resetPassword
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}