/**
 * SupplierOrderContext
 * Global state for the supplier's active order count and real-time order list.
 * Lives at the layout level so it persists across all /fournisseur/* pages.
 *
 * Provides:
 *   pendingCount  — number of PENDING + ACCEPTED + PREPARING orders
 *   newOrderIds   — Set of order IDs that just arrived via socket (for NEW badge)
 *   addOrder      — called by socket handler to inject a new order
 *   clearNew      — remove an ID from newOrderIds after badge timeout
 *   setInitialCount — called by FournisseurOrders on first fetch
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const SupplierOrderContext = createContext(null);

export function SupplierOrderProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [newOrderIds,  setNewOrderIds]  = useState(new Set());
  const timerRefs = useRef({});

  /** Called once by FournisseurOrders after the initial REST fetch */
  const setInitialCount = useCallback((count) => {
    setPendingCount(count);
  }, []);

  /** Called by socket handler when a new_order event arrives */
  const addOrder = useCallback((orderId) => {
    const id = String(orderId);
    setPendingCount(c => c + 1);
    setNewOrderIds(prev => new Set([...prev, id]));

    // Auto-clear the NEW badge after 30 s
    if (timerRefs.current[id]) clearTimeout(timerRefs.current[id]);
    timerRefs.current[id] = setTimeout(() => {
      setNewOrderIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      delete timerRefs.current[id];
    }, 30000);
  }, []);

  /** Manually clear a NEW badge (e.g. when supplier clicks the order) */
  const clearNew = useCallback((orderId) => {
    const id = String(orderId);
    setNewOrderIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (timerRefs.current[id]) { clearTimeout(timerRefs.current[id]); delete timerRefs.current[id]; }
  }, []);

  /** Decrement when supplier accepts/refuses an order (optional, for accuracy) */
  const decrementPending = useCallback(() => {
    setPendingCount(c => Math.max(0, c - 1));
  }, []);

  return (
    <SupplierOrderContext.Provider value={{ pendingCount, newOrderIds, setInitialCount, addOrder, clearNew, decrementPending }}>
      {children}
    </SupplierOrderContext.Provider>
  );
}

export function useSupplierOrders() {
  const ctx = useContext(SupplierOrderContext);
  if (!ctx) throw new Error('useSupplierOrders must be used inside SupplierOrderProvider');
  return ctx;
}
