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
  ACTIVE: { label: "Actif", className: "bg-blue-50 text-blue-700" },
  PENDING: { label: "En attente", className: "bg-amber-50 text-amber-700" },
  COMPLETED: { label: "Terminé", className: "bg-emerald-50 text-emerald-700" },
};

const activityMeta = {
  "project-updated": { icon: FolderKanban, tone: "bg-blue-50 text-blue-700" },
  "project-completed": { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
  quote: { icon: FileText, tone: "bg-indigo-50 text-indigo-700" },
  invoice: { icon: Receipt, tone: "bg-orange-50 text-orange-700" },
  "invoice-paid": { icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700" },
  order: { icon: ShoppingCart, tone: "bg-slate-100 text-slate-700" },
};

function StatCard({ title, value, helper, icon, iconBg, iconFg }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{helper}</div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
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
      className="group flex min-h-[128px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
      <div>
        <div className="text-base font-semibold text-slate-900">{label}</div>
        <div className="mt-1 text-sm text-slate-500">{description}</div>
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
  };

  return (
    <div className="flex-1">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Tableau de bord artisan</h1>
        <p className="mt-2 text-sm text-slate-500">
          Une vue en temps réel de vos projets, documents et commandes.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-blue-50">
              Pilotage de l'activité
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Suivez l'avancement de votre activité sans données fictives</h2>
            <p className="mt-2 text-sm text-blue-100/90">
              Toutes les cartes ci-dessous sont alimentées par vos vraies données projets, devis, factures et commandes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">Progression</div>
              <div className="mt-2 text-2xl font-semibold">{stats.completionRate}%</div>
              <div className="mt-1 text-xs text-blue-100/80">Planning + devis + factures</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">Budget cumulé</div>
              <div className="mt-2 text-lg font-semibold">{currency.format(stats.totalBudget || 0)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur col-span-2 sm:col-span-1">
              <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">Factures à suivre</div>
              <div className="mt-2 text-lg font-semibold">{currency.format(stats.unpaidInvoicesAmount || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Chargement du tableau de bord...
        </div>
      ) : error ? (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Projets"
              value={stats.totalProjects}
              helper={`${stats.completedProjects || 0} terminés`}
              icon={<FolderKanban />}
              iconBg="bg-blue-50"
              iconFg="text-blue-600"
            />
            <StatCard
              title="Projets actifs"
              value={stats.activeProjects}
              helper={`${stats.pendingProjects || 0} en attente`}
              icon={<TrendingUp />}
              iconBg="bg-indigo-50"
              iconFg="text-indigo-600"
            />
            <StatCard
              title="Documents émis"
              value={stats.documentsCount}
              helper="Devis et factures générés"
              icon={<Receipt />}
              iconBg="bg-emerald-50"
              iconFg="text-emerald-600"
            />
            <StatCard
              title="Commandes en cours"
              value={stats.inProgressOrders}
              helper="Commandes à suivre"
              icon={<ShoppingCart />}
              iconBg="bg-orange-50"
              iconFg="text-orange-600"
            />
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
                <p className="mt-1 text-sm text-slate-500">Accès direct aux pages les plus utiles pour avancer vite.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ActionCard
                to="/artisan/projects"
                icon={<Plus />}
                label="Nouveau projet"
                description="Créer ou mettre à jour un chantier."
                iconBg="bg-blue-50"
                iconFg="text-blue-600"
              />
              <ActionCard
                to="/artisan/devis/create"
                icon={<ClipboardList />}
                label="Créer un devis"
                description="Préparer un devis à partir d'un vrai projet."
                iconBg="bg-indigo-50"
                iconFg="text-indigo-600"
              />
              <ActionCard
                to="/artisan/factures"
                icon={<Receipt />}
                label="Gérer les factures"
                description="Suivre les documents émis et leur statut."
                iconBg="bg-emerald-50"
                iconFg="text-emerald-600"
              />
              <ActionCard
                to="/artisan/orders"
                icon={<ShoppingCart />}
                label="Voir les commandes"
                description="Contrôler les commandes et livraisons."
                iconBg="bg-orange-50"
                iconFg="text-orange-600"
              />
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Projets récents</h2>
                  <p className="mt-1 text-sm text-slate-500">Les derniers projets réellement enregistrés dans votre compte.</p>
                </div>
                <Link to="/artisan/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                  Voir tout <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {summary?.recentProjects?.length ? (
                  summary.recentProjects.map((project) => {
                    const meta = statusMeta[project.status] || statusMeta.PENDING;
                    return (
                      <div key={project._id} className="rounded-2xl bg-slate-50 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-base font-semibold text-slate-900">{project.title}</div>
                            <div className="mt-1 text-sm text-slate-500">
                              {project.city || "Localisation non renseignée"} • {currency.format(project.budgetTND || 0)}
                            </div>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                            <span>Progression calculee</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="mt-2 h-2.5 rounded-full bg-slate-200">
                            <div className="h-2.5 rounded-full rounded-r-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${Math.max(0, Math.min(100, project.progress || 0))}%` }} />
                          </div>
                          <div className="mt-2 text-xs font-medium text-slate-500">{project.progressLabel || "Mise a jour recente du projet"}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Aucun projet enregistré pour le moment. Créez votre premier projet pour alimenter ce tableau de bord.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Activité récente</h2>
                <p className="mt-1 text-sm text-slate-500">Derniers mouvements réels détectés sur votre espace.</p>
              </div>

              <div className="mt-6 space-y-5">
                {summary?.recentActivity?.length ? (
                  summary.recentActivity.map((item) => {
                    const meta = activityMeta[item.type] || { icon: AlertCircle, tone: "bg-slate-100 text-slate-700" };
                    const Icon = meta.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${meta.tone}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.time}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Pas encore d'activité à afficher.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <SimpleFooter />
    </div>
  );
}
