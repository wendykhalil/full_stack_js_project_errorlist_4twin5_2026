import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CircleUserRound,
  FileText,
  FolderKanban,
  Home,
  MessageCircle,
  Package,
  PackagePlus,
  Search,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

const ROLE_CONFIG = {
  ADMIN: {
    home: "/admin",
    profile: "/admin/profile",
    messages: "",
    roleLabel: "Admin",
    quickAction: { to: "/admin/users", label: "Gerer les utilisateurs", icon: Users },
    pages: [
      { to: "/admin", label: "Tableau de bord" },
      { to: "/admin/profile", label: "Profil" },
      { to: "/admin/users", label: "Utilisateurs" },
      { to: "/admin/activity", label: "Journal d'activite" },
      { to: "/admin/transactions", label: "Transactions" },
    ],
  },
  ARTISAN: {
    home: "/artisan",
    profile: "/artisan/profile",
    messages: "/artisan/messages",
    roleLabel: "Artisan",
    quickAction: { to: "/artisan/devis/create", label: "Creer un devis", icon: FileText },
    pages: [
      { to: "/artisan", label: "Tableau de bord" },
      { to: "/artisan/profile", label: "Profil" },
      { to: "/artisan/projects", label: "Projets" },
      { to: "/artisan/portfolio", label: "Portfolio" },
      { to: "/artisan/devis/create", label: "Creer un devis" },
      { to: "/artisan/factures", label: "Factures" },
      { to: "/artisan/orders", label: "Commandes" },
      { to: "/artisan/messages", label: "Messages" },
      { to: "/artisan/marketplace", label: "Marketplace" },
    ],
  },
  PRESCRIPTEUR: {
    home: "/prescripteur",
    profile: "/prescripteur/profile",
    messages: "/prescripteur/messages",
    roleLabel: "Prescripteur",
    quickAction: { to: "/prescripteur/search", label: "Recherche rapide", icon: Search },
    pages: [
      { to: "/prescripteur", label: "Produits" },
      { to: "/prescripteur/profile", label: "Profil" },
      { to: "/prescripteur/artisans", label: "Artisans" },
      { to: "/prescripteur/projects", label: "Projets" },
      { to: "/prescripteur/search", label: "Recherche" },
      { to: "/prescripteur/messages", label: "Messages" },
    ],
  },
  SUPPLIER: {
    home: "/fournisseur/produits",
    profile: "/fournisseur/profile",
    messages: "/fournisseur/messages",
    roleLabel: "Fournisseur",
    quickAction: { to: "/fournisseur/produits/new", label: "Nouveau produit", icon: PackagePlus },
    pages: [
      { to: "/fournisseur/profile", label: "Profil" },
      { to: "/fournisseur/orders", label: "Commandes" },
      { to: "/fournisseur/produits", label: "Produits" },
      { to: "/fournisseur/produits/new", label: "Nouveau produit" },
      { to: "/fournisseur/messages", label: "Messages" },
    ],
  },
};

function getPageTitle(pathname, role) {
  const dynamicMatchers = [
    ["/artisan/messages/", "Conversation"],
    ["/prescripteur/messages/", "Conversation"],
    ["/fournisseur/messages/", "Conversation"],
    ["/artisan/orders/", "Detail commande"],
    ["/fournisseur/orders/", "Detail commande"],
    ["/artisan/product/", "Detail produit"],
    ["/prescripteur/artisan/", "Profil artisan"],
    ["/artisan/portfolio/edit/", "Modifier portfolio"],
  ];

  for (const [prefix, title] of dynamicMatchers) {
    if (pathname.startsWith(prefix)) return title;
  }

  const exact = {
    "/admin": "Tableau de bord",
    "/admin/profile": "Profil",
    "/admin/users": "Utilisateurs",
    "/admin/activity": "Journal d'activite",
    "/admin/transactions": "Transactions",
    "/artisan": "Tableau de bord",
    "/artisan/profile": "Profil",
    "/artisan/profile/edit": "Modifier le profil",
    "/artisan/projects": "Projets",
    "/artisan/portfolio": "Portfolio",
    "/artisan/portfolio/add": "Ajouter au portfolio",
    "/artisan/devis/create": "Creer un devis",
    "/artisan/factures": "Factures",
    "/artisan/factures/new": "Nouvelle facture",
    "/artisan/factures/new/step-2": "Nouvelle facture",
    "/artisan/factures/new/step-3": "Nouvelle facture",
    "/artisan/marketplace": "Marketplace",
    "/artisan/orders": "Commandes",
    "/artisan/messages": "Messages",
    "/prescripteur": "Produits",
    "/prescripteur/profile": "Profil",
    "/prescripteur/artisans": "Artisans",
    "/prescripteur/projects": "Projets",
    "/prescripteur/search": "Recherche",
    "/prescripteur/messages": "Messages",
    "/fournisseur/profile": "Profil",
    "/fournisseur/orders": "Commandes",
    "/fournisseur/produits": "Produits",
    "/fournisseur/produits/new": "Nouveau produit",
    "/fournisseur/messages": "Messages",
  };

  return exact[pathname] || ROLE_CONFIG[role]?.roleLabel || "Espace";
}

