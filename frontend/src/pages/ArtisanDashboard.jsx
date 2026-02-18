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

const StatCard = ({
  title,
  value,
  icon,
  iconBg = "bg-slate-100",
  iconFg = "text-slate-700",
}) => (
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

const ProjectCard = ({ title, client, budget, remaining, status, statusTone = "indigo" }) => (
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
        Budget: <span className="font-medium text-slate-900">{budget}</span>
      </div>
      <div className="text-emerald-600 font-medium">{remaining}</div>
    </div>
  </div>
);

const ActivityRow = ({ icon, title, time, tone = "slate" }) => {
  const tones = {
    green: { bg: "bg-emerald-50", fg: "text-emerald-700" },
    blue: { bg: "bg-indigo-50", fg: "text-indigo-700" },
    orange: { bg: "bg-orange-50", fg: "text-orange-700" },
    red: { bg: "bg-red-50", fg: "text-red-700" },
    slate: { bg: "bg-slate-100", fg: "text-slate-700" },
  };
  const t = tones[tone] ?? tones.slate;

  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${t.bg} ${t.fg}`}>
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
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Tableau de Bord
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Projets Actifs" value="2" icon={<FolderKanban />} iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        <StatCard title="Devis" value="3" icon={<FileSignature />} iconBg="bg-orange-50" iconFg="text-orange-600" />
        <StatCard title="Factures en attente" value="2" icon={<Receipt />} iconBg="bg-emerald-50" iconFg="text-emerald-600" />
        <StatCard title="Commandes" value="3" icon={<ShoppingCart />} iconBg="bg-slate-100" iconFg="text-slate-700" />
        <StatCard title="Marge Bénéficiaire" value="39.8%" icon={<ArrowUpRight />} iconBg="bg-emerald-50" iconFg="text-emerald-600" />
      </section>

      {/* Quick Actions */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Actions Rapides</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ActionCard icon={<Plus />} label="Nouveau Projet" iconBg="bg-indigo-50" iconFg="text-indigo-600" />
          <ActionCard icon={<ClipboardList />} label="Créer un Devis" iconBg="bg-orange-50" iconFg="text-orange-600" />
          <ActionCard icon={<Receipt />} label="Nouvelle Facture" iconBg="bg-emerald-50" iconFg="text-emerald-600" />
          <ActionCard icon={<ShoppingCart />} label="Commander" iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        </div>
      </section>

      {/* Bottom panels */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Projets Récents</h2>
            <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
              Voir tout <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 space-y-4">
            <ProjectCard title="Villa Ben Arous" client="Mohammed Ahmed" budget="45,000 TND" remaining="37% restant" status="Actif" statusTone="indigo" />
            <ProjectCard title="Appartement Tunis" client="Fatima Ben Ali" budget="18,000 TND" remaining="33% restant" status="Actif" statusTone="indigo" />
            <ProjectCard title="Bureau Ariana" client="Tech Solutions SARL" budget="35,000 TND" remaining="100% restant" status="En attente" statusTone="slate" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Activité Récente</h2>

          <div className="mt-6 space-y-5">
            <ActivityRow icon={<CheckCircle2 />} title="Facture INV001 payée" time="Il y a 2h" tone="green" />
            <ActivityRow icon={<Clock3 />} title="Devis Q002 envoyé à Fatima Ben Ali" time="Il y a 5h" tone="blue" />
            <ActivityRow icon={<Truck />} title="Commande ORD002 expédiée" time="Hier" tone="orange" />
            <ActivityRow icon={<AlertCircle />} title="Facture INV003 en retard" time="Il y a 2j" tone="red" />
          </div>
        </div>
      </section>
    </main>
  );
}
