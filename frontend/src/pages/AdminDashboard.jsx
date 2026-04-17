import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  TrendingUp,
  Package,
  ShieldAlert,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Footer from "../components/Footer";
import { useAuth } from "../auth/AuthContext";
import { getAdminDashboardSummary } from "../auth/api";

function StatCard({ icon, label, value, helper, iconBg = "bg-slate-100", iconFg = "text-slate-700" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
          {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
        </div>
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{helper}</div>
    </div>
  );
}

function ProgressRow({ label, value, total, barClass }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-700">{label}</div>
        <div className="text-slate-500">{value} ({pct}%)</div>
      </div>
      <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
        <div className={`h-2.5 rounded-full ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

function AlertItem({ title, subtitle, tone = "red" }) {
  const tones = {
    red: { wrap: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
    amber: { wrap: "bg-amber-50", icon: "text-amber-700", border: "border-amber-100" },
    indigo: { wrap: "bg-indigo-50", icon: "text-indigo-700", border: "border-indigo-100" },
  };
  const currentTone = tones[tone] ?? tones.red;

  return (
    <div className={`flex gap-3 rounded-2xl border ${currentTone.border} ${currentTone.wrap} p-4`}>
      <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 ${currentTone.icon}`}>
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-sm text-slate-600">{subtitle}</div>
      </div>
    </div>
  );
}

const money = new Intl.NumberFormat("fr-TN", {
  style: "currency",
  currency: "TND",
  maximumFractionDigits: 0,
});

const PIE_COLORS = ["#4f46e5", "#f97316", "#10b981", "#64748b", "#ef4444", "#06b6d4"];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getAdminDashboardSummary({ token, days });
        if (active) {
          setSummary(data);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message || "Impossible de charger les statistiques admin.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (token) load();
    return () => {
      active = false;
    };
  }, [token, days]);

  const stats = summary?.stats || {
    activeUsers: 0,
    totalUsers: 0,
    totalOrders: 0,
    deliveredRevenue: 0,
    approvedProducts: 0,
    totalProducts: 0,
    blockedUsers: 0,
    openOrders: 0,
  };
  const distribution = summary?.roleDistribution || {
    artisans: 0,
    suppliers: 0,
    prescripteurs: 0,
    admins: 0,
  };
  const charts = summary?.charts || {
    userGrowth: [],
    revenueOverTime: [],
    ordersStatusDistribution: [],
    roleDistribution: [],
  };
  const changes = summary?.changes || { userGrowthPct: 0, ordersGrowthPct: 0 };
  const highlights = summary?.highlights || { mostActiveRole: { role: "N/A", count: 0 }, revenueTrend: 0 };
  const locationAnalytics = summary?.locationAnalytics || { trackedUsers: 0 };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Tableau de bord admin
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Vue live de la plateforme sans cartes ni chiffres statiques.
        </p>
        <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-lg px-3 py-1.5 ${days === value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {value}j
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Chargement des statistiques...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Users />}
              label="Utilisateurs actifs"
              value={stats.activeUsers}
              helper={`${stats.totalUsers} comptes au total`}
              iconBg="bg-indigo-50"
              iconFg="text-indigo-600"
            />
            <StatCard
              icon={<ShoppingCart />}
              label="Commandes"
              value={stats.totalOrders}
              helper={`${stats.openOrders} encore en cours`}
              iconBg="bg-emerald-50"
              iconFg="text-emerald-600"
            />
            <StatCard
              icon={<ArrowLeftRight />}
              label="Volume livré"
              value={money.format(stats.deliveredRevenue || 0)}
              helper="Montant cumulé des commandes livrées"
              iconBg="bg-orange-50"
              iconFg="text-orange-600"
            />
            <StatCard
              icon={<Package />}
              label="Produits approuvés"
              value={stats.approvedProducts}
              helper={`${stats.totalProducts} produits enregistrés`}
              iconBg="bg-slate-100"
              iconFg="text-slate-700"
            />
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Croissance utilisateurs</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{changes.userGrowthPct}%</div>
              <div className={`mt-2 inline-flex items-center gap-1 text-sm ${changes.userGrowthPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                <TrendingUp className="h-4 w-4" /> {changes.userGrowthPct >= 0 ? "Hausse" : "Baisse"} vs période précédente
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Rôle le plus actif</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{highlights.mostActiveRole.role}</div>
              <div className="mt-2 text-sm text-slate-600">{highlights.mostActiveRole.count} utilisateurs</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Tendance revenus</div>
              <div className={`mt-2 text-2xl font-semibold ${highlights.revenueTrend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {money.format(highlights.revenueTrend || 0)}
              </div>
              <div className="mt-2 text-sm text-slate-600">Variation sur la fenêtre sélectionnée</div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Répartition des utilisateurs</h2>
                  <p className="mt-1 text-sm text-slate-500">Calculée à partir des comptes réellement enregistrés.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                  <ShieldAlert className="h-4 w-4" />
                  {stats.blockedUsers} bloqués
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <ProgressRow label="Artisans" value={distribution.artisans} total={stats.totalUsers || 0} barClass="bg-indigo-600" />
                <ProgressRow label="Fournisseurs" value={distribution.suppliers} total={stats.totalUsers || 0} barClass="bg-orange-500" />
                <ProgressRow label="Prescripteurs" value={distribution.prescripteurs} total={stats.totalUsers || 0} barClass="bg-emerald-600" />
                <ProgressRow label="Admins" value={distribution.admins} total={stats.totalUsers || 0} barClass="bg-slate-700" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Flux récent</h2>
              <p className="mt-1 text-sm text-slate-500">Dernières alertes remontées par les vrais événements plateforme.</p>

              <div className="mt-6 space-y-4">
                {summary?.alerts?.length ? (
                  summary.alerts.map((alert) => (
                    <AlertItem key={alert.id} title={alert.title} subtitle={alert.subtitle} tone={alert.tone} />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Aucune activité récente à afficher.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Croissance utilisateurs</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Revenus dans le temps</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Répartition statuts commandes</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.ordersStatusDistribution} dataKey="count" nameKey="status" outerRadius={110} label>
                      {charts.ordersStatusDistribution.map((entry, index) => (
                        <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Répartition des rôles</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.roleDistribution} dataKey="count" nameKey="role" outerRadius={110} label>
                      {charts.roleDistribution.map((entry, index) => (
                        <Cell key={entry.role} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Analyse de localisation</h2>
            <p className="mt-1 text-sm text-slate-500">Basé sur les profils ayant une position enregistrée.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Utilisateurs géolocalisés</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">{locationAnalytics.trackedUsers || 0}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Latitude moyenne</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">{locationAnalytics.avgLat?.toFixed?.(4) ?? "N/A"}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Longitude moyenne</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">{locationAnalytics.avgLng?.toFixed?.(4) ?? "N/A"}</div>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
