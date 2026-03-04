import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, "");

function Toast({ item, onClose }) {
  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-lg dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {item.title || "Notification"}
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {item.message || ""}
          </div>
          {item.createdAt && (
            <div className="mt-2 text-xs text-slate-400">
              {new Date(item.createdAt).toLocaleString()}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function RealtimeNotifications() {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const s = io(SOCKET_BASE, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = s;

    s.on("notification", (payload) => {
      const item = { id: crypto.randomUUID(), ...payload };
      setToasts((prev) => [item, ...prev].slice(0, 5));

      // auto-close after 8s
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== item.id));
      }, 8000);
    });

    return () => {
      try { s.disconnect(); } catch (_) {}
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  if (!isAuthenticated) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          item={t}
          onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
