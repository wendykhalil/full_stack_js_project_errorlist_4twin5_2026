import React from "react";
import {
  FolderKanban,
  Receipt,
  ShoppingCart,
  ArrowUpRight,
  Plus,
  ClipboardList,
  FileSignature,
  Truck,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, icon, iconBg = "bg-slate-100", iconFg = "text-slate-700" }) => (
  <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
    </div>
  </div>
);

const ActionCard = ({ icon, label, iconBg = "bg-slate-100", iconFg = "text-slate-700" }) => (
  <button className="group relative flex min-h-[120px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} transition group-hover:scale-[1.02]`}>
      {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
    </div>
    <div className="mt-4 text-sm font-semibold text-slate-900">{label}</div>
  </button>
);

const Pill = ({ children, tone = "indigo" }) => {
  const tones = {
    indigo: "bg-indigo-100 text-indigo-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tones[tone] ?? tones.indigo}`}>
      {children}
    </span>
  );
};

// ✅ CORRIGÉ: Ajout de useTranslation dans ProjectCard
const ProjectCard = ({ title, client, budget, remaining, status, statusTone = "indigo" }) => {
  const { t } = useTranslation(); // ✅ Ajouté
  
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{client}</div>
        </div>
        <Pill tone={statusTone}>{status}</Pill>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="text-slate-600">
          {t('artisanDashboard.projectCard.budget')} <span className="font-medium text-slate-900">{budget}</span>
        </div>
        <div className="text-emerald-600 font-medium">{remaining}</div>
      </div>
    </div>
  );
};

// ✅ CORRIGÉ: Ajout de useTranslation et correction du conflit de noms
const ActivityRow = ({ icon, title, time, tone = "slate" }) => {
  
  
  const toneStyles = { // ✅ Renommé de 'tones' à 'toneStyles' pour éviter la confusion
    green: { bg: "bg-emerald-50", fg: "text-emerald-700" },
    blue: { bg: "bg-indigo-50", fg: "text-indigo-700" },
    orange: { bg: "bg-orange-50", fg: "text-orange-700" },
    red: { bg: "bg-red-50", fg: "text-red-700" },
    slate: { bg: "bg-slate-100", fg: "text-slate-700" },
  };
  
  const currentTone = toneStyles[tone] ?? toneStyles.slate; // ✅ Renommé pour éviter le conflit avec la fonction t

  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${currentTone.bg} ${currentTone.fg}`}>
        {React.cloneElement(icon, { className: "h-5 w-5" })}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">{time}</div>
      </div>
    </div>
  );
};

export default function ArtisanDashboard() {
  const { t } = useTranslation();

  return (
    <div className="flex-1">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {t('artisanDashboard.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t('artisanDashboard.subtitle')}
        </p>
      </div>

      {/* Welcome card */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('artisanDashboard.welcome.title')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('artisanDashboard.welcome.description')}</p>
      </div>

      {/* Quick Actions */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('artisanDashboard.quickActions.title')}</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ActionCard icon={<Plus />} label={t('artisanDashboard.quickActions.newProject')} iconBg="bg-indigo-50" iconFg="text-indigo-600" />
          <ActionCard icon={<ClipboardList />} label={t('artisanDashboard.quickActions.createQuote')} iconBg="bg-orange-50" iconFg="text-orange-600" />
          <ActionCard icon={<Receipt />} label={t('artisanDashboard.quickActions.newInvoice')} iconBg="bg-emerald-50" iconFg="text-emerald-600" />
          <ActionCard icon={<ShoppingCart />} label={t('artisanDashboard.quickActions.order')} iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        </div>
      </section>

      {/* Bottom panels */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t('artisanDashboard.recentProjects.title')}</h2>
            <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
              {t('artisanDashboard.recentProjects.viewAll')} <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 space-y-4">
            <ProjectCard 
              title={t('artisanDashboard.recentProjects.project1.title')} 
              client={t('artisanDashboard.recentProjects.project1.client')} 
              budget="45,000 TND" 
              remaining={t('artisanDashboard.recentProjects.project1.remaining')} 
              status={t('artisanDashboard.status.active')} 
              statusTone="indigo" 
            />
            <ProjectCard 
              title={t('artisanDashboard.recentProjects.project2.title')} 
              client={t('artisanDashboard.recentProjects.project2.client')} 
              budget="18,000 TND" 
              remaining={t('artisanDashboard.recentProjects.project2.remaining')} 
              status={t('artisanDashboard.status.active')} 
              statusTone="indigo" 
            />
            <ProjectCard 
              title={t('artisanDashboard.recentProjects.project3.title')} 
              client={t('artisanDashboard.recentProjects.project3.client')} 
              budget="35,000 TND" 
              remaining={t('artisanDashboard.recentProjects.project3.remaining')} 
              status={t('artisanDashboard.status.pending')} 
              statusTone="slate" 
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('artisanDashboard.recentActivity.title')}</h2>

          <div className="mt-6 space-y-5">
            <ActivityRow 
              icon={<CheckCircle2 />} 
              title={t('artisanDashboard.recentActivity.invoicePaid', { invoice: 'INV001' })} 
              time={t('artisanDashboard.recentActivity.timeAgo', { hours: 2 })} 
              tone="green" 
            />
            <ActivityRow 
              icon={<Clock3 />} 
              title={t('artisanDashboard.recentActivity.quoteSent', { quote: 'Q002', client: t('artisanDashboard.recentActivity.clientFatima') })} 
              time={t('artisanDashboard.recentActivity.timeAgo', { hours: 5 })} 
              tone="blue" 
            />
            <ActivityRow 
              icon={<Truck />} 
              title={t('artisanDashboard.recentActivity.orderShipped', { order: 'ORD002' })} 
              time={t('artisanDashboard.recentActivity.yesterday')} 
              tone="orange" 
            />
            <ActivityRow 
              icon={<AlertCircle />} 
              title={t('artisanDashboard.recentActivity.invoiceOverdue', { invoice: 'INV003' })} 
              time={t('artisanDashboard.recentActivity.daysAgo', { days: 2 })} 
              tone="red" 
            />
          </div>
        </div>
      </section>
      <SimpleFooter />
    </div>
  );
}