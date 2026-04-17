/**
 * useSupplierSocket
 * Connects to Socket.io as a SUPPLIER and listens for:
 *   - "new_order"    → calls onNewOrder(orderPayload)
 *   - "notification" → calls onNotification(notifPayload)
 *
 * Automatically reconnects when token changes.
 * Safe to call from multiple components — each call creates its own socket.
 */
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function useSupplierSocket({ token, onNewOrder, onNotification } = {}) {
  const socketRef    = useRef(null);
  const callbacksRef = useRef({ onNewOrder, onNotification });

  // Keep callbacks fresh without reconnecting
  useEffect(() => {
    callbacksRef.current = { onNewOrder, onNotification };
  });

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_BASE, {
      transports: ['websocket'],
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('new_order', (payload) => {
      callbacksRef.current.onNewOrder?.(payload);
    });

    socket.on('notification', (payload) => {
      callbacksRef.current.onNotification?.(payload);
    });

    return () => {
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [token]);
}
