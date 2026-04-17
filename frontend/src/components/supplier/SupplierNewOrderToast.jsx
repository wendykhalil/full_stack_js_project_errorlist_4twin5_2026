/**
 * SupplierNewOrderToast
 * Renders a stack of real-time "new order" toast notifications.
 * Auto-dismisses after 8 seconds.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, X } from 'lucide-react';

function SingleToast({ toast, onDismiss }) {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-indigo-200 bg-white p-4 shadow-xl animate-in slide-in-from-right-4 duration-300 dark:bg-slate-900 dark:border-indigo-800">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900">
        <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          🛒 Nouvelle commande reçue !
        </p>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
          <span className="font-medium">{toast.artisanName}</span> a commandé{' '}
          {toast.quantity}× <span className="font-medium">{toast.productName}</span>
          {toast.totalPrice != null && ` — ${Number(toast.totalPrice).toFixed(2)} TND`}
        </p>
        <button
          type="button"
          onClick={() => { onDismiss(); navigate(`/fournisseur/orders/${toast.orderId}`); }}
          className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          Voir la commande →
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function SupplierNewOrderToast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(t => (
        <SingleToast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
