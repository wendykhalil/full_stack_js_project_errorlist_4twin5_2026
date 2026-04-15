import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, LayoutDashboard, MessageCircle, Package, Plus, Shield, ShoppingBag, UserCircle2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import RoleWorkspace from "../components/RoleWorkspace";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

export default function FournisseurLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [logoError, setLogoError] = useState(false);
  const unreadCount = useUnreadMessages();

  const SERVER_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

  const supplierLogo = useMemo(() => {
    if (!logoError && user?.supplierProfile?.logo) {
      return user.supplierProfile.logo.startsWith("http")
        ? user.supplierProfile.logo
        : `${SERVER_URL}${user.supplierProfile.logo}`;
    }
    return null;
  }, [logoError, user, SERVER_URL]);

  const messageIcon = (
    <span className="relative inline-flex">
      <MessageCircle className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 min-w-[1rem] rounded-full bg-red-500 px-1 text-[10px] text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </span>
  );

  const navItems = [
    { to: "/fournisseur", label: "Tableau de bord", icon: <LayoutDashboard className="h-5 w-5" />, end: true },
    { to: "/fournisseur/orders", label: "Commandes", icon: <ShoppingBag className="h-5 w-5" /> },
    { to: "/fournisseur/marketplace", label: "Place de marche", icon: <Eye className="h-5 w-5" /> },
    { to: "/fournisseur/produits", label: "Produits", icon: <Package className="h-5 w-5" /> },
    { to: "/fournisseur/produits/new", label: "Nouveau produit", icon: <Plus className="h-5 w-5" /> },
    { to: "/fournisseur/messages", label: "Messages", icon: messageIcon },
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

  return (
    <RoleWorkspace
      role="SUPPLIER"
      roleLabel="Fournisseur"
      user={user}
      unreadCount={unreadCount}
      navItems={navItems}
      footerMeta={user?.supplierProfile?.companyName || "Fournisseur"}
      avatar={avatar}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    />
  );
}
