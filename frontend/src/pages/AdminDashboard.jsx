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
  import SimpleFooter from "../components/Footer";
  import { useTranslation } from 'react-i18next';

  // Les composants StatCard, ProgressRow, AlertItem restent inchangés (non utilisés pour l'instant)
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
    const { t } = useTranslation();

    return (
      <div className="flex-1">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('adminDashboard.title')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('adminDashboard.subtitle')}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('adminDashboard.welcomeTitle')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('adminDashboard.welcomeDescription')}</p>
        </div>
        <SimpleFooter />
      </div>
    );
  }