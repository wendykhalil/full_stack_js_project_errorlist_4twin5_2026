import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ClipboardList,
  FolderKanban,
  PackageCheck,
  Plus,
  Receipt,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Briefcase
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useAuth } from "../auth/AuthContext";
import { getArtisanDashboardSummary } from "../auth/api";

const currency = new Intl.NumberFormat("fr-TN", {
  style: "currency",
  currency: "TND",
  maximumFractionDigits: 0,
});

const statusMeta = {
  ACTIVE: { label: "Actif", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING: { label: "En attente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "Terminé", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

const activityMeta = {
  "project-updated": { icon: FolderKanban, tone: "bg-blue-100 text-blue-700" },
  "project-completed": { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
  quote: { icon: FileText, tone: "bg-indigo-100 text-indigo-700" },
  invoice: { icon: Receipt, tone: "bg-orange-100 text-orange-700" },
  "invoice-paid": { icon: PackageCheck, tone: "bg-emerald-100 text-emerald-700" },
  order: { icon: ShoppingCart, tone: "bg-slate-100 text-slate-700" },
};

function StatCard({ title, value, helper, icon, iconBg, iconFg }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} shadow-sm`}>
          {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ to, icon, label, description, iconBg, iconFg }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{label}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
        Accéder <ArrowUpRight className="ml-1 h-3 w-3" />
      </div>
    </Link>
  );
}

export default function ArtisanDashboard() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getArtisanDashboardSummary({ token });
        if (active) {
          setSummary(data);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message || "Impossible de charger le tableau de bord.");
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
    totalProjects: 0,
    activeProjects: 0,
    documentsCount: 0,
    inProgressOrders: 0,
    totalBudget: 0,
    completionRate: 0,
    unpaidInvoicesAmount: 0,
    completedProjects: 0,
    pendingProjects: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tableau de bord</h1>
        <p className="mt-2 text-slate-500">
          Bienvenue dans votre espace de gestion professionnelle
        </p>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 p-8 shadow-lg">
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-12">
          <div className="h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Briefcase className="mr-1 h-3 w-3" />
              Activité en temps réel
            </div>
            <h2 className="text-2xl font-semibold text-white lg:text-3xl">
              Suivez l'avancement de votre activité
            </h2>
            <p className="text-indigo-100">
              Toutes les données ci-dessous sont basées sur vos projets et commandes réels
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">Progression</p>
              <p className="mt-2 text-2xl font-bold text-white">{stats.completionRate}%</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">Budget total</p>
              <p className="mt-2 text-lg font-bold text-white">{currency.format(stats.totalBudget || 0)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">Factures impayées</p>
              <p className="mt-2 text-lg font-bold text-white">{currency.format(stats.unpaidInvoicesAmount || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-slate-500">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {!loading && !error && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Projets"
              value={stats.totalProjects}
              helper={`${stats.completedProjects || 0} terminés`}
              icon={<FolderKanban />}
              iconBg="bg-indigo-50"
              iconFg="text-indigo-600"
            />
            <StatCard
              title="Projets actifs"
              value={stats.activeProjects}
              helper={`${stats.pendingProjects || 0} en attente`}
              icon={<TrendingUp />}
              iconBg="bg-emerald-50"
              iconFg="text-emerald-600"
            />
            <StatCard
              title="Documents émis"
              value={stats.documentsCount}
              helper="Devis + Factures"
              icon={<FileText />}
              iconBg="bg-orange-50"
              iconFg="text-orange-600"
            />
            <StatCard
              title="Commandes en cours"
              value={stats.inProgressOrders}
              helper="À suivre"
              icon={<ShoppingCart />}
              iconBg="bg-blue-50"
              iconFg="text-blue-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
                <p className="mt-1 text-sm text-slate-500">Accédez directement aux fonctionnalités clés</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                to="/artisan/projects"
                icon={<Plus />}
                label="Nouveau projet"
                description="Créer ou mettre à jour un chantier"
                iconBg="bg-indigo-50"
                iconFg="text-indigo-600"
              />
              <ActionCard
                to="/artisan/devis/create"
                icon={<ClipboardList />}
                label="Créer un devis"
                description="Préparer un devis professionnel"
                iconBg="bg-emerald-50"
                iconFg="text-emerald-600"
              />
              <ActionCard
                to="/artisan/factures"
                icon={<Receipt />}
                label="Gérer les factures"
                description="Suivre vos documents émis"
                iconBg="bg-orange-50"
                iconFg="text-orange-600"
              />
              <ActionCard
                to="/artisan/orders"
                icon={<ShoppingCart />}
                label="Voir les commandes"
                description="Contrôler les commandes et livraisons"
                iconBg="bg-blue-50"
                iconFg="text-blue-600"
              />
            </div>
          </div>

          {/* Recent Projects & Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Projects */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Projets récents</h2>
                  <p className="text-sm text-slate-500">Vos derniers projets enregistrés</p>
                </div>
                <Link to="/artisan/projects" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Voir tout <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {summary?.recentProjects?.length ? (
                  summary.recentProjects.map((project) => {
                    const meta = statusMeta[project.status] || statusMeta.PENDING;
                    return (
                      <div key={project._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-indigo-200 hover:shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{project.title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                              <span>{project.city || "Localisation non renseignée"}</span>
                              <span>•</span>
                              <span>{currency.format(project.budgetTND || 0)}</span>
                            </div>
                          </div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                            <span>Progression</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <FolderKanban className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">Aucun projet pour le moment</p>
                    <Link to="/artisan/projects" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Créer votre premier projet
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Activité récente</h2>
                <p className="text-sm text-slate-500">Derniers mouvements sur votre espace</p>
              </div>

              <div className="space-y-4">
                {summary?.recentActivity?.length ? (
                  summary.recentActivity.map((item) => {
                    const meta = activityMeta[item.type] || { icon: AlertCircle, tone: "bg-slate-100 text-slate-700" };
                    const Icon = meta.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-slate-50">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">Aucune activité récente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <SimpleFooter />
    </div>
  );
}