function formatToday() {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString();
  }
}

function initialsFromUser(user, fallback) {
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((value) => value.trim()[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || fallback.slice(0, 2).toUpperCase();
}

export default function DashboardTopbar({ role = "ARTISAN", unreadCount = 0 }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.ARTISAN;
  const title = getPageTitle(pathname, role);
  const QuickActionIcon = config.quickAction.icon;
  const searchOptions = useMemo(() => config.pages, [config.pages]);

  useEffect(() => {
    setQuery("");
  }, [pathname]);

  const submitQuickJump = (event) => {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;

    const exactMatch = searchOptions.find(
      (item) => item.label.toLowerCase() === normalized || item.to.toLowerCase() === normalized,
    );
    const partialMatch = searchOptions.find(
      (item) => item.label.toLowerCase().includes(normalized) || item.to.toLowerCase().includes(normalized),
    );

    const target = exactMatch || partialMatch;
    if (target) {
      navigate(target.to);
      setQuery("");
    }
  };

  return (
    <div className="flex h-[76px] items-center gap-4 overflow-hidden rounded-[26px] border border-slate-200 bg-white/95 px-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to={config.home}
          className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
          aria-label="Accueil"
        >
          <Home className="h-5 w-5" />
        </Link>

        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {config.roleLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatToday()}
          </span>
        </div>
      </div>

      <form onSubmit={submitQuickJump} className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
        <label className="group flex w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:focus-within:border-blue-700">
          <Search className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-focus-within:text-blue-600" />
          <input
            list={`dashboard-pages-${role}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Aller a une page..."
            className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <span className="hidden rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 2xl:inline dark:bg-slate-700 dark:text-slate-300">
            Jump
          </span>
        </label>
        <datalist id={`dashboard-pages-${role}`}>
          {searchOptions.map((item) => (
            <option key={item.to} value={item.label} />
          ))}
        </datalist>
      </form>

      <div className="ml-auto flex flex-shrink-0 items-center gap-2">
        <Link
          to={config.quickAction.to}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <QuickActionIcon className="h-4 w-4" />
          <span className="hidden 2xl:inline">{config.quickAction.label}</span>
          <Sparkles className="hidden h-4 w-4 2xl:inline" />
        </Link>

        {config.messages ? (
          <Link
            to={config.messages}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-200"
            aria-label="Messages"
          >
            <MessageCircle className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-[1rem] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        ) : null}

        <div className="inline-flex h-11 items-center gap-1 rounded-2xl border border-slate-200 px-2 dark:border-slate-700">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <Link
          to={config.profile}
          className="inline-flex h-11 items-center gap-3 rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-100 dark:hover:border-blue-700 dark:hover:bg-blue-900/30"
        >
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="" className="h-8 w-8 rounded-xl object-cover" />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
              {initialsFromUser(user, config.roleLabel)}
            </span>
          )}
          <span className="hidden 2xl:flex 2xl:items-center 2xl:gap-2">
            <CircleUserRound className="h-4 w-4" />
            Mon profil
          </span>
        </Link>
      </div>
    </div>
  );
}
