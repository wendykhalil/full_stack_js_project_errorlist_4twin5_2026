import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Stepper = ({ step }) => (
  <div className="mt-6 flex items-center gap-4">
    {[1, 2, 3].map((n) => (
      <React.Fragment key={n}>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            step >= n ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {n}
        </div>
        {n !== 3 && (
          <div
            className={`h-1 flex-1 rounded-full ${
              step > n ? "bg-emerald-600" : "bg-slate-200"
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default function ArtisanFactureStep2() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">{t('artisanFactureStep2.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('artisanFactureStep2.subtitle')}</p>

      <Stepper step={2} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('artisanFactureStep2.formTitle')}</h2>

        <div className="mt-6 rounded-2xl bg-slate-50 p-6">
          <input
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('artisanFactureStep2.itemDescriptionPlaceholder')}
          />

          <div className="grid gap-4 md:grid-cols-4">
            <input className="rounded-xl border px-4 py-3 text-sm" defaultValue="1" />
            <input className="rounded-xl border px-4 py-3 text-sm" placeholder={t('artisanFactureStep2.unitPlaceholder')} />
            <input className="rounded-xl border px-4 py-3 text-sm" defaultValue="0" />
            <input className="rounded-xl border px-4 py-3 text-sm" defaultValue="0.00" />
          </div>
        </div>

        <div className="mt-6 space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>{t('artisanFactureStep2.subtotalLabel')}</span>
            <span>0.00 TND</span>
          </div>
          <div className="flex justify-between">
            <span>{t('artisanFactureStep2.vatLabel', { rate: 19 })}</span>
            <span>0.00 TND</span>
          </div>
          <div className="flex justify-between">
            <span>{t('artisanFactureStep2.stampLabel')}</span>
            <span>0.60 TND</span>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <span className="text-lg font-semibold">{t('artisanFactureStep2.totalLabel')}</span>
          <span className="text-lg font-semibold text-emerald-600">0.60 TND</span>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate("/artisan/factures/new")}
            className="flex-1 rounded-xl border py-3 font-medium"
          >
            {t('artisanFactureStep2.backButton')}
          </button>

          <button
            onClick={() => navigate("/artisan/factures/new/step-3")}
            className="flex-1 rounded-xl bg-indigo-700 py-3 font-semibold text-white"
          >
            {t('artisanFactureStep2.nextButton')}
          </button>
        </div>
      </div>
    </main>
  );
}