import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Plus,
  FileText,
  Calendar,
  User,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';

const StatusPill = ({ status }) => {
  const { t } = useTranslation();
  // Mapping des statuts (valeurs brutes) vers les clés de traduction
  const statusKeyMap = {
    "Payée": "artisanFactures.status.paid",
    "En attente": "artisanFactures.status.pending",
    "Retard": "artisanFactures.status.overdue",
  };
  const toneMap = {
    "Payée": "bg-emerald-100 text-emerald-700",
    "En attente": "bg-indigo-100 text-indigo-700",
    "Retard": "bg-red-100 text-red-700",
  };

  const translatedStatus = t(statusKeyMap[status] || status);
  const toneClass = toneMap[status] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {translatedStatus}
    </span>
  );
};

const Money = ({ children }) => (
  <span className="font-semibold text-slate-900">
    {children} TND
  </span>
);

const FactureRow = ({ inv, client, date, amount, status }) => {
  const { t } = useTranslation();
  const icon =
    status === "Payée" ? (
      <CheckCircle2 className="h-5 w-5" />
    ) : status === "Retard" ? (
      <AlertCircle className="h-5 w-5" />
    ) : (
      <Clock3 className="h-5 w-5" />
    );

  const iconTone =
    status === "Payée"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Retard"
      ? "bg-red-50 text-red-700"
      : "bg-indigo-50 text-indigo-700";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconTone}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold text-slate-900">
              {inv}
            </div>
            <StatusPill status={status} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              {client}
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              {date}
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              {t('artisanFactures.amountLabel')} <Money>{amount.toLocaleString()}</Money>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Eye className="h-4 w-4" />
          {t('artisanFactures.viewButton')}
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4" />
          {t('artisanFactures.downloadButton')}
        </button>
      </div>
    </div>
  );
};

export default function ArtisanFactures() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('artisanFactures.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('artisanFactures.subtitle')}
          </p>
        </div>

        <button
          onClick={() => navigate("/artisan/factures/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {t('artisanFactures.newInvoiceButton')}
        </button>
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('artisanFactures.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-60">
            <select className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="">{t('artisanFactures.filterAllStatuses')}</option>
              <option value="Payée">{t('artisanFactures.status.paid')}</option>
              <option value="En attente">{t('artisanFactures.status.pending')}</option>
              <option value="Retard">{t('artisanFactures.status.overdue')}</option>
            </select>

            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-8 space-y-4">
        <FactureRow
          inv="INV001"
          client="Mohammed Ahmed"
          date="15/02/2026"
          amount={3200}
          status="Payée"
        />
        <FactureRow
          inv="INV002"
          client="Fatima Ben Ali"
          date="18/02/2026"
          amount={1250}
          status="En attente"
        />
        <FactureRow
          inv="INV003"
          client="Tech Solutions SARL"
          date="05/02/2026"
          amount={4800}
          status="Retard"
        />
      </div>
      <SimpleFooter />
    </div>
  );
}