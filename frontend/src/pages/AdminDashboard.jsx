import React from "react";
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertCircle,
  UserPlus,
  FileText,
} from "lucide-react";

const StatCard = ({ icon, label, value, delta, iconBg = "bg-slate-100", iconFg = "text-slate-700" }) => (
  <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconFg}` })}
      </div>
      <div className="text-sm font-medium text-emerald-600">{delta}</div>
    </div>
    <div className="mt-4 text-sm text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
  </div>
);

const ProgressRow = ({ label, valueText, pct, barClass }) => (
  <div>
    <div className="flex items-center justify-between text-sm">
      <div className="text-slate-700">{label}</div>
      <div className="text-slate-500">{valueText}</div>
    </div>
    <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
      <div className={`h-2.5 rounded-full ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  </div>
);

const AlertItem = ({ icon, title, subtitle, tone = "red" }) => {
  const tones = {
    red: { wrap: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
    amber: { wrap: "bg-amber-50", icon: "text-amber-700", border: "border-amber-100" },
    indigo: { wrap: "bg-indigo-50", icon: "text-indigo-700", border: "border-indigo-100" },
  };
  const t = tones[tone] ?? tones.red;

  return (
    <div className={`flex gap-3 rounded-2xl border ${t.border} ${t.wrap} p-4`}>
      <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 ${t.icon}`}>
        {React.cloneElement(icon, { className: "h-5 w-5" })}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 truncate text-sm text-slate-600">{subtitle}</div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  return (
    <main className="mx-auto max-w-6xl py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Tableau de Bord Admin</h1>
        <p className="mt-2 text-sm text-slate-500">Vue d&apos;ensemble de la plateforme BMP.tn</p>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users />} label="Utilisateurs Actifs" value="1,247" delta="+12%" iconBg="bg-indigo-50" iconFg="text-indigo-600" />
        <StatCard icon={<ShoppingCart />} label="Transactions" value="342" delta="+8%" iconBg="bg-emerald-50" iconFg="text-emerald-600" />
        <StatCard icon={<DollarSign />} label="Revenus (mois)" value="85,420 TND" delta="+23%" iconBg="bg-orange-50" iconFg="text-orange-600" />
        <StatCard icon={<Package />} label="Produits Actifs" value="3,456" delta="+15%" iconBg="bg-slate-100" iconFg="text-slate-700" />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Répartition des utilisateurs</h2>
          <div className="mt-6 space-y-6">
            <ProgressRow label="Artisans" valueText="847 (68%)" pct={68} barClass="bg-indigo-600" />
            <ProgressRow label="Fournisseurs" valueText="245 (20%)" pct={20} barClass="bg-orange-500" />
            <ProgressRow label="Prescripteurs" valueText="155 (12%)" pct={12} barClass="bg-emerald-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Alertes récentes</h2>
          <div className="mt-6 space-y-4">
            <AlertItem icon={<AlertCircle />} title="Transaction échouée" subtitle="ColorPro SARL - 3,200 TND" tone="red" />
            <AlertItem icon={<UserPlus />} title="Nouvelle inscription en attente" subtitle="Mohamed Gharbi - Artisan" tone="amber" />
            <AlertItem icon={<FileText />} title="Rapport mensuel disponible" subtitle="Février 2026" tone="indigo" />
          </div>
        </div>
      </section>
    </main>
  );
}
