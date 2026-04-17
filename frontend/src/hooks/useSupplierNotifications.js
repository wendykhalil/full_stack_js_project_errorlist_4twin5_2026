/**
 * useSupplierNotifications
 * Manages the supplier notification list + unread count.
 * Fetches from REST on mount, then merges real-time socket events.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../auth/api';

export function useSupplierNotifications(token) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch('/notifications?limit=30', { token });
      if (!mountedRef.current) return;
      const items = res?.items || [];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
    } catch {
      // non-critical
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Called by useSupplierSocket when a real-time notification arrives
  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{ ...notif, read: false }, ...prev].slice(0, 50));
    setUnreadCount(c => c + 1);
  }, []);

  const markRead = useCallback(async (id) => {
    if (!token) return;
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));
    try { await apiFetch(`/notifications/${id}/read`, { token, method: 'PATCH' }); } catch {}
  }, [token]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await apiFetch('/notifications/read-all', { token, method: 'PATCH' }); } catch {}
  }, [token]);

  return { notifications, unreadCount, loading, addNotification, markRead, markAllRead, refetch: fetchNotifications };
}
