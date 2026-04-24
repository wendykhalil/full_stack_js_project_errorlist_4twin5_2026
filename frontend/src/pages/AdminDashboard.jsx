import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Package,
  RefreshCw,
  Scan,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../auth/AuthContext";
import { getAdminDashboardSummary, getAdminAiInsights, apiFetch } from "../auth/api";
import { MouseTooltipProvider, Hint } from "../components/MouseTooltip";

const SOCKET_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const POLL_INTERVAL_MS = 30_000; // refresh summary every 30 s

/* ─── Formatters ─────────────────────────────────────────────────────────── */
const money = new Intl.NumberFormat("fr-TN", {
  style: "currency", currency: "TND", maximumFractionDigits: 0,
});
const PIE_COLORS = ["#4f46e5", "#f97316", "#10b981", "#64748b", "#ef4444", "#06b6d4"];

/* ─── Primitives ─────────────────────────────────────────────────────────── */

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h2>
  );
}

function KpiCard({ icon, label, value, helper, iconBg = "bg-slate-100", iconFg = "text-slate-600" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-5 w-5 ${iconFg}` })}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-700">{label}</div>
      {helper && <div className="mt-1 text-xs text-slate-400">{helper}</div>}
    </div>
  );
}

function AlertBanner({ title, subtitle, tone = "red" }) {
  const styles = {
    red:    { wrap: "bg-red-50 border-red-100",    icon: "text-red-500"    },
    amber:  { wrap: "bg-amber-50 border-amber-100", icon: "text-amber-600"  },
    indigo: { wrap: "bg-indigo-50 border-indigo-100", icon: "text-indigo-600" },
  };
  const s = styles[tone] ?? styles.red;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3.5 ${s.wrap}`}>
      <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, total, barClass }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-400">{value} ({pct}%)</span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${barClass}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function InsightBullet({ text, tone = "green" }) {
  const dot = { green: "bg-emerald-500", red: "bg-red-500", indigo: "bg-indigo-500" };
  return (
    <li className="flex items-start gap-2 text-sm text-slate-700">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[tone]}`} />
      {text}
    </li>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { token } = useAuth();

  // Dashboard summary state
  const [summary, setSummary]     = useState(null);
  const [loadingS, setLoadingS]   = useState(true);
  const [errorS, setErrorS]       = useState("");
  const [days, setDays]           = useState(30);
  const [lastUpdated, setLastUpdated] = useState(null);

  // AI insights state
  const [ai, setAi]               = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const aiCacheRef                = useRef({ data: null, expiresAt: 0 });

  // Quick-action scan state
  const [scanning, setScanning]   = useState(false);
  const [scanResult, setScanResult] = useState(null);

  /* ── Core summary fetch (used by polling + manual refresh + socket trigger) ── */
  const fetchSummary = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoadingS(true);
    try {
      const d = await getAdminDashboardSummary({ token, days });
      setSummary(d);
      setLastUpdated(new Date());
      setErrorS("");
    } catch (e) {
      setErrorS(e.message || "Erreur de chargement.");
    } finally {
      if (!silent) setLoadingS(false);
    }
  }, [token, days]);

  /* ── Initial load ── */
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  /* ── Polling every 30 s (silent background refresh) ── */
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchSummary(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchSummary, token]);

  /* ── Socket.IO: re-fetch summary when the backend pushes a notification
        to the admin room (new order, user blocked, etc.) ── */
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_BASE, {
      transports: ["websocket"],
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    // Any notification to the admin room means data changed → silent refresh
    socket.on("notification", () => fetchSummary(true));
    socket.on("new_order",    () => fetchSummary(true));

    return () => { try { socket.disconnect(); } catch {} };
  }, [token, fetchSummary]);

  /* ── AI insights (cached 8 min, force-refreshable) ── */
  const loadAi = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && aiCacheRef.current.data && now < aiCacheRef.current.expiresAt) {
      setAi(aiCacheRef.current.data);
      setLoadingAi(false);
      return;
    }
    setLoadingAi(true);
    try {
      const result = await getAdminAiInsights({ token, days, refresh: force });
      setAi(result);
      aiCacheRef.current = { data: result, expiresAt: now + 8 * 60 * 1000 };
    } catch (_) {
      // non-critical — fail silently
    } finally {
      setLoadingAi(false);
    }
  }, [token, days]);

  useEffect(() => { if (token) loadAi(); }, [loadAi, token]);

  /* ── Manual full refresh (header button) ── */
  const handleRefreshAll = useCallback(() => {
    fetchSummary();
    loadAi(true);
    setScanResult(null);
  }, [fetchSummary, loadAi]);

  /* ── Quick action: batch fraud scan ── */
  const handleBatchScan = useCallback(async (scanType) => {
    if (!token || scanning) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await apiFetch("/fraud/scan/batch", {
        token,
        method: "POST",
        body: { scanType, limit: 20 },
      });
      setScanResult(result);
      // Refresh summary after scan — new flags may have been raised
      fetchSummary(true);
    } catch (e) {
      setScanResult({ error: e.message || "Erreur lors du scan." });
    } finally {
      setScanning(false);
    }
  }, [token, scanning, fetchSummary]);

  /* ── Derived data (all from live API state — zero hardcoded values) ── */
  const stats   = summary?.stats              ?? {};
  const dist    = summary?.roleDistribution   ?? {};
  const charts  = summary?.charts             ?? { userGrowth: [], revenueOverTime: [], ordersStatusDistribution: [], roleDistribution: [] };
  const changes = summary?.changes            ?? { userGrowthPct: 0 };
  const hl      = summary?.highlights         ?? { mostActiveRole: { role: "—", count: 0 }, revenueTrend: 0 };
  const alerts  = summary?.alerts             ?? [];
  const locData = summary?.locationAnalytics  ?? {};

  const criticalAlerts = alerts.filter((a) => a.tone === "red");
  const otherAlerts    = alerts.filter((a) => a.tone !== "red");

  /* ── Loading / error shell ── */
  if (loadingS) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
            <p className="mt-4 text-sm text-slate-500">Chargement du tableau de bord…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorS) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 max-w-lg w-full">
            {errorS}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Tableau de bord
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Vue en temps réel de la plateforme BMP.tn
              </p>
              {lastUpdated && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Mis à jour : {lastUpdated.toLocaleTimeString("fr-TN")}
                  {summary && (
                    <Hint text="Les données se rafraîchissent automatiquement toutes les 30 secondes.">
                      <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-400 cursor-default" />
                    </Hint>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Period selector */}
              <Hint text="Choisissez la fenêtre temporelle pour toutes les statistiques et graphiques.">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-sm">
                  {[7, 30, 90].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDays(v)}
                      className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                        days === v ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {v}j
                    </button>
                  ))}
                </div>
              </Hint>
              {/* Full refresh */}
              <Hint text="Recharge toutes les données du tableau de bord et les analyses IA.">
                <button
                  type="button"
                  onClick={handleRefreshAll}
                  disabled={loadingS || loadingAi}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {(loadingS || loadingAi)
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />}
                  Actualiser
                </button>
              </Hint>
            </div>
          </div>

          {/* ══ 1. ALERTES CRITIQUES ════════════════════════════════════ */}
          {criticalAlerts.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>Alertes critiques</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {criticalAlerts.map((a) => (
                  <Hint key={a.id} text="Alerte critique nécessitant une action immédiate de votre part.">
                    <div>
                      <AlertBanner title={a.title} subtitle={a.subtitle} tone="red" />
                    </div>
                  </Hint>
                ))}
              </div>
            </section>
          )}

          {/* ══ 2. KPIs PRINCIPAUX ══════════════════════════════════════ */}
          <section className="space-y-3">
            <SectionTitle>Indicateurs clés</SectionTitle>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Hint text="Nombre de comptes avec le statut ACTIF. Les comptes bloqués ou inactifs ne sont pas comptés.">
                <div>
                  <KpiCard
                    icon={<Users />}
                    label="Utilisateurs actifs"
                    value={stats.activeUsers ?? 0}
                    helper={`${stats.totalUsers ?? 0} comptes au total`}
                    iconBg="bg-indigo-50" iconFg="text-indigo-600"
                  />
                </div>
              </Hint>
              <Hint text="Total des commandes passées sur la plateforme. Le chiffre entre parenthèses indique celles encore en traitement.">
                <div>
                  <KpiCard
                    icon={<ShoppingCart />}
                    label="Commandes"
                    value={stats.totalOrders ?? 0}
                    helper={`${stats.openOrders ?? 0} en cours`}
                    iconBg="bg-emerald-50" iconFg="text-emerald-600"
                  />
                </div>
              </Hint>
              <Hint text="Montant total cumulé des commandes ayant le statut LIVRÉ. Représente le chiffre d'affaires réel encaissé.">
                <div>
                  <KpiCard
                    icon={<ArrowLeftRight />}
                    label="Volume livré"
                    value={money.format(stats.deliveredRevenue || 0)}
                    helper="Commandes livrées cumulées"
                    iconBg="bg-orange-50" iconFg="text-orange-600"
                  />
                </div>
              </Hint>
              <Hint text="Produits validés et visibles sur la place de marché. Les produits en attente de validation ne sont pas inclus.">
                <div>
                  <KpiCard
                    icon={<Package />}
                    label="Produits approuvés"
                    value={stats.approvedProducts ?? 0}
                    helper={`${stats.totalProducts ?? 0} enregistrés`}
                    iconBg="bg-slate-100" iconFg="text-slate-600"
                  />
                </div>
              </Hint>
            </div>

            {/* Secondary KPIs row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Hint text="Variation du nombre de nouveaux inscrits par rapport à la période précédente de même durée. Positif = croissance.">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Croissance utilisateurs</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{changes.userGrowthPct}%</p>
                  <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${changes.userGrowthPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {changes.userGrowthPct >= 0 ? "Hausse" : "Baisse"} vs période précédente
                  </p>
                </div>
              </Hint>
              <Hint text="Le rôle ayant le plus grand nombre d'utilisateurs inscrits sur la plateforme (Artisan, Fournisseur, Prescripteur ou Admin).">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Rôle le plus actif</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{hl.mostActiveRole.role}</p>
                  <p className="mt-1 text-xs text-slate-400">{hl.mostActiveRole.count} utilisateurs</p>
                </div>
              </Hint>
              <Hint text="Différence de revenus entre le début et la fin de la période sélectionnée. Indique si les ventes progressent ou régressent.">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Tendance revenus</p>
                  <p className={`mt-1 text-xl font-bold ${hl.revenueTrend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {money.format(hl.revenueTrend || 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Variation sur la fenêtre sélectionnée</p>
                </div>
              </Hint>
            </div>
          </section>

          {/* ══ 3. ANALYSES IA ══════════════════════════════════════════ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Analyses IA</SectionTitle>
              {ai?.source === "heuristic" && (
                <Hint text="L'IA utilise des règles heuristiques car les données sont insuffisantes pour un modèle prédictif complet.">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 cursor-default">
                    Mode heuristique
                  </span>
                </Hint>
              )}
            </div>

            {loadingAi ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <p className="text-sm text-slate-500">Analyse IA en cours…</p>
              </div>
            ) : ai ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                {/* Score + summary */}
                <Hint text="Score de santé global de la plateforme calculé par l'IA. 80+ = excellent, 60–79 = bon, 40–59 = attention requise, moins de 40 = critique.">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score santé</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                      style={{
                        background: ai.score >= 80 ? "#10b981"
                          : ai.score >= 60 ? "#f59e0b"
                          : ai.score >= 40 ? "#f97316" : "#ef4444",
                      }}
                    >
                      {ai.score}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">{ai.summary}</p>
                  </div>
                </div>
                </Hint>

                {/* Positives + Risks */}
                <Hint text="Points forts détectés par l'IA : croissance, engagement, performance des ventes, etc.">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Tendances positives</p>
                  </div>
                  <ul className="space-y-2">
                    {(ai.positives ?? []).slice(0, 4).map((t, i) => (
                      <InsightBullet key={i} text={t} tone="green" />
                    ))}
                  </ul>
                </div>
                </Hint>

                {/* Risks + Recommendations */}
                <div className="space-y-4">
                  {(ai.risks ?? []).length > 0 && (
                    <Hint text="Risques identifiés par l'IA : anomalies, baisses de performance ou comportements suspects à surveiller.">
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Risques</p>
                      </div>
                      <ul className="space-y-1.5">
                        {(ai.risks ?? []).slice(0, 3).map((r, i) => (
                          <InsightBullet key={i} text={r} tone="red" />
                        ))}
                      </ul>
                    </div>
                    </Hint>
                  )}
                  <Hint text="Actions concrètes suggérées par l'IA pour améliorer les performances de la plateforme.">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-indigo-600" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Recommandations</p>
                    </div>
                    <ul className="space-y-1.5">
                      {(ai.recommendations ?? []).slice(0, 3).map((r, i) => (
                        <InsightBullet key={i} text={r} tone="indigo" />
                      ))}
                    </ul>
                  </div>
                  </Hint>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                Analyses IA indisponibles pour le moment.
              </div>
            )}
          </section>

          {/* ══ 4. TENDANCES / GRAPHIQUES ═══════════════════════════════ */}
          <section className="space-y-3">
            <SectionTitle>Tendances</SectionTitle>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

              {/* User growth line chart */}
              <Hint text="Évolution du nombre de nouveaux inscrits jour par jour sur la période sélectionnée.">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">Croissance utilisateurs</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </Hint>

              {/* Revenue bar chart */}
              <Hint text="Revenus générés par les commandes livrées, agrégés par jour. Permet de visualiser les pics et creux d'activité commerciale.">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">Revenus dans le temps</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.revenueOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </Hint>

              {/* Order status pie */}
              <Hint text="Répartition des commandes selon leur statut actuel : en attente, acceptée, en préparation, expédiée, livrée, annulée, etc.">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">Statuts des commandes</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={charts.ordersStatusDistribution} dataKey="count" nameKey="status" outerRadius={90} label>
                        {charts.ordersStatusDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </Hint>

              {/* Role distribution + progress bars */}
              <Hint text="Proportion de chaque rôle parmi tous les utilisateurs inscrits. Les barres montrent le poids relatif de chaque catégorie.">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Répartition des utilisateurs</p>
                  <Hint text="Nombre de comptes actuellement bloqués par un administrateur.">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 cursor-default">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {stats.blockedUsers ?? 0} bloqués
                    </span>
                  </Hint>
                </div>
                <div className="space-y-4">
                  <ProgressRow label="Artisans"      value={dist.artisans ?? 0}      total={stats.totalUsers || 1} barClass="bg-indigo-600" />
                  <ProgressRow label="Fournisseurs"  value={dist.suppliers ?? 0}     total={stats.totalUsers || 1} barClass="bg-orange-500" />
                  <ProgressRow label="Prescripteurs" value={dist.prescripteurs ?? 0} total={stats.totalUsers || 1} barClass="bg-emerald-600" />
                  <ProgressRow label="Admins"        value={dist.admins ?? 0}        total={stats.totalUsers || 1} barClass="bg-slate-600" />
                </div>
              </div>
              </Hint>
            </div>
          </section>

          {/* ══ 5. FLUX RÉCENT & LOCALISATION ═══════════════════════════ */}
          <section className="space-y-3">
            <SectionTitle>Flux récent</SectionTitle>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.6fr]">

              {/* Other alerts */}
              <Hint text="Dernières actions enregistrées sur la plateforme : nouvelles inscriptions, connexions, blocages, commandes, etc.">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">Derniers événements plateforme</p>
                <div className="space-y-2.5">
                  {otherAlerts.length ? (
                    otherAlerts.map((a) => (
                      <AlertBanner key={a.id} title={a.title} subtitle={a.subtitle} tone={a.tone} />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                      Aucune activité récente.
                    </div>
                  )}
                </div>
              </div>
              </Hint>

              {/* Location analytics */}
              <Hint text="Données de géolocalisation des utilisateurs ayant partagé leur position. Utile pour analyser la couverture géographique de la plateforme.">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">Géolocalisation</p>
                <div className="space-y-3">
                  {[
                    { label: "Utilisateurs géolocalisés", value: locData.trackedUsers ?? 0,            hint: "Nombre d'utilisateurs ayant activé le partage de position." },
                    { label: "Latitude moyenne",          value: locData.avgLat?.toFixed(4) ?? "N/A", hint: "Latitude moyenne calculée sur tous les utilisateurs géolocalisés." },
                    { label: "Longitude moyenne",         value: locData.avgLng?.toFixed(4) ?? "N/A", hint: "Longitude moyenne calculée sur tous les utilisateurs géolocalisés." },
                  ].map(({ label, value, hint }) => (
                    <Hint key={label} text={hint}>
                      <div className="rounded-xl bg-slate-50 px-4 py-3 cursor-default">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-0.5 text-base font-semibold text-slate-900">{value}</p>
                      </div>
                    </Hint>
                  ))}
                </div>
              </div>
              </Hint>
            </div>
          </section>

          {/* ══ 6. ACTIONS RAPIDES ══════════════════════════════════════ */}
          <section className="space-y-3">
            <SectionTitle>Actions rapides</SectionTitle>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Scan artisans — real API call */}
                <Hint text="Lance une analyse anti-fraude sur les 20 derniers profils artisans. Détecte les comportements suspects et les faux comptes.">
                <button
                  type="button"
                  onClick={() => handleBatchScan("artisans")}
                  disabled={scanning}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
                >
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                  Scanner artisans
                </button>
                </Hint>

                {/* Scan projects — real API call */}
                <Hint text="Lance une analyse anti-fraude sur les 20 derniers projets. Identifie les projets avec des données incohérentes ou suspectes.">
                <button
                  type="button"
                  onClick={() => handleBatchScan("projects")}
                  disabled={scanning}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
                >
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                  Scanner projets
                </button>
                </Hint>

                {/* Navigation links */}
                <Hint text="Accéder à la gestion complète des comptes utilisateurs : bloquer, débloquer, filtrer par rôle ou statut.">
                <Link
                  to="/admin/users"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                >
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </Link>
                </Hint>

                <Hint text="Accéder au tableau de bord de détection de fraude avec scores de risque, alertes et analyses comportementales.">
                <Link
                  to="/admin/fraud-analytics"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Fraude & Analyses
                </Link>
                </Hint>
              </div>

              {/* Scan result feedback — live from API response */}
              {scanResult && (
                <div className={`mt-4 rounded-xl border p-4 text-sm ${
                  scanResult.error
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-emerald-100 bg-emerald-50 text-emerald-800"
                }`}>
                  {scanResult.error ? (
                    <p>{scanResult.error}</p>
                  ) : (
                    <div className="flex flex-wrap gap-6">
                      <span><strong>{scanResult.total_scanned ?? 0}</strong> éléments scannés</span>
                      <span className="text-red-600"><strong>{scanResult.summary?.high_risk ?? 0}</strong> risque élevé</span>
                      <span className="text-amber-600"><strong>{scanResult.summary?.medium_risk ?? 0}</strong> risque moyen</span>
                      <span className="text-emerald-600"><strong>{scanResult.summary?.low_risk ?? 0}</strong> risque faible</span>
                      {scanResult.summary?.fraud_rate != null && (
                        <span>Taux de fraude : <strong>{scanResult.summary.fraud_rate}%</strong></span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
