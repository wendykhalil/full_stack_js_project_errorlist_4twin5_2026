import React, { useEffect, useState } from "react";
import ReadCardButton from '../components/ReadCardButton';
import {
  Users,
  Star,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Award
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

function StatCard({ icon, label, value, helper, iconBg = "bg-slate-100", iconFg = "text-slate-700", trend = null }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
          {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{helper}</div>
    </div>
  );
}

function ArtisanCard({ artisan, rank }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 truncate">{artisan.name}</div>
        <div className="text-sm text-slate-500">{artisan.trade} â€¢ {artisan.region}</div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          {artisan.avgRating}
        </div>
        <div className="text-xs text-slate-500">{artisan.totalReviews} avis</div>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-900 truncate">{project.title}</div>
          <div className="text-sm text-slate-500 mt-1">
            {project.artisanId?.firstName} {project.artisanId?.lastName}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-slate-600">
          {project.budgetTND ? `${project.budgetTND.toLocaleString()} TND` : 'Budget non dÃ©fini'}
        </div>
        <div className="text-slate-500">
          {new Date(project.createdAt).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
}

const PIE_COLORS = ["#4f46e5", "#f97316", "#10b981", "#64748b", "#ef4444", "#06b6d4"];

export default function AdminArtisanDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques');
        }

        const data = await response.json();
        if (active) {
          setStats(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Impossible de charger les statistiques.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (token) {
      loadStats();
    }

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Chargement des statistiques artisans...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const artisanStats = stats?.artisans || { total: 0, active: 0, inactive: 0 };
  const projectStats = stats?.projects || { total: 0, active: 0, completed: 0, pending: 0 };
  const topRated = stats?.topRatedArtisans || [];
  const mostActive = stats?.mostActiveArtisans || [];
  const recentProjects = stats?.recentProjects || [];
  const monthlyTrends = stats?.monthlyTrends || [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Dashboard Artisans
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Statistiques en temps rÃ©el sur les artisans et leurs projets
        </p>
      </div>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users />}
          label="Total Artisans"
          value={artisanStats.total}
          helper={`${artisanStats.active} actifs, ${artisanStats.inactive} inactifs`}
          iconBg="bg-blue-50"
          iconFg="text-blue-600"
        />
        <StatCard
          icon={<Briefcase />}
          label="Projets Totaux"
          value={projectStats.total}
          helper={`${projectStats.active} en cours`}
          iconBg="bg-green-50"
          iconFg="text-green-600"
        />
        <StatCard
          icon={<CheckCircle />}
          label="Projets TerminÃ©s"
          value={projectStats.completed}
          helper={`${Math.round((projectStats.completed / projectStats.total) * 100 || 0)}% de rÃ©ussite`}
          iconBg="bg-emerald-50"
          iconFg="text-emerald-600"
        />
        <StatCard
          icon={<Clock />}
          label="En Attente"
          value={projectStats.pending}
          helper="Projets en attente de validation"
          iconBg="bg-yellow-50"
          iconFg="text-yellow-600"
        />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Ã‰volution Mensuelle des Projets</h2><ReadCardButton /></div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">RÃ©partition des Statuts</h2><ReadCardButton /></div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Actifs', value: projectStats.active },
                    { name: 'TerminÃ©s', value: projectStats.completed },
                    { name: 'En attente', value: projectStats.pending }
                  ]} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={110} 
                  label
                >
                  {[
                    { name: 'Actifs', value: projectStats.active },
                    { name: 'TerminÃ©s', value: projectStats.completed },
                    { name: 'En attente', value: projectStats.pending }
                  ].map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Top Performers */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-500" />
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Top Artisans (Notes)</h2><ReadCardButton /></div>
          </div>
          <div className="space-y-3">
            {topRated.length > 0 ? (
              topRated.slice(0, 5).map((artisan, index) => (
                <ArtisanCard key={artisan.artisanId} artisan={artisan} rank={index + 1} />
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">
                Aucun artisan avec des avis pour le moment
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Plus Actifs (Projets)</h2><ReadCardButton /></div>
          </div>
          <div className="space-y-3">
            {mostActive.length > 0 ? (
              mostActive.slice(0, 5).map((artisan, index) => (
                <div key={artisan.artisanId} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{artisan.name}</div>
                    <div className="text-sm text-slate-500">{artisan.trade} â€¢ {artisan.region}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{artisan.projectCount} projets</div>
                    <div className="text-xs text-slate-500">{artisan.completionRate}% terminÃ©s</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">
                Aucun projet enregistrÃ© pour le moment
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Projets RÃ©cents</h2><ReadCardButton /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))
          ) : (
            <div className="col-span-full text-center text-slate-500 py-8">
              Aucun projet rÃ©cent Ã  afficher
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}


