import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getNotifications, getUnreadNotifCount,
  markNotificationRead, markAllNotificationsRead, deleteNotification,
} from '../auth/api';

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
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

export default function NotificationBell() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  const loadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotifCount({ token });
      setUnread(res.count || 0);
    } catch {}
  }, [token]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications({ token });
      setItems(res.items || []);
      setUnread((res.items || []).filter(n => !n.read).length);
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadCount(); }, [loadCount]);

  // Poll unread count every 30s + listen for real-time refresh
  useEffect(() => {
    const id = setInterval(loadCount, 30000);
    window.addEventListener('notif:refresh', loadCount);
    return () => { clearInterval(id); window.removeEventListener('notif:refresh', loadCount); };
  }, [loadCount]);

  useEffect(() => {
    if (open) loadAll();
  }, [open, loadAll]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleClick(item) {
    if (!item.read) {
      await markNotificationRead({ token, id: item._id });
      setItems(prev => prev.map(n => n._id === item._id ? { ...n, read: true } : n));
      setUnread(c => Math.max(0, c - 1));
    }
    if (item.link) {
      setOpen(false);
      navigate(item.link);
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead({ token });
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    await deleteNotification({ token, id });
    setItems(prev => prev.filter(n => n._id !== id));
  }

  return (
    <div className="relative" ref={drawerRef}>
      <button onClick={() => setOpen(v => !v)}
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAll} title="Tout marquer comme lu"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-400">Chargement…</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">Aucune notification</p>
              </div>
            ) : items.map(item => (
              <div key={item._id} onClick={() => handleClick(item)}
                className={`group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!item.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                <span className="mt-0.5 text-lg shrink-0">{TYPE_ICON[item.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!item.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {item.title}
                  </p>
                  {item.message && <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{item.message}</p>}
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(item.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.link && <ExternalLink className="h-3.5 w-3.5 text-slate-400" />}
                  <button onClick={(e) => handleDelete(e, item._id)}
                    className="rounded p-0.5 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {!item.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
