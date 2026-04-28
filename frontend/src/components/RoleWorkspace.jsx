import React, { useMemo, useState } from "react";
import { Bot, MessageCircle, MapPin, Loader2 } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import DashboardTopbar from "./DashboardTopbar";
import CollapsibleNavItem from "./CollapsibleNavItem";
import logo from "../assets/bmp-logo.svg";
import { useAuth } from "../auth/AuthContext";
import { useNotification } from "../hooks/useNotification";
import { getCurrentPositionWithAddress, updateLocationOnServer } from "../utils/geolocation";
import { storeLocationUpdate } from "../services/profileService";
import Notification from "./Notification";

// ── Page descriptions shown on hover ─────────────────────────────────────────
const PAGE_DESCRIPTIONS = {
  // Admin
  "/admin":                   "Vue globale de la plateforme : stats, alertes et activité récente",
  "/admin/artisans":          "Tableau de bord dédié aux artisans inscrits",
  "/admin/users":             "Gérer tous les comptes utilisateurs, bloquer ou débloquer",
  "/admin/fraud-analytics":   "Détection de fraude et analyses de sécurité",
  "/admin/activity":          "Journal complet des actions effectuées sur la plateforme",
  "/admin/transactions":      "Historique et suivi de toutes les transactions financières",
  "/admin/promo-codes":       "Créer et gérer les codes promotionnels",
  "/admin/reports":           "Traiter les signalements soumis par les utilisateurs",
  "/admin/disputes":          "Gérer les litiges entre acheteurs et vendeurs",
  "/admin/ai-insights":       "Analyses et recommandations générées par l'IA",
  // Artisan
  "/artisan":                 "Résumé de votre activité : projets, devis et commandes",
  "/artisan/subscription":    "Gérer votre abonnement et accéder aux fonctionnalités Pro",
  "/artisan/portfolio":       "Présenter vos réalisations et photos de chantier",
  "/artisan/weather":         "Météo locale pour planifier vos chantiers",
  "/artisan/availability":    "Définir vos créneaux de disponibilité",
  "/artisan/service-requests":"Consulter et postuler aux missions disponibles",
  "/artisan/disputes":        "Suivre et résoudre vos litiges en cours",
  "/artisan/meetings":        "Planifier et gérer vos réunions clients",
  "/artisan/orders":          "Historique de vos commandes de matériaux",
  "/artisan/messages":        "Messagerie avec vos clients et fournisseurs",
  "/artisan/marketplace":     "Parcourir et commander des produits de construction",
  "/artisan/favorites":       "Vos produits favoris sauvegardés",
  "/artisan/cart":            "Votre panier d'achat en cours",
  "/artisan/projects":        "Gérer tous vos projets et chantiers",
  "/artisan/devis/create":    "Créer un nouveau devis pour un client",
  "/artisan/factures":        "Émettre et suivre vos factures",
  "/artisan/ml-predictions":  "Prédictions IA sur vos projets et revenus",
  "/artisan/profile":         "Modifier votre profil et informations personnelles",
  // Prescripteur
  "/prescripteur":            "Catalogue de produits disponibles",
  "/prescripteur/artisans":   "Trouver et contacter des artisans qualifiés",
  "/prescripteur/projects":   "Suivre l'avancement de vos projets",
  "/prescripteur/service-requests": "Publier et gérer vos demandes de service",
  "/prescripteur/disputes":   "Suivre et résoudre vos litiges",
  "/prescripteur/meetings":   "Planifier des réunions avec vos artisans",
  "/prescripteur/ml-predictions": "Estimations et prédictions IA pour vos projets",
  "/prescripteur/search":     "Rechercher artisans, produits et services",
  "/prescripteur/messages":   "Messagerie avec vos artisans et fournisseurs",
  "/prescripteur/profile":    "Modifier votre profil et informations personnelles",
  // Fournisseur
  "/fournisseur":             "Vue d'ensemble de votre activité fournisseur",
  "/fournisseur/orders":      "Gérer les commandes reçues de vos clients",
  "/fournisseur/marketplace": "Voir comment vos produits apparaissent sur la place de marché",
  "/fournisseur/produits":    "Gérer votre catalogue de produits",
  "/fournisseur/produits/new":"Ajouter un nouveau produit à votre catalogue",
  "/fournisseur/messages":    "Messagerie avec vos clients artisans",
  "/fournisseur/profile":     "Modifier votre profil et informations de l'entreprise",
  // Shared
  "/chat":                    "Discuter avec l'assistant IA pour obtenir de l'aide",
};

