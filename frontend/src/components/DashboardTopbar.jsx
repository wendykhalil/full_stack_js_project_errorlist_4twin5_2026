import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, User, Settings, LogOut, Accessibility, MessageCircle, MapPin, Loader2, Mic, MicOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import NotificationBell from "./NotificationBell";
import { useNotification } from "../hooks/useNotification";
import { getCurrentPositionWithAddress, updateLocationOnServer } from "../utils/geolocation";
import { storeLocationUpdate } from "../services/profileService";
import Notification from "./Notification";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const ROLE_CONFIG = {
  ADMIN: {
    home: "/admin",
    roleLabel: "Admin",
    pages: [
      { to: "/admin", label: "Tableau de bord", keywords: ["home", "overview", "tableau de bord"] },
      { to: "/admin/profile", label: "Profil", keywords: ["settings", "account", "password", "profil"] },
      {  to: "/chat",label: "Assistant IA",icon: "🤖",},
      { to: "/admin/users", label: "Utilisateurs", keywords: ["team", "members", "utilisateurs"] },
      { to: "/admin/activity", label: "Activite", keywords: ["logs", "journal", "history", "activite"] },
      { to: "/admin/transactions", label: "Transactions", keywords: ["payments", "billing", "paiements"] },
    ],
  },
  ARTISAN: {
    home: "/artisan",
    roleLabel: "Artisan",
    pages: [
      { to: "/artisan", label: "Tableau de bord", keywords: ["home", "overview", "tableau de bord"] },
      {  to: "/chat",label: "Assistant IA",icon: "🤖",},

      { to: "/artisan/profile", label: "Profil", keywords: ["account", "settings", "reset password", "profil"] },
      { to: "/artisan/projects", label: "Projets", keywords: ["chantier", "project list", "projets"] },
      { to: "/artisan/portfolio", label: "Portfolio", keywords: ["gallery", "images", "travaux"] },
      { to: "/artisan/devis/create", label: "Devis", keywords: ["devis", "quote", "estimate"] },
      { to: "/artisan/factures", label: "Factures", keywords: ["invoice", "factures", "billing"] },
      { to: "/artisan/orders", label: "Commandes", keywords: ["commandes", "purchases"] },
      { to: "/artisan/messages", label: "Messages", keywords: ["chat", "conversation", "inbox"] },
      { to: "/artisan/marketplace", label: "Place de marche", keywords: ["products", "catalog", "marketplace"] },
      { to: "/artisan/subscription", label: "Abonnement", keywords: ["plan", "abonnement", "pro"] },
    ],
  },
  PRESCRIPTEUR: {
    home: "/prescripteur",
    roleLabel: "Prescripteur",
    pages: [
      { to: "/prescripteur", label: "Produits", keywords: ["catalog", "produits"] },
            {  to: "/chat",label: "Assistant IA",icon: "🤖",},

      { to: "/prescripteur/profile", label: "Profil", keywords: ["account", "settings", "password", "profil"] },
      { to: "/prescripteur/artisans", label: "Artisans", keywords: ["workers", "providers"] },
      { to: "/prescripteur/projects", label: "Projets", keywords: ["projets", "sites"] },
      { to: "/prescripteur/search", label: "Recherche", keywords: ["find", "rechercher"] },
      { to: "/prescripteur/messages", label: "Messages", keywords: ["chat", "inbox"] },
    ],
  },
  SUPPLIER: {
    home: "/fournisseur/produits",
    roleLabel: "Fournisseur",
    pages: [
      { to: "/fournisseur/profile", label: "Profil", keywords: ["account", "settings", "password", "profil"] },
            {  to: "/chat",label: "Assistant IA",icon: "🤖",},

      { to: "/fournisseur/orders", label: "Commandes", keywords: ["commandes", "sales"] },
      { to: "/fournisseur/marketplace", label: "Place de marche", keywords: ["catalog", "products", "marketplace"] },
      { to: "/fournisseur/produits", label: "Produits", keywords: ["items", "inventory"] },
      { to: "/fournisseur/produits/new", label: "Nouveau produit", keywords: ["create product", "add product", "nouveau produit"] },
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

export default function DashboardTopbar({ role = "ARTISAN", unreadCount = 0, onLogout, headerExtra = null, navItems: propNavItems = [] }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.ARTISAN;

  // ── Voice navigation ──────────────────────────────────────────────────────
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const voiceRecognitionRef = useRef(null);
  const voiceFeedbackTimerRef = useRef(null);

  // All navigable pages: merge sidebar navItems (from layout) + ROLE_CONFIG fallback
  const allVoicePages = useMemo(() => {
    const configPages = config.pages || [];
    if (propNavItems.length > 0) {
      // Build a merged list: sidebar navItems + any extra from ROLE_CONFIG not already covered
      const sidebarRoutes = new Set(propNavItems.map(p => p.to));
      const extras = configPages.filter(p => !sidebarRoutes.has(p.to));
      return [...propNavItems, ...extras];
    }
    return configPages;
  }, [propNavItems, config.pages]);

  const showVoiceFeedback = (msg) => {
    setVoiceFeedback(msg);
    clearTimeout(voiceFeedbackTimerRef.current);
    voiceFeedbackTimerRef.current = setTimeout(() => setVoiceFeedback(''), 3500);
  };

  // Normalize: lowercase, remove accents, remove punctuation
  const normalize = (str) =>
    String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

  const findPageByVoice = (text) => {
    const q = normalize(text);
    if (!q) return null;
    const qWords = q.split(/\s+/).filter(Boolean);

    let best = null;
    let bestScore = 0;

    for (const page of allVoicePages) {
      if (!page.to) continue;
      const labelNorm = normalize(page.label || '');
      const keywords = (page.keywords || []).map(normalize);
      const routeNorm = normalize(page.to || '');

      let score = 0;

      // Exact label match
      if (labelNorm === q) { score = 100; }
      // Label contains query or query contains label
      else if (labelNorm.includes(q) || q.includes(labelNorm)) { score = 80; }
      // All query words appear in label
      else if (qWords.every(w => labelNorm.includes(w))) { score = 70; }
      // Any query word matches label word
      else if (qWords.some(w => labelNorm.includes(w) && w.length > 2)) { score = 50; }
      // Keyword exact match
      else if (keywords.some(kw => kw === q || q === kw)) { score = 75; }
      // Keyword contains query or vice versa
      else if (keywords.some(kw => kw.includes(q) || q.includes(kw))) { score = 60; }
      // Any query word in any keyword
      else if (keywords.some(kw => qWords.some(w => kw.includes(w) && w.length > 2))) { score = 40; }
      // Route segment match
      else if (routeNorm.includes(q) || qWords.some(w => routeNorm.includes(w) && w.length > 3)) { score = 30; }

      if (score > bestScore) {
        bestScore = score;
        best = page;
      }
    }

    return bestScore >= 30 ? best : null;
  };

  const handleVoiceResult = (transcript) => {
    const page = findPageByVoice(transcript);
    if (page) {
      showVoiceFeedback(`→ ${page.label}`);
      setTimeout(() => navigate(page.to), 600);
    } else {
      showVoiceFeedback(`"${transcript}" — page introuvable`);
    }
  };

  const toggleVoiceListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showVoiceFeedback("Reconnaissance vocale non supportée");
      return;
    }

    if (isVoiceListening) {
      voiceRecognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsVoiceListening(true);
    recognition.onend = () => setIsVoiceListening(false);
    recognition.onerror = () => {
      setIsVoiceListening(false);
      showVoiceFeedback("Erreur micro — réessayez");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) handleVoiceResult(transcript);
    };

    voiceRecognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    return () => {
      voiceRecognitionRef.current?.stop();
      clearTimeout(voiceFeedbackTimerRef.current);
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

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

  return (
    <>
      <Notification notification={notification} onClose={hideNotification} />
      <div className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-[180px] text-sm font-medium text-slate-600 dark:text-slate-300">
        {new Intl.DateTimeFormat("fr-FR", {
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
              placeholder="Rechercher pages, projets, devis, factures..."
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
        {/* Voice Navigation Button */}
        <div className="relative">
          <button
            onClick={toggleVoiceListening}
            className={`relative rounded-lg p-2 transition-colors ${
              isVoiceListening
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'hover:bg-slate-50 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300'
            }`}
            title={isVoiceListening ? "Arrêter la navigation vocale" : "Navigation vocale — dites le nom d'une page"}
            aria-label={isVoiceListening ? "Arrêter la navigation vocale" : "Démarrer la navigation vocale"}
          >
            {isVoiceListening ? (
              <>
                <MicOff className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              </>
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
          {voiceFeedback && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {voiceFeedback}
            </div>
          )}
        </div>

        {/* Show the supplier-specific bell when headerExtra is provided, otherwise show the global bell */}
        {headerExtra ? headerExtra : <NotificationBell />}
        
        {/* Messages Icon */}
        <button
          onClick={() => navigate(`${getRoleBasePath(role)}/messages`)}
          className="relative rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Messages"
        >
          <MessageCircle className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Live Map Icon */}
        <button
          onClick={handleAutoDetectLocation}
          disabled={isUpdatingLocation}
          className="relative rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          title={isUpdatingLocation ? "Mise à jour de la position..." : "Localisation rapide"}
        >
          {isUpdatingLocation ? (
            <Loader2 className="h-5 w-5 text-slate-600 dark:text-slate-300 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          >
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
                <span className="font-bold text-blue-900 dark:text-blue-200 text-base">
                  {user?.firstName} {user?.lastName}
                </span>
              ) : null}
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {userDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden dark:border-slate-700 dark:bg-slate-800">
                <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                    {user?.email}
                  </p>
                </div>
                
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate(`${getRoleBasePath(role)}/profile`);
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    <span>Profil</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate(`${getRoleBasePath(role)}/profile`);
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>Réinitialiser le mot de passe</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate(`${getRoleBasePath(role)}/accessibility`);
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Accessibility className="h-4 w-4 text-slate-500" />
                    <span>Accessibilité</span>
                  </button>
                </div>
                
                <div className="border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
