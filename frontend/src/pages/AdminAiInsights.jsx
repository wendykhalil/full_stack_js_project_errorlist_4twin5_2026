import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getAdminAiInsights } from "../auth/api";
import { Hint } from "../components/MouseTooltip";

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const label =
    score >= 80 ? "Sain" : score >= 60 ? "Modéré" : score >= 40 ? "À surveiller" : "Critique";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="64" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a">
          {score}
        </text>
        <text x="64" y="78" textAnchor="middle" fontSize="11" fill="#64748b">
          / 100
        </text>
      </svg>
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: color + "22", color }}
      >
        {label}
      </span>
    </div>
  );
}

// ── List card ─────────────────────────────────────────────────────────────────
function InsightCard({ title, icon, items, tone }) {
  const tones = {
    green: {
      border: "border-emerald-100",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconFg: "text-emerald-600",
      dot: "bg-emerald-500",
    },
    red: {
      border: "border-red-100",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconFg: "text-red-600",
      dot: "bg-red-500",
    },
    indigo: {
      border: "border-indigo-100",
      bg: "bg-indigo-50",
      iconBg: "bg-indigo-100",
      iconFg: "text-indigo-600",
      dot: "bg-indigo-500",
    },
  };
  const t = tones[tone] ?? tones.indigo;

  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} p-5`}>
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.iconBg}`}>
          {React.cloneElement(icon, { className: `h-5 w-5 ${t.iconFg}` })}
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Metric pill ───────────────────────────────────────────────────────────────
function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
      <div className="text-lg font-semibold text-slate-900">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAiInsights() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState(null);
  const [days] = useState(30);
  const cacheRef = useRef({ data: null, expiresAt: 0 });

  const load = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();
      if (!forceRefresh && cacheRef.current.data && now < cacheRef.current.expiresAt) {
        setData(cacheRef.current.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const result = await getAdminAiInsights({ token, days, refresh: forceRefresh });
        setData(result);
        setLastFetched(new Date());
        cacheRef.current = { data: result, expiresAt: now + 8 * 60 * 1000 };
      } catch (err) {
        setError(err.message || "Impossible de charger les analyses IA.");
      } finally {
        setLoading(false);
      }
    },
    [token, days]
  );

  useEffect(() => {
    if (token) load();
  }, [load, token]);

  const m = data?.metrics;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Analyses IA
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Analyse IA de la santé de la plateforme et recommandations actionnables.
          </p>
          {lastFetched && !loading && (
            <p className="mt-1 text-xs text-slate-400">
              Dernière mise à jour : {lastFetched.toLocaleTimeString()}
              {data?.source === "heuristic" && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                  mode heuristique (IA hors ligne)
                </span>
              )}
              {data?.cached && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                  en cache
                </span>
              )}
            </p>
          )}
        </div>
        <Hint text="Forcer une nouvelle analyse IA avec les données les plus récentes (ignore le cache).">
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualiser les analyses
        </button>
        </Hint>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="mt-4 text-sm text-slate-500">Analyse des données de la plateforme en cours…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <>
          {/* Score + Summary */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <ScoreRing score={data.score ?? 0} />
            </div>
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Résumé
              </h2>
              <p className="text-base leading-relaxed text-slate-700">{data.summary}</p>

              {/* Key metrics strip */}
              {m && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricPill label="Utilisateurs" value={m.totalUsers?.toLocaleString()} />
                  <MetricPill
                    label="Croissance"
                    value={`${m.userGrowthPct >= 0 ? "+" : ""}${m.userGrowthPct}%`}
                  />
                  <MetricPill label="Taux de livraison" value={`${m.deliveryRate}%`} />
                  <MetricPill
                    label="Revenus (TND)"
                    value={m.deliveredRevenue?.toLocaleString("fr-TN")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Positives / Risks / Recommendations */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Hint text="Points forts détectés par l'IA : croissance, engagement, performance des ventes, etc.">
            <InsightCard
              title="Tendances positives"
              icon={<TrendingUp />}
              items={data.positives ?? []}
              tone="green"
            />
            </Hint>
            <Hint text="Risques et anomalies identifiés par l'IA nécessitant votre attention.">
            <InsightCard
              title="Risques & Alertes"
              icon={<AlertTriangle />}
              items={data.risks ?? []}
              tone="red"
            />
            </Hint>
            <Hint text="Actions concrètes suggérées par l'IA pour améliorer les performances de la plateforme.">
            <InsightCard
              title="Recommandations"
              icon={<Lightbulb />}
              items={data.recommendations ?? []}
              tone="indigo"
            />
            </Hint>
          </div>

          {/* Generated at */}
          {data.generatedAt && (
            <p className="text-center text-xs text-slate-400">
              Rapport généré le {new Date(data.generatedAt).toLocaleString("fr-TN")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
