import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  Package,
  ShieldAlert,
  ShoppingCart,
  Users,
} from "lucide-react";
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

export default function AdminDashboard() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getAdminDashboardSummary({ token });
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
  }, [token]);

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

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Tableau de bord admin
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Vue live de la plateforme sans cartes ni chiffres statiques.
        </p>
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
        </>
      )}

      <Footer />
    </div>
  );
}
