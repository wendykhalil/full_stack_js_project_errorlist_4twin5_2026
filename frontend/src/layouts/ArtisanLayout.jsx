import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, FolderKanban, Image as ImageIcon, LayoutDashboard,
  MessageCircle, Package, Receipt, ShieldCheck, ShoppingCart,
  UserCircle2, Cloud, ClipboardList, CalendarDays,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getMySubscription } from "../auth/api";
import RoleWorkspace from "../components/RoleWorkspace";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function resolveAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function ArtisanLayout() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [subscription, setSubscription] = useState({ plan: "FREE", status: "INACTIVE" });
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const unreadCount = useUnreadMessages();

  useEffect(() => {
    const loadSubscription = async () => {
      if (!token) {
        setCheckingSubscription(false);
        return;
      }
      try {
        const res = await getMySubscription({ token });
        setSubscription(res?.data || { plan: "FREE", status: "INACTIVE" });
      } catch (err) {
        console.error("Erreur récupération abonnement:", err);
        setSubscription({ plan: "FREE", status: "INACTIVE" });
      } finally {
        setCheckingSubscription(false);
      }
    };
    loadSubscription();
  }, [token]);

  if (checkingSubscription) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef3fb] dark:bg-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Chargement des droits d'abonnement...
        </div>
      </div>
    );
  }

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
    { to: "/artisan/profile", label: "Profil", icon: <UserCircle2 className="h-5 w-5" /> },
    { to: "/artisan/marketplace", label: "Marketplace", icon: <ShoppingCart className="h-5 w-5" /> },
    { to: "/artisan/subscription", label: "Abonnement", icon: <ShieldCheck className="h-5 w-5" /> },
    { to: "/artisan", label: "Tableau de bord", icon: <LayoutDashboard className="h-5 w-5" />, end: true },
    { to: "/artisan/projects", label: "Projets", icon: <FolderKanban className="h-5 w-5" /> },
    { to: "/artisan/portfolio", label: "Portfolio", icon: <ImageIcon className="h-5 w-5" /> },
    { to: "/artisan/devis/create", label: "Creer un devis", icon: <FileText className="h-5 w-5" /> },
    { to: "/artisan/factures", label: "Factures", icon: <Receipt className="h-5 w-5" /> },
    { to: "/artisan/weather", label:"Météo", icon:<Cloud className="h-5 w-5" />},
    { to: "/artisan/availability", label: "Disponibilités", icon: <CalendarDays className="h-5 w-5" /> },
    { to: "/artisan/service-requests", label: "Missions", icon: <ClipboardList className="h-5 w-5" /> },
    { to: "/artisan/orders", label: "Mes commandes", icon: <Package className="h-5 w-5" /> },
    { to: "/artisan/messages", label: "Messages", icon: messageIcon },
  ];

  const artisanAvatarUrl = resolveAssetUrl(user?.profilePicture || "");

  const avatar = artisanAvatarUrl ? (
    <img
      src={artisanAvatarUrl}
      alt=""
      className="h-10 w-10 rounded-2xl object-cover"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <UserCircle2 className="h-10 w-10 text-slate-500 dark:text-slate-300" />
  );

  const footerMeta = "Artisan";

  const settingsItems = [
    { to: "/artisan/profile", label: "Profile", icon: <UserCircle2 className="h-4 w-4" /> },
    { to: "/artisan/profile", label: "Reset password", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <RoleWorkspace
      role="ARTISAN"
      roleLabel="Artisan"
      user={user}
      unreadCount={unreadCount}
      navItems={navItems}
      footerMeta={footerMeta}
      avatar={avatar}
      settingsItems={settingsItems}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    />
  );
}
