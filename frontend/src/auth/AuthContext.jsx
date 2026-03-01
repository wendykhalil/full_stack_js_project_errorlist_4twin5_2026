import React, { createContext, useContext, useMemo, useState } from 'react';
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

  function persist(nextToken, nextUser) {
    setToken(nextToken || '');
    setUser(nextUser || null);
    if (nextToken) localStorage.setItem(LS_TOKEN, nextToken);
    else localStorage.removeItem(LS_TOKEN);
    if (nextUser) localStorage.setItem(LS_USER, JSON.stringify(nextUser));
    else localStorage.removeItem(LS_USER);
  }

  // Expose a generic setter so other login methods (e.g., SMS OTP) can update
  // the in-memory auth state immediately (avoids redirecting back to /login).
  function setSession(nextToken, nextUser) {
    persist(nextToken, nextUser);
  }

  async function login(email, password) {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    persist(data.token, data.user);
    return data.user;
  }

  async function loginWithGoogle(credential, role) {
    const data = await apiFetch('/auth/google', { method: 'POST', body: { credential, ...(role ? { role } : {}) } });
    persist(data.token, data.user);
    return data; // { token, user, needsRole }
  }

  async function register(payload) {
    const data = await apiFetch('/auth/register', { method: 'POST', body: payload });
    return data.user;
  }

  async function refreshMe() {
    if (!token) return null;
    const data = await apiFetch('/auth/me', { token });
    // /auth/me returns { user }
    persist(token, data.user);
    return data.user;
  }

  async function updateProfile(payload) {
    const data = await apiFetch('/auth/profile', { method: 'PATCH', token, body: payload });
    if (data?.user) persist(token, data.user);
    return data.user;
  }

  async function changePassword(payload) {
    return apiFetch('/auth/change-password', { method: 'POST', token, body: payload });
  }

  async function logout() {
    // Best-effort server-side audit log
    try {
      if (token) {
        await apiFetch('/auth/logout', { method: 'POST', token });
      }
    } catch (_) {
      // ignore
    } finally {
      persist('', null);
    }
  }

  const value = useMemo(
    () => ({
  token, user, isAuthenticated,
  login, loginWithGoogle, register, refreshMe,
  updateProfile, changePassword, logout,
  setSession,
  forgotPassword, resetPassword
})
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function forgotPassword(payload) {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: payload });
}

async function resetPassword(payload) {
  return apiFetch('/auth/reset-password', { method: 'POST', body: payload });
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