// ── Tooltip component ─────────────────────────────────────────────────────────
function SidebarTooltip({ label, description, side = "right" }) {
  return (
    <div
      className={`pointer-events-none absolute z-50 ${
        side === "right" ? "left-full ml-3" : "left-full ml-3"
      } top-1/2 -translate-y-1/2 w-56`}
    >
      {/* Arrow */}
      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 rounded-sm bg-slate-900" />
      <div className="relative rounded-xl bg-slate-900 px-3 py-2.5 shadow-2xl ring-1 ring-white/10">
        <p className="text-[12px] font-semibold text-white leading-tight">{label}</p>
        {description && (
          <p className="mt-1 text-[11px] leading-snug text-slate-300">{description}</p>
        )}
      </div>
    </div>
  );
}

// ── Sidebar nav link with hover tooltip ──────────────────────────────────────
function SidebarLink({ item, collapsed, onClick }) {
  const [hovered, setHovered] = useState(false);
  const description = PAGE_DESCRIPTIONS[item.to] || null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
            isActive
              ? "bg-white/20 text-white shadow-lg"
              : "text-blue-100 hover:bg-white/10 hover:text-white"
          } ${collapsed ? "justify-center px-2" : ""}`
        }
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </NavLink>

      {/* Tooltip: always show on hover when collapsed (replaces title), show description when expanded */}
      {hovered && (collapsed || description) && (
        <SidebarTooltip
          label={item.label}
          description={collapsed ? description : description}
        />
      )}
    </div>
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return null;
      <div className="mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-blue-200 dark:text-slate-400">{children}</div>;
}

export default function RoleWorkspace({
  role,
  roleLabel,
  user,
  unreadCount = 0,
  navItems = [],
  collapsibleItems = [],
  footerMeta,
  avatar,
  onLogout,
  settingsItems = [],
  headerExtra = null,
}) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const getRoleBasePath = (userRole) => {
    switch (userRole?.toLowerCase()) {
      case 'admin':       return '/admin';
      case 'artisan':     return '/artisan';
      case 'prescripteur':return '/prescripteur';
      case 'supplier':    return '/fournisseur';
      default:            return '/';
    }
  };

  const handleAutoDetectLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      const locationData = await getCurrentPositionWithAddress();
      await updateLocationOnServer(locationData.latitude, locationData.longitude, token, role);
      storeLocationUpdate(locationData);
      showNotification('Votre position a été mise à jour avec succès !', 'success');
    } catch (error) {
      console.error('Error updating location:', error);
      showNotification(error.message || 'Erreur lors de la mise à jour de la position', 'error');
      setTimeout(() => navigate(`${getRoleBasePath(role)}/profile`), 1500);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const mainItems = useMemo(() => navItems.slice(0, 6), [navItems]);
  const extraItems = useMemo(() => navItems.slice(6), [navItems]);

  // AI chat tooltip state
  const [chatHovered, setChatHovered] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className={`flex h-16 items-center border-b border-blue-700/50 dark:border-slate-700 ${isSidebarCollapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="BMP.tn" className="h-10 w-10 rounded-2xl bg-white p-1 shadow-sm" />
          {!isSidebarCollapsed ? (
            <div>
              <div className="text-base font-bold text-white">BMP.tn</div>
              <div className="text-xs font-semibold text-blue-200 dark:text-slate-400 tracking-wide">{roleLabel}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <SectionLabel collapsed={isSidebarCollapsed}>Menu Principal</SectionLabel>
        <div className="space-y-1">
          {mainItems.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
          ))}
        </div>

        {/* Collapsible Items */}
        {collapsibleItems.length > 0 && (
          <>
            <SectionLabel collapsed={isSidebarCollapsed}>Gestion</SectionLabel>
            <div className="space-y-1">
              {collapsibleItems.map((collapsibleItem) => (
                <CollapsibleNavItem
                  key={collapsibleItem.title}
                  title={collapsibleItem.title}
                  icon={collapsibleItem.icon}
                  items={collapsibleItem.items}
                  collapsed={isSidebarCollapsed}
                  onClick={closeMobileMenu}
                />
              ))}
            </div>
          </>
        )}

        {extraItems.length ? (
          <>
            <SectionLabel collapsed={isSidebarCollapsed}>Plus</SectionLabel>
            <div className="space-y-1">
              {extraItems.map((item) => (
                <SidebarLink key={item.to} item={item} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
              ))}
            </div>
          </>
        ) : null}

        {/* AI CHAT BUTTON */}
        <div
          className="relative mt-4"
          onMouseEnter={() => setChatHovered(true)}
          onMouseLeave={() => setChatHovered(false)}
        >
          <NavLink
            to={`/${role?.toLowerCase() === 'supplier' ? 'fournisseur' : role?.toLowerCase() === 'prescripteur' ? 'prescripteur' : role?.toLowerCase() === 'admin' ? 'admin' : 'artisan'}/AiChat`}
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/20 text-white shadow-lg"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              } ${isSidebarCollapsed ? "justify-center px-2" : ""}`
            }
          >
            <Bot className="h-4 w-4 flex-shrink-0" />
            {!isSidebarCollapsed ? <span className="truncate">Assistant IA</span> : null}
          </NavLink>
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-blue-700/50 dark:border-slate-700 p-3">
        <button
          type="button"
          onClick={onLogout}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-blue-200 dark:text-slate-300 transition-all duration-200 hover:bg-white/10 dark:hover:bg-slate-700 hover:text-white dark:hover:text-slate-100 w-full ${isSidebarCollapsed ? "justify-center" : ""}`}
          title={isSidebarCollapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isSidebarCollapsed ? <span>Déconnexion</span> : null}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Notification notification={notification} onClose={hideNotification} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-blue-800/30 dark:border-slate-700 bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 shadow-xl transition-all duration-300 xl:flex xl:flex-col ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((value) => !value)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-white text-blue-600 shadow-md transition-all"
          aria-label="Reduire la barre laterale"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "xl:ml-20" : "xl:ml-64"}`}>
        {/* Mobile header */}
        <header className="sticky top-0 z-20 border-b border-blue-800/30 dark:border-slate-700 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 backdrop-blur-md xl:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="BMP.tn" className="h-9 w-9 rounded-2xl bg-white p-1 shadow-sm" />
              <div>
                <div className="text-sm font-bold text-white">BMP.tn</div>
                <div className="text-[10px] font-medium text-blue-100 dark:text-slate-400">{roleLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`${getRoleBasePath(role)}/messages`)}
                className="relative rounded-full p-2 text-blue-200 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-700/50"
                title="Messages"
              >
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleAutoDetectLocation}
                disabled={isUpdatingLocation}
                className="relative rounded-full p-2 text-blue-200 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-700/50 disabled:opacity-50"
                title={isUpdatingLocation ? "Mise à jour de la position..." : "Localisation rapide"}
              >
                {isUpdatingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </button>
              <button className="rounded-full p-2 text-blue-200 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-700/50">
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="rounded-md p-2 text-blue-200 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-700/50"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Desktop top bar */}
        <div className="sticky top-0 z-20 hidden xl:block">
          <DashboardTopbar
            role={role}
            unreadCount={unreadCount}
            onLogout={onLogout}
            headerExtra={headerExtra}
            navItems={navItems}
          />
        </div>

        {/* Mobile menu overlay */}
        <div className={`fixed inset-0 z-40 xl:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-slate-950/45 dark:bg-black/60 transition-opacity ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeMobileMenu}
          />
          <div className={`absolute left-0 top-0 h-full w-[84%] max-w-[300px] bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 shadow-2xl transition-transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            {sidebarContent}
          </div>
        </div>

        {/* Page content */}
        <main className="w-full px-4 py-5 sm:px-5 xl:px-6">
          <Outlet />
        </main>
      </div>
      </div>
    </>
  );
}
