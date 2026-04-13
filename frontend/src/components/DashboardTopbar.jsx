import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import NotificationBell from "./NotificationBell";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const ROLE_CONFIG = {
  ADMIN: {
    home: "/admin",
    roleLabel: "Admin",
    pages: [
      { to: "/admin", label: "Dashboard", keywords: ["home", "overview", "tableau de bord"] },
      { to: "/admin/profile", label: "Profile", keywords: ["settings", "account", "password"] },
      {  to: "/chat",label: "AI Assistant",icon: "🤖",},
      { to: "/admin/users", label: "Users", keywords: ["team", "members", "utilisateurs"] },
      { to: "/admin/activity", label: "Activity", keywords: ["logs", "journal", "history"] },
      { to: "/admin/transactions", label: "Transactions", keywords: ["payments", "billing"] },
    ],
  },
  ARTISAN: {
    home: "/artisan",
    roleLabel: "Artisan",
    pages: [
      { to: "/artisan", label: "Dashboard", keywords: ["home", "overview", "tableau de bord"] },
      {  to: "/chat",label: "AI Assistant",icon: "🤖",},

      { to: "/artisan/profile", label: "Profile", keywords: ["account", "settings", "reset password", "profil"] },
      { to: "/artisan/projects", label: "Projects", keywords: ["chantier", "project list", "projets"] },
      { to: "/artisan/portfolio", label: "Portfolio", keywords: ["gallery", "images", "travaux"] },
      { to: "/artisan/devis/create", label: "Quotes", keywords: ["devis", "quote", "estimate"] },
      { to: "/artisan/factures", label: "Invoices", keywords: ["invoice", "factures", "billing"] },
      { to: "/artisan/orders", label: "Orders", keywords: ["commandes", "purchases"] },
      { to: "/artisan/messages", label: "Messages", keywords: ["chat", "conversation", "inbox"] },
      { to: "/artisan/marketplace", label: "Marketplace", keywords: ["products", "catalog"] },
      { to: "/artisan/subscription", label: "Subscription", keywords: ["plan", "abonnement", "pro"] },
    ],
  },
  PRESCRIPTEUR: {
    home: "/prescripteur",
    roleLabel: "Prescripteur",
    pages: [
      { to: "/prescripteur", label: "Products", keywords: ["catalog", "produits"] },
            {  to: "/chat",label: "AI Assistant",icon: "🤖",},

      { to: "/prescripteur/profile", label: "Profile", keywords: ["account", "settings", "password"] },
      { to: "/prescripteur/artisans", label: "Artisans", keywords: ["workers", "providers"] },
      { to: "/prescripteur/projects", label: "Projects", keywords: ["projets", "sites"] },
      { to: "/prescripteur/search", label: "Search", keywords: ["find", "rechercher"] },
      { to: "/prescripteur/messages", label: "Messages", keywords: ["chat", "inbox"] },
    ],
  },
  SUPPLIER: {
    home: "/fournisseur/produits",
    roleLabel: "Fournisseur",
    pages: [
      { to: "/fournisseur/profile", label: "Profile", keywords: ["account", "settings", "password"] },
            {  to: "/chat",label: "AI Assistant",icon: "🤖",},

      { to: "/fournisseur/orders", label: "Orders", keywords: ["commandes", "sales"] },
      { to: "/fournisseur/marketplace", label: "Marketplace", keywords: ["catalog", "products"] },
      { to: "/fournisseur/produits", label: "Products", keywords: ["items", "inventory"] },
      { to: "/fournisseur/produits/new", label: "New product", keywords: ["create product", "add product"] },
      { to: "/fournisseur/messages", label: "Messages", keywords: ["chat", "inbox"] },
    ],
  },
};

function resolveAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function initialsFromUser(user) {
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((value) => value.trim()[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "BM";
}

export default function DashboardTopbar({ role = "ARTISAN", unreadCount = 0 }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [avatarUrl, setAvatarUrl] = useState("");
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.ARTISAN;

  useEffect(() => {
    setQuery("");
    setIsFocused(false);
  }, [pathname]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false
    const directAvatar = resolveAssetUrl(
      user?.profilePicture ||
      user?.supplierProfile?.logo ||
      user?.artisanProfile?.profileImage ||
      "",
    );

    if (role !== "ARTISAN" || !token) {
      setAvatarUrl(directAvatar);
      return;
    }

    async function loadArtisanAvatar() {
      try {
        const data = await apiFetch("/artisan/profile/my-profile", { token });
        const artisanProfile = data?.data || data?.profile || data || {};
        const nextAvatar = resolveAssetUrl(
          artisanProfile?.profileImage ||
          artisanProfile?.image ||
          user?.profilePicture ||
          "",
        );
        if (!cancelled) {
          setAvatarUrl(nextAvatar);
        }
      } catch {
        if (!cancelled) {
          setAvatarUrl(directAvatar);
        }
      }
    }

    loadArtisanAvatar();
    return () => {
      cancelled = true;
    };
  }, [role, token, user?.profilePicture, user?.supplierProfile?.logo, user?.artisanProfile?.profileImage]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return (config.pages || [])
      .filter((item) => {
        const haystack = [item.label, item.to, ...(item.keywords || [])].join(" ").toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 8);
  }, [config.pages, query]);

  const submitQuickJump = (event) => {
    event.preventDefault();
    if (!results.length) return;
    navigate(results[0].to);
    setQuery("");
    setIsFocused(false);
  };

  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-[180px] text-sm font-medium text-slate-600 dark:text-slate-300">
        {new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(now)}
      </div>

      <div className="relative flex flex-1 justify-center px-2">
        <form onSubmit={submitQuickJump} className="w-full max-w-lg">
          <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 220)}
              placeholder="Search pages, projects, quotes, invoices..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
          </label>
        </form>

        {isFocused && query.trim() && results.length ? (
          <div className="absolute top-[calc(100%+8px)] z-30 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {results.map((item) => (
              <button
                key={item.to}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  navigate(item.to);
                  setQuery("");
                  setIsFocused(false);
                }}
                onClick={() => {
                  navigate(item.to);
                  setQuery("");
                  setIsFocused(false);
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
                <span className="text-xs text-slate-400">{item.to}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 md:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {config.roleLabel}
        </span>
        <NotificationBell />

        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
              {initialsFromUser(user)}
            </div>
          )}
          {user?.firstName || user?.lastName ? (
            <span className="ml-2 font-bold text-blue-900 dark:text-blue-200 text-base">
              {user?.firstName} {user?.lastName}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
