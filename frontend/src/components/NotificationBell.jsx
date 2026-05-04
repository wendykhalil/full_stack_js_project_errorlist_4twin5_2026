import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getNotifications, getUnreadNotifCount,
  markNotificationRead, markAllNotificationsRead, deleteNotification,
} from '../auth/api';

// ─── Notification type → emoji ───────────────────────────────────────────────
const TYPE_ICON = {
  ORDER_STATUS:              '📦',
  NEW_MESSAGE:               '💬',
  APPLICATION_RECEIVED:      '📋',
  APPLICATION_ACCEPTED:      '✅',
  APPLICATION_REJECTED:      '❌',
  REVIEW_RECEIVED:           '⭐',
  SERVICE_REQUEST_ASSIGNED:  '🔧',
  SERVICE_REQUEST_COMPLETED: '🏁',
  SUBSCRIPTION_EXPIRING:     '⏰',
  NEW_SERVICE_REQUEST:       '📢',
  GENERAL:                   '🔔',
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

// ─── Component ────────────────────────────────────────────────────────────────
function NotificationBell() {
  // ✅ FIX 1: destructure token + isAuthenticated from AuthContext
  const { token, isAuthenticated } = useAuth();
  // ✅ FIX 2: useNavigate was missing — caused crash in handleClick
  const navigate = useNavigate();

  const [open, setOpen]       = useState(false);
  const [items, setItems]     = useState([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(false);
  const drawerRef             = useRef(null);

  // ─── API helpers ────────────────────────────────────────────────────────────

  const loadCount = useCallback(async () => {
    // ✅ FIX 3: guard — do nothing if not authenticated
    if (!token) return;
    try {
      const res = await getUnreadNotifCount({ token });
      setUnread(res?.count || 0);
    } catch (err) {
      // Silent fail — badge just stays at 0, no crash
      if (import.meta.env.DEV) console.warn('[NotificationBell] loadCount failed:', err);
    }
  }, [token]);

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getNotifications({ token });
      const list = res?.items || [];
      setItems(list);
      setUnread(list.filter(n => !n.read).length);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[NotificationBell] loadAll failed:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Initial count fetch — only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    loadCount();
  }, [isAuthenticated, loadCount]);

  // Poll every 30s + listen for real-time push from RealtimeNotifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(loadCount, 30_000);
    window.addEventListener('notif:refresh', loadCount);
    return () => {
      clearInterval(id);
      window.removeEventListener('notif:refresh', loadCount);
    };
  }, [isAuthenticated, loadCount]);

  // Load full list when drawer opens
  useEffect(() => {
    if (open) loadAll();
  }, [open, loadAll]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleClick(item) {
    if (!token) return;
    if (!item.read) {
      try {
        await markNotificationRead({ token, id: item._id });
        setItems(prev => prev.map(n => n._id === item._id ? { ...n, read: true } : n));
        setUnread(c => Math.max(0, c - 1));
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[NotificationBell] markRead failed:', err);
      }
    }
    if (item.link) {
      setOpen(false);
      navigate(item.link);
    }
  }

  async function handleMarkAll() {
    if (!token) return;
    try {
      await markAllNotificationsRead({ token });
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[NotificationBell] markAll failed:', err);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!token) return;
    try {
      await deleteNotification({ token, id });
      setItems(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[NotificationBell] delete failed:', err);
    }
  }

  // ✅ FIX 4: don't render at all if not logged in — prevents any token-related crash
  if (!isAuthenticated) return null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={drawerRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Tout marquer comme lu"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                Chargement…
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Aucune notification</p>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item._id}
                  onClick={() => handleClick(item)}
                  className={`group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    !item.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                  }`}
                >
                  <span className="mt-0.5 text-lg shrink-0">{TYPE_ICON[item.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!item.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.title}
                    </p>
                    {item.message && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {item.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.link && <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
                    <button
                      onClick={(e) => handleDelete(e, item._id)}
                      className="rounded p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!item.read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(NotificationBell);
