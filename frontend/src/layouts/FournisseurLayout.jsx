import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, LayoutDashboard, MessageCircle, Package,
  Plus, ShoppingBag, UserCircle2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import RoleWorkspace from '../components/RoleWorkspace';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useSupplierSocket } from '../hooks/useSupplierSocket';
import { useSupplierNotifications } from '../hooks/useSupplierNotifications';
import SupplierNotificationBell from '../components/supplier/SupplierNotificationBell';
import SupplierNewOrderToast from '../components/supplier/SupplierNewOrderToast';
import { SupplierOrderProvider, useSupplierOrders } from '../context/SupplierOrderContext';
import { apiFetch } from '../auth/api';

// ── Inner layout — has access to SupplierOrderContext ────────────────────────
function FournisseurLayoutInner() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [logoError,    setLogoError]    = useState(false);
  const [orderToasts,  setOrderToasts]  = useState([]);

  const unreadMessages = useUnreadMessages();
  const { pendingCount, addOrder } = useSupplierOrders();

  // ── Notifications ─────────────────────────────────────────────────────────
  const {
    notifications,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
  } = useSupplierNotifications(token);

  // ── Fetch initial pending count once ─────────────────────────────────────
  const { setInitialCount } = useSupplierOrders();
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!token || fetchedRef.current) return;
    fetchedRef.current = true;
    apiFetch('/orders/supplier?status=PENDING,ACCEPTED,PREPARING&limit=1', { token })
      .then(res => {
        const total = res?.data?.pagination?.total ?? res?.pagination?.total ?? 0;
        setInitialCount(Number(total));
      })
      .catch(() => {});
  }, [token, setInitialCount]);

  // ── Socket ────────────────────────────────────────────────────────────────
  const handleNewOrder = useCallback((payload) => {
    addOrder(payload.orderId);
    const id = crypto.randomUUID();
    setOrderToasts(prev => [{ id, ...payload }, ...prev].slice(0, 4));
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [addOrder]);

  const handleNotification = useCallback((notif) => {
    addNotification(notif);
  }, [addNotification]);

  useSupplierSocket({ token, onNewOrder: handleNewOrder, onNotification: handleNotification });

  // ── Supplier logo ─────────────────────────────────────────────────────────
  const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const supplierLogo = useMemo(() => {
    if (!logoError && user?.supplierProfile?.logo) {
      return user.supplierProfile.logo.startsWith('http')
        ? user.supplierProfile.logo
        : `${SERVER_URL}${user.supplierProfile.logo}`;
    }
    return null;
  }, [logoError, user, SERVER_URL]);

  // ── Nav items — orders badge uses global pendingCount ─────────────────────
  const messageIcon = (
    <span className="relative inline-flex">
      <MessageCircle className="h-5 w-5" />
      {unreadMessages > 0 && (
        <span className="absolute -right-2 -top-2 min-w-[1rem] rounded-full bg-red-500 px-1 text-[10px] text-white">
          {unreadMessages > 99 ? '99+' : unreadMessages}
        </span>
      )}
    </span>
  );

  const ordersIcon = (
    <span className="relative inline-flex">
      <ShoppingBag className="h-5 w-5" />
      {pendingCount > 0 && (
        <span className="absolute -right-2 -top-2 min-w-[1rem] rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </span>
  );

  const navItems = [
    { to: '/fournisseur',             label: 'Tableau de bord', icon: <LayoutDashboard className="h-5 w-5" />, end: true },
    { to: '/fournisseur/orders',      label: 'Commandes',       icon: ordersIcon },
    { to: '/fournisseur/marketplace', label: 'Place de marché', icon: <Eye className="h-5 w-5" /> },
    { to: '/fournisseur/produits',    label: 'Produits',        icon: <Package className="h-5 w-5" /> },
    { to: '/fournisseur/produits/new',label: 'Nouveau produit', icon: <Plus className="h-5 w-5" /> },
    { to: '/fournisseur/messages',    label: 'Messages',        icon: messageIcon },
  ];

  const avatar = supplierLogo ? (
    <img
      src={supplierLogo}
      alt="Logo fournisseur"
      className="h-10 w-10 rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
      onError={() => setLogoError(true)}
    />
  ) : (
    <UserCircle2 className="h-10 w-10 text-slate-500 dark:text-slate-300" />
  );

  // Supplier-specific bell replaces the global NotificationBell in the topbar
  const headerExtra = (
    <SupplierNotificationBell
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
    />
  );

  return (
    <>
      <RoleWorkspace
        role="SUPPLIER"
        roleLabel="Fournisseur"
        user={user}
        unreadCount={unreadMessages}
        navItems={navItems}
        footerMeta={user?.supplierProfile?.companyName || 'Fournisseur'}
        avatar={avatar}
        headerExtra={headerExtra}
        onLogout={() => { logout(); navigate('/login', { replace: true }); }}
      />

      <SupplierNewOrderToast
        toasts={orderToasts}
        onDismiss={(id) => setOrderToasts(prev => prev.filter(t => t.id !== id))}
      />
    </>
  );
}

// ── Outer layout — provides the context ──────────────────────────────────────
export default function FournisseurLayout() {
  return (
    <SupplierOrderProvider>
      <FournisseurLayoutInner />
    </SupplierOrderProvider>
  );
}
