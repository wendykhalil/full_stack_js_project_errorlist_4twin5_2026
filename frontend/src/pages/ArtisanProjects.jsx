import React from "react";
import {
  Search,
  MapPin,
  Calendar,
  ChevronDown,
  Plus,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';

// Artisan - Projects Page
// Tailwind required

const StatusPill = ({ status }) => {
  const { t } = useTranslation();
  // Mapping des statuts (valeurs brutes) vers les clés de traduction
  const statusKeyMap = {
    "Actif": "artisanProjects.status.active",
    "En attente": "artisanProjects.status.pending",
    "Terminé": "artisanProjects.status.completed",
  };
  const styles = {
    Actif: "bg-indigo-100 text-indigo-700",
    "En attente": "bg-orange-100 text-orange-700",
    Terminé: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {t(statusKeyMap[status] || status)}
    </span>
  );
};

const BudgetBar = ({ used, total, color }) => {
  const { t } = useTranslation();
  const pct = Math.round((used / total) * 100);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">{t('artisanProjects.budgetLabel')}</span>
        <span className="text-slate-900 font-medium">
          {used.toLocaleString()} / {total.toLocaleString()} TND
        </span>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm">
        <span className="text-emerald-600 font-medium">
          +{(total - used).toLocaleString()} TND
        </span>
        <span className="text-slate-500">{pct}% {t('artisanProjects.usedLabel')}</span>
      </div>
    </div>
  );
};

const ProjectCard = ({ title, client, location, start, status, used, total }) => {
  const { t } = useTranslation();
  const color =
    status === "Terminé"
      ? "bg-red-500"
      : status === "En attente"
      ? "bg-slate-300"
      : "bg-indigo-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{client}</p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> {location}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" /> {t('artisanProjects.startLabel')} {start}
        </div>
      </div>

      <BudgetBar used={used} total={total} color={color} />
    </div>
  );
};

export default function ArtisanProjects() {
  const { t } = useTranslation();

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{t('artisanProjects.title')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('artisanProjects.subtitle')}</p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> {t('artisanProjects.newProjectButton')}
        </button>
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('artisanProjects.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-60">
            <select className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="">{t('artisanProjects.filterAllStatuses')}</option>
              <option value="Actif">{t('artisanProjects.status.active')}</option>
              <option value="En attente">{t('artisanProjects.status.pending')}</option>
              <option value="Terminé">{t('artisanProjects.status.completed')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          title="Villa Ben Arous"
          client="Mohammed Ahmed"
          location="Ben Arous"
          start="15/01/2026"
          status="Actif"
          used={28500}
          total={45000}
        />

        <ProjectCard
          title="Appartement Tunis"
          client="Fatima Ben Ali"
          location="Tunis Centre"
          start="01/02/2026"
          status="Actif"
          used={12000}
          total={18000}
        />

        <ProjectCard
          title="Bureau Ariana"
          client="Tech Solutions SARL"
          location="Ariana"
          start="01/03/2026"
          status="En attente"
          used={0}
          total={35000}
        />

        <ProjectCard
          title="Maison Manouba"
          client="Karim Trabelsi"
          location="Manouba"
          start="10/09/2025"
          status="Terminé"
          used={49800}
          total={52000}
        />
      </div>
      <SimpleFooter />
    </div>
  );
}