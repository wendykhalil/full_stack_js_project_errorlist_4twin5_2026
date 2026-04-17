/**
 * CartContext — global cart state for the artisan.
 * Persists across navigation. Syncs with backend on mount.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCart, addToCart as apiAdd, removeFromCart as apiRemove, updateCartQty as apiUpdate } from '../auth/api';
import { useAuth } from '../auth/AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [items,     setItems]     = useState([]);   // { _id, product, quantity, priceSnapshot, lineTotal }
  const [total,     setTotal]     = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading,   setLoading]   = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getCart({ token });
      setItems(res?.items     ?? []);
      setTotal(res?.total     ?? 0);
      setItemCount(res?.itemCount ?? 0);
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    if (!token) return;
    await apiAdd({ token, productId, quantity });
    await refresh();
  }, [token, refresh]);

  const removeItem = useCallback(async (productId) => {
    if (!token) return;
    // Optimistic
    setItems(prev => prev.filter(i => String(i.product._id) !== String(productId)));
    await apiRemove({ token, productId });
    await refresh();
  }, [token, refresh]);

  const updateQty = useCallback(async (productId, quantity) => {
    if (!token) return;
    setItems(prev => prev.map(i =>
      String(i.product._id) === String(productId)
        ? { ...i, quantity, lineTotal: Number((i.priceSnapshot * quantity).toFixed(2)) }
        : i
    ));
    await apiUpdate({ token, productId, quantity });
    await refresh();
  }, [token, refresh]);

  return (
    <CartContext.Provider value={{ items, total, itemCount, loading, addItem, removeItem, updateQty, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
