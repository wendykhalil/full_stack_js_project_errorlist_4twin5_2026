import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, User, Settings, LogOut, Accessibility, MessageCircle, MapPin, Loader2, Mic, MicOff,
  LayoutDashboard, FolderOpen, FileText, Receipt, ShoppingBag, Star, Cloud, CalendarCheck,
  ClipboardList, Gavel, Users, Activity, CreditCard, Flag, AlertOctagon, BarChart2,
  Package, PlusSquare, Edit, Bot, Briefcase, Compass, ArrowRight, Hash } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import { getCurrentLang } from "../i18n";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import NotificationBell from "./NotificationBell";
import { useNotification } from "../hooks/useNotification";
import { getCurrentPositionWithAddress, updateLocationOnServer } from "../utils/geolocation";
import { storeLocationUpdate } from "../services/profileService";
import Notification from "./Notification";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

// ✅ Isolated clock component — only this re-renders every second, not the whole topbar
const LiveClock = React.memo(function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
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
  );
});

const ROLE_CONFIG = {
  ADMIN: {
    home: "/admin",
    roleLabel: "Admin",
    pages: [
      { to: "/admin",                 label: "Tableau de bord",   icon: LayoutDashboard, category: "Principal",    keywords: ["home","overview","dashboard","accueil"] },
      { to: "/admin/users",           label: "Utilisateurs",      icon: Users,           category: "Gestion",      keywords: ["team","members","comptes","utilisateurs"] },
      { to: "/admin/activity",        label: "Journaux d'activité",icon: Activity,       category: "Gestion",      keywords: ["logs","journal","history","activite","audit"] },
      { to: "/admin/transactions",    label: "Transactions",      icon: CreditCard,      category: "Gestion",      keywords: ["payments","billing","paiements","finance"] },
      { to: "/admin/reports",         label: "Signalements",      icon: Flag,            category: "Modération",   keywords: ["reports","signalements","abus","moderation"] },
      { to: "/admin/disputes",        label: "Litiges",           icon: Gavel,           category: "Modération",   keywords: ["disputes","litiges","conflits"] },
      { to: "/admin/promo-codes",     label: "Codes promo",       icon: Hash,            category: "Marketing",    keywords: ["promo","codes","discount","reduction"] },
      { to: "/admin/ai-insights",     label: "Insights IA",       icon: Bot,             category: "Analytique",   keywords: ["ai","insights","intelligence","analyse"] },
      { to: "/admin/fraud-analytics", label: "Fraude & Sécurité", icon: AlertOctagon,    category: "Analytique",   keywords: ["fraud","fraude","securite","anomalies"] },
      { to: "/admin/user-statistics", label: "Statistiques",      icon: BarChart2,       category: "Analytique",   keywords: ["stats","statistiques","kpi","metrics"] },
      { to: "/admin/artisans",        label: "Artisans",          icon: Briefcase,       category: "Gestion",      keywords: ["artisans","workers","prestataires"] },
      { to: "/admin/profile",         label: "Mon profil",        icon: User,            category: "Compte",       keywords: ["settings","account","password","profil","compte"] },
      { to: "/admin/AiChat",          label: "Assistant IA",      icon: Bot,             category: "Outils",       keywords: ["ai","assistant","chat","gpt","aide"] },
    ],
  },
  ARTISAN: {
    home: "/artisan",
    roleLabel: "Artisan",
    pages: [
      { to: "/artisan",                  label: "Tableau de bord",   icon: LayoutDashboard, category: "Principal",  keywords: ["home","overview","dashboard","accueil"] },
      { to: "/artisan/projects",         label: "Projets",           icon: FolderOpen,      category: "Travaux",    keywords: ["chantier","project","projets","sites"] },
      { to: "/artisan/portfolio",        label: "Portfolio",         icon: Star,            category: "Travaux",    keywords: ["gallery","images","travaux","realisations"] },
      { to: "/artisan/availability",     label: "Disponibilités",    icon: CalendarCheck,   category: "Travaux",    keywords: ["agenda","disponibilite","calendrier","schedule"] },
      { to: "/artisan/service-requests", label: "Demandes de service",icon: ClipboardList,  category: "Travaux",    keywords: ["demandes","requests","missions","service"] },
      { to: "/artisan/devis/create",     label: "Créer un devis",    icon: FileText,        category: "Documents",  keywords: ["devis","quote","estimate","nouveau devis"] },
      { to: "/artisan/factures",         label: "Factures",          icon: Receipt,         category: "Documents",  keywords: ["invoice","factures","billing","paiement"] },
      { to: "/artisan/marketplace",      label: "Marketplace",       icon: ShoppingBag,     category: "Boutique",   keywords: ["products","catalog","marketplace","achats"] },
      { to: "/artisan/orders",           label: "Commandes",         icon: Package,         category: "Boutique",   keywords: ["commandes","purchases","orders"] },
      { to: "/artisan/cart",             label: "Panier",            icon: ShoppingBag,     category: "Boutique",   keywords: ["cart","panier","basket"] },
      { to: "/artisan/favorites",        label: "Favoris",           icon: Star,            category: "Boutique",   keywords: ["favoris","wishlist","saved"] },
      { to: "/artisan/messages",         label: "Messages",          icon: MessageCircle,   category: "Communication",keywords: ["chat","conversation","inbox","messagerie"] },
      { to: "/artisan/meetings",         label: "Réunions",          icon: CalendarCheck,   category: "Communication",keywords: ["meetings","reunions","rdv","rendez-vous"] },
      { to: "/artisan/disputes",         label: "Litiges",           icon: Gavel,           category: "Compte",     keywords: ["disputes","litiges","conflits","reclamations"] },
      { to: "/artisan/weather",          label: "Météo",             icon: Cloud,           category: "Outils",     keywords: ["weather","meteo","temps","climat"] },
      { to: "/artisan/subscription",     label: "Abonnement",        icon: CreditCard,      category: "Compte",     keywords: ["plan","abonnement","pro","premium","upgrade"] },
      { to: "/artisan/profile",          label: "Mon profil",        icon: User,            category: "Compte",     keywords: ["account","settings","password","profil","compte"] },
      { to: "/artisan/AiChat",           label: "Assistant IA",      icon: Bot,             category: "Outils",     keywords: ["ai","assistant","chat","gpt","aide"] },
    ],
  },
  PRESCRIPTEUR: {
    home: "/prescripteur",
    roleLabel: "Prescripteur",
    pages: [
      { to: "/prescripteur",                  label: "Produits",           icon: ShoppingBag,   category: "Principal",    keywords: ["catalog","produits","accueil"] },
      { to: "/prescripteur/artisans",         label: "Artisans",           icon: Briefcase,     category: "Recherche",    keywords: ["workers","providers","artisans","prestataires"] },
      { to: "/prescripteur/search",           label: "Recherche avancée",  icon: Compass,       category: "Recherche",    keywords: ["find","rechercher","search","filtrer"] },
      { to: "/prescripteur/projects",         label: "Projets",            icon: FolderOpen,    category: "Gestion",      keywords: ["projets","sites","chantiers"] },
      { to: "/prescripteur/service-requests", label: "Demandes de service",icon: ClipboardList, category: "Gestion",      keywords: ["demandes","requests","missions","service"] },
      { to: "/prescripteur/messages",         label: "Messages",           icon: MessageCircle, category: "Communication",keywords: ["chat","inbox","messagerie","conversation"] },
      { to: "/prescripteur/meetings",         label: "Réunions",           icon: CalendarCheck, category: "Communication",keywords: ["meetings","reunions","rdv","rendez-vous"] },
      { to: "/prescripteur/disputes",         label: "Litiges",            icon: Gavel,         category: "Compte",       keywords: ["disputes","litiges","conflits"] },
      { to: "/prescripteur/profile",          label: "Mon profil",         icon: User,          category: "Compte",       keywords: ["account","settings","password","profil","compte"] },
      { to: "/prescripteur/AiChat",           label: "Assistant IA",       icon: Bot,           category: "Outils",       keywords: ["ai","assistant","chat","gpt","aide"] },
    ],
  },
  SUPPLIER: {
    home: "/fournisseur/produits",
    roleLabel: "Fournisseur",
    pages: [
      { to: "/fournisseur",              label: "Tableau de bord",  icon: LayoutDashboard, category: "Principal",  keywords: ["home","dashboard","accueil","overview"] },
      { to: "/fournisseur/produits",     label: "Mes produits",     icon: Package,         category: "Catalogue",  keywords: ["items","inventory","produits","stock"] },
      { to: "/fournisseur/produits/new", label: "Ajouter un produit",icon: PlusSquare,     category: "Catalogue",  keywords: ["create","add","nouveau","ajouter","produit"] },
      { to: "/fournisseur/marketplace",  label: "Marketplace",      icon: ShoppingBag,     category: "Catalogue",  keywords: ["catalog","products","marketplace","boutique"] },
      { to: "/fournisseur/orders",       label: "Commandes",        icon: ClipboardList,   category: "Ventes",     keywords: ["commandes","sales","orders","ventes"] },
      { to: "/fournisseur/messages",     label: "Messages",         icon: MessageCircle,   category: "Communication",keywords: ["chat","inbox","messagerie","conversation"] },
      { to: "/fournisseur/profile",      label: "Mon profil",       icon: User,            category: "Compte",     keywords: ["account","settings","password","profil","compte"] },
      { to: "/fournisseur/AiChat",       label: "Assistant IA",     icon: Bot,             category: "Outils",     keywords: ["ai","assistant","chat","gpt","aide"] },
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
      const lang = getCurrentLang();
      const notFound = lang === 'ar'
        ? `"${transcript}" — الصفحة غير موجودة`
        : lang === 'en'
        ? `"${transcript}" — page not found`
        : `"${transcript}" — page introuvable`;
      showVoiceFeedback(notFound);
    }
  };

  // Map app language → BCP-47 speech recognition locale
  const getSpeechLang = () => {
    const lang = getCurrentLang();
    if (lang === 'ar') return 'ar-SA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  };

  const toggleVoiceListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const lang = getCurrentLang();
      showVoiceFeedback(
        lang === 'ar' ? 'التعرف على الصوت غير مدعوم'
        : lang === 'en' ? 'Voice recognition not supported'
        : 'Reconnaissance vocale non supportée'
      );
      return;
    }

    if (isVoiceListening) {
      voiceRecognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLang();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsVoiceListening(true);
    recognition.onend = () => setIsVoiceListening(false);
    recognition.onerror = () => {
      setIsVoiceListening(false);
      const lang = getCurrentLang();
      showVoiceFeedback(
        lang === 'ar' ? 'خطأ في الميكروفون — حاول مجدداً'
        : lang === 'en' ? 'Mic error — try again'
        : 'Erreur micro — réessayez'
      );
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

  // ✅ Clock moved to LiveClock component — no more setInterval in topbar

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
    const q = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!q) return [];
    return (config.pages || [])
      .map((item) => {
        const haystack = [item.label, item.to, ...(item.keywords || [])].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!haystack.includes(q)) return null;
        // Score: label match scores higher than keyword match
        const labelNorm = item.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const score = labelNorm.startsWith(q) ? 3 : labelNorm.includes(q) ? 2 : 1;
        return { ...item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
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
      <LiveClock />

      <div className="relative flex flex-1 justify-center px-2">
        <form onSubmit={submitQuickJump} className="w-full max-w-lg">
          <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 220)}
              placeholder="Rechercher une page..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="shrink-0 text-slate-300 hover:text-slate-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </label>
        </form>

        {isFocused && (
          <div className="absolute top-[calc(100%+8px)] z-30 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            {query.trim() === '' ? (
              /* Empty state — show all pages grouped */
              <div className="max-h-80 overflow-y-auto p-2">
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pages disponibles</p>
                {(config.pages || []).slice(0, 6).map((item) => {
                  const Icon = item.icon && typeof item.icon !== 'string' ? item.icon : Hash;
                  return (
                    <button key={item.to} type="button"
                      onMouseDown={(e) => { e.preventDefault(); navigate(item.to); setQuery(''); setIsFocused(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Search className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm font-medium">Aucune page trouvée pour <span className="text-slate-600 dark:text-slate-300">"{query}"</span></p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto p-2">
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{results.length} résultat{results.length > 1 ? 's' : ''}</p>
                {results.map((item) => {
                  const Icon = item.icon && typeof item.icon !== 'string' ? item.icon : Hash;
                  const q = query.trim().toLowerCase();
                  const label = item.label;
                  const idx = label.toLowerCase().indexOf(q);
                  const highlighted = idx >= 0
                    ? <>{label.slice(0, idx)}<mark className="bg-indigo-100 text-indigo-700 rounded px-0.5">{label.slice(idx, idx + q.length)}</mark>{label.slice(idx + q.length)}</>
                    : label;
                  return (
                    <button key={item.to} type="button"
                      onMouseDown={(e) => { e.preventDefault(); navigate(item.to); setQuery(''); setIsFocused(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50 dark:hover:bg-slate-800">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                        <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{highlighted}</p>
                        {item.category && <p className="text-xs text-slate-400">{item.category}</p>}
                      </div>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Dark Mode Toggle */}
        <DarkModeToggle />

        {/* Voice Navigation Button */}
        <div className="relative">
          <button
            onClick={toggleVoiceListening}
            className={`relative rounded-lg p-2 transition-colors ${
              isVoiceListening
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'hover:bg-slate-50 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300'
            }`}
            title={
              isVoiceListening
                ? (getCurrentLang() === 'ar' ? 'إيقاف التنقل الصوتي' : getCurrentLang() === 'en' ? 'Stop voice navigation' : 'Arrêter la navigation vocale')
                : (getCurrentLang() === 'ar' ? 'التنقل الصوتي — قل اسم الصفحة' : getCurrentLang() === 'en' ? 'Voice navigation — say a page name' : "Navigation vocale — dites le nom d'une page")
            }
            aria-label="Voice navigation"
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
                <span data-no-translate className="font-bold text-blue-900 dark:text-blue-200 text-base">
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
                  <p data-no-translate className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
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
