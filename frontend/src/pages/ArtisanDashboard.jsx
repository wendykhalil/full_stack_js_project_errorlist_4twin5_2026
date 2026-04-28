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
  Briefcase,
  Brain,
  BarChart3,
  Wallet,
  Activity,
  Zap,
  ChevronRight,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useAuth } from "../auth/AuthContext";
import { getArtisanDashboardSummary, getMySubscription } from "../auth/api";
import { Hint } from "../components/MouseTooltip";

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

/* ── Small reusable stat card ── */
function StatCard({ title, value, helper, icon, iconBg, iconFg, hint }) {
  const card = (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-sm`}>
          {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
        </div>
      </div>
    </div>
  );
  return hint ? <Hint text={hint}>{card}</Hint> : card;
}

/* ── Quick action card ── */
function ActionCard({ to, icon, label, description, iconBg, iconFg, hint }) {
  const card = (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col"
    >
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
      <h3 className="text-sm font-bold text-slate-900">{label}</h3>
      <p className="mt-1.5 text-xs text-slate-500 flex-1 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
        Accéder <ArrowUpRight className="ml-1 h-3 w-3" />
      </div>
    </Link>
  );
  return hint ? <Hint text={hint}>{card}</Hint> : card;
}

/* ── Section header ── */
function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
          {React.cloneElement(icon, { className: "h-5 w-5 text-indigo-600" })}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function ArtisanDashboard() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [subWarning, setSubWarning] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getArtisanDashboardSummary({ token });
      setSummary(data);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Impossible de charger le tableau de bord.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    load();
    getMySubscription({ token }).then(res => {
      const d = res?.data;
      if (d && d.daysUntilExpiry !== null && d.daysUntilExpiry <= 7 && d.status === 'ACTIVE' && d.plan !== 'FREE') {
        setSubWarning({ days: d.daysUntilExpiry, isOnTrial: d.isOnTrial });
      }
    }).catch(() => {});
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 space-y-6 pb-2">

      {/* ── Subscription expiry warning ── */}
      {subWarning && (
        <Link to="/artisan/subscription"
          className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${subWarning.days <= 3 ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`h-5 w-5 shrink-0 ${subWarning.days <= 3 ? 'text-red-500' : 'text-orange-500'}`} />
            <p className={`text-sm font-medium ${subWarning.days <= 3 ? 'text-red-700' : 'text-orange-700'}`}>
              {subWarning.isOnTrial ? 'Votre essai gratuit' : 'Votre abonnement'} expire dans {subWarning.days} jour(s). Cliquez pour renouveler.
            </p>
          </div>
          <span className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white ${subWarning.days <= 3 ? 'bg-red-600' : 'bg-orange-500'}`}>
            Renouveler
          </span>
        </Link>
      )}

      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vue d'ensemble de votre activité professionnelle
          {refreshing && <span className="ml-2 text-indigo-500">· Mise à jour…</span>}
        </p>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-slate-500 text-sm">Chargement de votre tableau de bord…</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ══════════════════════════════════════════
              SECTION 1 — Vue financière & progression
          ══════════════════════════════════════════ */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 -translate-y-12 translate-x-12">
              <div className="h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <Activity className="mr-1 h-3 w-3" />
                  Activité en temps réel
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">Résumé financier</h2>
              <p className="text-indigo-200 text-sm mb-5">Données basées sur vos projets et commandes réels</p>
              <div className="grid grid-cols-3 gap-3">
                <Hint text="Taux de progression moyen calculé sur l'ensemble de vos projets actifs.">
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">Progression</p>
                    <p className="mt-2 text-2xl font-bold text-white">{stats.completionRate}%</p>
                    <p className="text-xs text-indigo-300 mt-1">Taux moyen</p>
                  </div>
                </Hint>
                <Hint text="Somme des budgets de tous vos projets actifs et en attente.">
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">Budget total</p>
                    <p className="mt-2 text-lg font-bold text-white">{currency.format(stats.totalBudget || 0)}</p>
                    <p className="text-xs text-indigo-300 mt-1">Tous projets</p>
                  </div>
                </Hint>
                <Hint text="Montant total des factures envoyées mais pas encore réglées par vos clients.">
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">Impayées</p>
                    <p className="mt-2 text-lg font-bold text-white">{currency.format(stats.unpaidInvoicesAmount || 0)}</p>
                    <p className="text-xs text-indigo-300 mt-1">À encaisser</p>
                  </div>
                </Hint>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 2 — Chiffres clés (4 stats)
          ══════════════════════════════════════════ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 rounded-full bg-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Chiffres clés</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total projets"
                value={stats.totalProjects}
                helper={`${stats.completedProjects || 0} terminés · ${stats.pendingProjects || 0} en attente`}
                icon={<FolderKanban />}
                iconBg="bg-indigo-50"
                iconFg="text-indigo-600"
                hint="Nombre total de projets créés, dont les terminés et ceux en attente."
              />
              <StatCard
                title="Projets actifs"
                value={stats.activeProjects}
                helper="En cours de réalisation"
                icon={<TrendingUp />}
                iconBg="bg-emerald-50"
                iconFg="text-emerald-600"
                hint="Projets actuellement en cours de réalisation sur vos chantiers."
              />
              <StatCard
                title="Documents émis"
                value={stats.documentsCount}
                helper="Devis + Factures"
                icon={<FileText />}
                iconBg="bg-orange-50"
                iconFg="text-orange-600"
                hint="Total des devis et factures émis depuis la création de votre compte."
              />
              <StatCard
                title="Commandes en cours"
                value={stats.inProgressOrders}
                helper="Chez vos fournisseurs"
                icon={<ShoppingCart />}
                iconBg="bg-blue-50"
                iconFg="text-blue-600"
                hint="Commandes de matériaux en cours de traitement par vos fournisseurs."
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 3 — Actions rapides (2 groupes)
          ══════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Zap />}
              title="Actions rapides"
              subtitle="Accédez directement aux fonctionnalités les plus utilisées"
            />

            {/* Groupe A : Projets & Documents */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-1 rounded-full bg-indigo-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projets &amp; Documents</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ActionCard
                  to="/artisan/projects"
                  icon={<Plus />}
                  label="Nouveau projet"
                  description="Créer ou mettre à jour un chantier"
                  iconBg="bg-indigo-50"
                  iconFg="text-indigo-600"
                  hint="Créer un nouveau chantier ou projet de construction et suivre son avancement."
                />
                <ActionCard
                  to="/artisan/devis/create"
                  icon={<ClipboardList />}
                  label="Créer un devis"
                  description="Préparer un devis professionnel pour un client"
                  iconBg="bg-emerald-50"
                  iconFg="text-emerald-600"
                  hint="Générer un devis professionnel pour un client à partir d'un projet existant."
                />
                <ActionCard
                  to="/artisan/factures"
                  icon={<Receipt />}
                  label="Gérer les factures"
                  description="Consulter et télécharger vos documents émis"
                  iconBg="bg-orange-50"
                  iconFg="text-orange-600"
                  hint="Consulter, télécharger et gérer tous vos devis et factures émis."
                />
                <ActionCard
                  to="/artisan/orders"
                  icon={<ShoppingCart />}
                  label="Voir les commandes"
                  description="Contrôler les commandes et livraisons"
                  iconBg="bg-blue-50"
                  iconFg="text-blue-600"
                  hint="Suivre l'état de vos commandes de matériaux auprès des fournisseurs."
                />
              </div>
            </div>

            {/* Groupe B : Outils IA & Analyse */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-1 rounded-full bg-purple-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outils IA &amp; Analyse</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ActionCard
                  to="/artisan/ml-predictions"
                  icon={<Brain />}
                  label="Prédictions IA"
                  description="Estimez durée, coût et risque de retard de vos projets"
                  iconBg="bg-purple-50"
                  iconFg="text-purple-600"
                  hint="Utilisez l'IA pour obtenir des estimations précises avant de démarrer un projet."
                />
                <ActionCard
                  to="/artisan/subscription"
                  icon={<Wallet />}
                  label="Mon abonnement"
                  description="Gérer votre plan et vos droits d'accès"
                  iconBg="bg-amber-50"
                  iconFg="text-amber-600"
                  hint="Consulter et renouveler votre abonnement BMP.tn."
                />
                <ActionCard
                  to="/artisan/portfolio"
                  icon={<Briefcase />}
                  label="Mon portfolio"
                  description="Mettre à jour vos réalisations et photos"
                  iconBg="bg-rose-50"
                  iconFg="text-rose-600"
                  hint="Ajouter des photos et descriptions de vos projets réalisés pour attirer de nouveaux clients."
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 4 — Projets récents + Activité
          ══════════════════════════════════════════ */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Projets récents */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<FolderKanban />}
                title="Projets récents"
                subtitle="Vos derniers projets enregistrés"
                action={
                  <Link to="/artisan/projects" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    Voir tout <ChevronRight className="h-3 w-3" />
                  </Link>
                }
              />
              <div className="space-y-3">
                {summary?.recentProjects?.length ? (
                  summary.recentProjects.map((project) => {
                    const meta = statusMeta[project.status] || statusMeta.PENDING;
                    return (
                      <div key={project._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-indigo-200 hover:shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">{project.title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>{project.city || "Localisation non renseignée"}</span>
                              <span>·</span>
                              <span>{currency.format(project.budgetTND || 0)}</span>
                            </div>
                          </div>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                            <span>Progression</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
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
                    <FolderKanban className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">Aucun projet pour le moment</p>
                    <Link to="/artisan/projects" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Créer votre premier projet →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Activité récente */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<Activity />}
                title="Activité récente"
                subtitle="Derniers mouvements sur votre espace"
              />
              <div className="space-y-3">
                {summary?.recentActivity?.length ? (
                  summary.recentActivity.map((item) => {
                    const meta = activityMeta[item.type] || { icon: AlertCircle, tone: "bg-slate-100 text-slate-700" };
                    const Icon = meta.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-slate-50">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
                          <Icon className="h-4 w-4" />
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
                    <Activity className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">Aucune activité récente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      </div>{/* end flex-1 */}
      <SimpleFooter />
    </div>
  );
}
