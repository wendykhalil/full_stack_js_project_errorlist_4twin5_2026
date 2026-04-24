import React, { useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, MapPin, Loader2, Mic, MicOff } from "lucide-react";
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
function SidebarLink({ item, collapsed, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
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
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return null;
  return <div className="mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-blue-200">{children}</div>;
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

  // ── Sidebar voice navigation ──────────────────────────────────────────────
  const [isSidebarVoiceListening, setIsSidebarVoiceListening] = useState(false);
  const [sidebarVoiceFeedback, setSidebarVoiceFeedback] = useState('');
  const sidebarVoiceRef = useRef(null);
  const sidebarVoiceTimerRef = useRef(null);

  const showSidebarFeedback = (msg) => {
    setSidebarVoiceFeedback(msg);
    clearTimeout(sidebarVoiceTimerRef.current);
    sidebarVoiceTimerRef.current = setTimeout(() => setSidebarVoiceFeedback(''), 3500);
  };

  // Normalize: lowercase, strip accents, strip punctuation
  const normalizeVoice = (str) =>
    String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

  const findNavItemByVoice = (text) => {
    const q = normalizeVoice(text);
    if (!q) return null;
    const qWords = q.split(/\s+/).filter(Boolean);
    const allItems = [
      ...navItems,
      ...collapsibleItems.flatMap((c) => c.items || []),
    ];

    let best = null;
    let bestScore = 0;

    for (const page of allItems) {
      if (!page.to) continue;
      const labelNorm = normalizeVoice(page.label || '');
      const keywords = (page.keywords || []).map(normalizeVoice);
      const routeNorm = normalizeVoice(page.to || '');

      let score = 0;
      if (labelNorm === q) { score = 100; }
      else if (labelNorm.includes(q) || q.includes(labelNorm)) { score = 80; }
      else if (qWords.every(w => labelNorm.includes(w))) { score = 70; }
      else if (qWords.some(w => labelNorm.includes(w) && w.length > 2)) { score = 50; }
      else if (keywords.some(kw => kw === q || q === kw)) { score = 75; }
      else if (keywords.some(kw => kw.includes(q) || q.includes(kw))) { score = 60; }
      else if (keywords.some(kw => qWords.some(w => kw.includes(w) && w.length > 2))) { score = 40; }
      else if (routeNorm.includes(q) || qWords.some(w => routeNorm.includes(w) && w.length > 3)) { score = 30; }

      if (score > bestScore) { bestScore = score; best = page; }
    }

    return bestScore >= 30 ? best : null;
  };

  const toggleSidebarVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showSidebarFeedback("Non supporté par ce navigateur");
      return;
    }

    if (isSidebarVoiceListening) {
      sidebarVoiceRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsSidebarVoiceListening(true);
    recognition.onend = () => setIsSidebarVoiceListening(false);
    recognition.onerror = () => {
      setIsSidebarVoiceListening(false);
      showSidebarFeedback("Erreur micro");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (!transcript) return;
      const page = findNavItemByVoice(transcript);
      if (page) {
        showSidebarFeedback(`→ ${page.label}`);
        setTimeout(() => {
          navigate(page.to);
          closeMobileMenu();
        }, 500);
      } else {
        showSidebarFeedback(`"${transcript}" introuvable`);
      }
    };
    sidebarVoiceRef.current = recognition;
    recognition.start();
  };
  // ─────────────────────────────────────────────────────────────────────────

  const getRoleBasePath = (userRole) => {
    switch (userRole?.toLowerCase()) {
      case 'admin':
        return '/admin';
      case 'artisan':
        return '/artisan';
      case 'prescripteur':
        return '/prescripteur';
      case 'supplier':
        return '/fournisseur';
      default:
        return '/';
    }
  };

  const handleAutoDetectLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      const locationData = await getCurrentPositionWithAddress();
      await updateLocationOnServer(locationData.latitude, locationData.longitude, token, role);
      
      // Store location data for profile pages to use
      storeLocationUpdate(locationData);
      
      showNotification('Votre position a été mise à jour avec succès !', 'success');
    } catch (error) {
      console.error('Error updating location:', error);
      showNotification(error.message || 'Erreur lors de la mise à jour de la position', 'error');
      // Still navigate to profile on error so user can manually update
      setTimeout(() => navigate(`${getRoleBasePath(role)}/profile`), 1500);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const mainItems = useMemo(() => navItems.slice(0, 6), [navItems]);
  const extraItems = useMemo(() => navItems.slice(6), [navItems]);

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className={`flex h-16 items-center border-b border-blue-700/50 ${isSidebarCollapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="BMP.tn" className="h-10 w-10 rounded-2xl bg-white p-1 shadow-sm" />
          {!isSidebarCollapsed ? (
            <div>
              <div className="text-base font-bold text-white">BMP.tn</div>
              <div className="text-[10px] font-medium text-blue-100">{roleLabel}</div>
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
        <div className="mt-4">
          <NavLink
            to={"/chat"}
            onClick={closeMobileMenu}
            title={isSidebarCollapsed ? "Assistant IA" : undefined}
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
      <div className="border-t border-blue-700/50 p-3">
        {/* Voice Navigation Button */}
        <div className="relative mb-1">
          <button
            type="button"
            onClick={toggleSidebarVoice}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 w-full ${
              isSidebarVoiceListening
                ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            } ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title={isSidebarVoiceListening ? "Arrêter la navigation vocale" : "Navigation vocale — dites le nom d'une page"}
            aria-label={isSidebarVoiceListening ? "Arrêter la navigation vocale" : "Navigation vocale"}
          >
            {isSidebarVoiceListening ? (
              <>
                <span className="relative flex-shrink-0">
                  <MicOff className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                  </span>
                </span>
                {!isSidebarCollapsed ? <span className="truncate">Écoute...</span> : null}
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 flex-shrink-0" />
                {!isSidebarCollapsed ? <span className="truncate">Navigation vocale</span> : null}
              </>
            )}
          </button>
          {sidebarVoiceFeedback && !isSidebarCollapsed && (
            <div className="mx-3 mb-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-blue-100">
              {sidebarVoiceFeedback}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-blue-200 transition-all duration-200 hover:bg-white/10 hover:text-white w-full ${isSidebarCollapsed ? "justify-center" : ""}`}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-blue-800/30 bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 shadow-xl transition-all duration-300 xl:flex xl:flex-col ${
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
        <header className="sticky top-0 z-20 border-b border-blue-800/30 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 backdrop-blur-md xl:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="BMP.tn" className="h-9 w-9 rounded-2xl bg-white p-1 shadow-sm" />
              <div>
                <div className="text-sm font-bold text-white">BMP.tn</div>
                <div className="text-[10px] font-medium text-blue-100">{roleLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(`${getRoleBasePath(role)}/messages`)}
                className="relative rounded-full p-2 text-blue-200 hover:bg-white/10"
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
                className="relative rounded-full p-2 text-blue-200 hover:bg-white/10 disabled:opacity-50"
                title={isUpdatingLocation ? "Mise à jour de la position..." : "Localisation rapide"}
              >
                {isUpdatingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </button>
              <button className="rounded-full p-2 text-blue-200 hover:bg-white/10">
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="rounded-md p-2 text-blue-200 hover:bg-white/10"
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
            className={`absolute inset-0 bg-slate-950/45 transition-opacity ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeMobileMenu}
          />
          <div className={`absolute left-0 top-0 h-full w-[84%] max-w-[300px] bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800 shadow-2xl transition-transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
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